function stringFromUTF8Array(data) {
  // from https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/
  var extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
  var count = data.length;
  var str = '';
  for (var index = 0; index < count;) {
    // eslint-disable-next-line no-plusplus
    var ch = data[index++];
    // eslint-disable-next-line no-bitwise
    if (ch & 0x80) {
      // eslint-disable-next-line no-bitwise
      var extra = extraByteMap[(ch >> 3) & 0x07];
      // eslint-disable-next-line no-bitwise
      if (!(ch & 0x40) || !extra || ((index + extra) > count)) {
        return null;
      }
      // eslint-disable-next-line no-bitwise
      ch &= (0x3F >> extra);
      for (; extra > 0; extra -= 1) {
        // eslint-disable-next-line no-plusplus
        var chx = data[index++];
        // eslint-disable-next-line no-bitwise
        if ((chx & 0xC0) !== 0x80) {
          return null;
        }
        // eslint-disable-next-line no-bitwise
        ch = (ch << 6) | (chx & 0x3F);
      }
    }
    str += String.fromCharCode(ch);
  }
  return str;
}

function BitExtract(dataByte) {
  // BINARY EXTRACTING UTILITIES - Many workarounds here are only because
  // Dataview and other newer features are not available in ES5 (required by chirpstack).
  // basically a class (which is not directly supported in ES5)
  this.data = dataByte;
  this.offset = 0;
}

BitExtract.prototype._assertOnRemainingLength = function (lengthBits) {
  if (lengthBits === 0) { throw Error('invalid zero length bit field'); }
  if (this.offset + lengthBits > 8) { throw Error('invalid number of bits extracted'); }
};

BitExtract.prototype.getBits = function (lengthBits) {
  this._assertOnRemainingLength(lengthBits);
  var mask = Math.pow(2, lengthBits) - 1;
  // eslint-disable-next-line no-bitwise
  var res = (this.data >> this.offset) & mask;
  this.offset += lengthBits;
  return lengthBits === 1 ? Boolean(res) : res;
};

function BinaryExtract(buffer) {
  // everything is little-endian for now
  this.buffer = buffer;
  this.offset = 0;
}

BinaryExtract.prototype.availableLen = function () {
  return this.buffer.length - this.offset;
};

BinaryExtract.prototype._assertOnRemainingLength = function (length) {
  if (length > this.availableLen()) { throw Error('invalid buffer length: too short'); }
};

BinaryExtract.prototype.getUint8 = function () {
  this._assertOnRemainingLength(1);
  // eslint-disable-next-line no-plusplus
  return this.buffer[this.offset++];
};

BinaryExtract.prototype.getInt8 = function () {
  var res = this.getUint8();
  return res > 0x7F ? res - 0x100 : res;
};

BinaryExtract.prototype.getUint16 = function () {
  this._assertOnRemainingLength(2);
  // eslint-disable-next-line no-plusplus
  var res = this.buffer[this.offset++] + this.buffer[this.offset++] * 256;
  return res;
};

BinaryExtract.prototype.getInt16 = function () {
  var res = this.getUint16();
  return res > 0x7FFF ? res - 0x10000 : res;
};

BinaryExtract.prototype.getUint24 = function () {
  this._assertOnRemainingLength(3);
  // eslint-disable-next-line no-plusplus
  var res = this.buffer[this.offset++] + this.buffer[this.offset++] * 256
    // eslint-disable-next-line no-plusplus
    + this.buffer[this.offset++] * 65536;
  return res;
};

BinaryExtract.prototype.getUint32 = function () {
  this._assertOnRemainingLength(4);
  // eslint-disable-next-line no-plusplus
  var res = this.buffer[this.offset++] + this.buffer[this.offset++] * 256
    // eslint-disable-next-line no-plusplus
    + this.buffer[this.offset++] * 65536 + this.buffer[this.offset++] * 16777216;
  return res;
};

BinaryExtract.prototype.getInt32 = function () {
  var res = this.getUint32();
  return res > 0x7FFFFFFF ? res - 0x100000000 : res;
};

BinaryExtract.prototype.getUint64 = function () {
  var first = this.getUint32();
  var second = this.getUint32();
  // since double can safely represent needed range,
  // its used MAX_SAFE_INTEGER → 9_007_199_254_740_991
  var res = first + second * 0x100000000;
  return res;
};

BinaryExtract.prototype.getTextUtf8 = function (len) {
  this._assertOnRemainingLength(len);
  var res = stringFromUTF8Array(this.buffer.slice(this.offset, this.offset + len));
  this.offset += len;
  return res;
};

BinaryExtract.prototype.getUint8Bits = function () {
  return new BitExtract(this.getUint8());
};

BinaryExtract.prototype.getRaw = function (len) {
  this._assertOnRemainingLength(len);
  var res = this.buffer.slice(this.offset, this.offset + len);
  this.offset += len;
  return res;
};

BinaryExtract.prototype.getFloat = function () {
  var bytes = this.getUint32();
  // from https://stackoverflow.com/a/16001019/12636611
  // eslint-disable-next-line no-bitwise
  var sign = (bytes & 0x80000000) ? -1 : 1;
  // eslint-disable-next-line no-bitwise
  var exponent = ((bytes >> 23) & 0xFF) - 127;
  // eslint-disable-next-line no-bitwise
  var significand = (bytes & ~(-1 << 23));

  if (exponent === 128) { return sign * ((significand) ? Number.NaN : Number.POSITIVE_INFINITY); }

  if (exponent === -127) {
    if (significand === 0) return sign * 0.0;
    exponent = -126;
    // eslint-disable-next-line no-bitwise
    significand /= (1 << 22);
  } else {
    // eslint-disable-next-line no-bitwise
    significand = (significand | (1 << 23)) / (1 << 23);
  }
  return sign * significand * Math.pow(2, exponent);
};

function pad(number, length) {
  var str = '' + number;
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
}

function intToHexStr(int, len) {
  return pad(int.toString(16).toUpperCase(), len);
}

function objToList(obj) {
  var res = [];
  // eslint-disable-next-line no-restricted-syntax
  for (var key in obj) {
    if (obj[key] !== undefined && obj[key]) {
      res.push(key);
    }
  }
  return res;
}

/**
 * tmbus JavaScript Library v1.0.0
 * https://github.com/dev-lab/tmbus
 *
 * Copyright (c) 2023 Taras Greben
 * Released under the Apache License
 * https://dev-lab.github.com/tmbus/LICENSE
 */

 function ln(t) {
	return t ? t.length || 0 : 0;
}

function sNc(c, i) {
	return i > 0 ? Array(i + 1).join(c) : "";
}

function sIn(s, i, n) {
	return i ? s.slice(0, i) + n + s.slice(i) : n + s;
}

function p10(n, e) {
	if(!e) return n;
	var s = ln(n);
	if(!s) {
		var i = parseInt(n);
		if(n !== i) return isNaN(i) ? n : n * Math.pow(10, e);
	}
	var t = "" + n, b = (s ? s.charAt(0) == "-" : n < 0) ? 1 : 0, l = ln(t);
	if(e > 0) t += sNc("0", e);
	else {
		e += l - b;
		if(e < 0) t = sIn(t, b, sNc("0", -e));
		t = sIn(t, e <= 0 ? b : e + b, ".");
	}
	return s ? t : Number(t);
}

function ha2si(a) {
	var l = ln(a = a.slice()), d = [], r = a[l-1], m = r&128, i, f;
	if(m) for(i = f = 0; i < l; ++i) if(a[i] || f) {
		a[i] = 256 - a[i] - f;
		f = 1;
	}
	for(i = l, f = 0; i;) if(a[--i]) f = 1;
	if(!f) return 0;
	do {
		r = f = 0, i = l;
		while(i) {
			var n = r * 256 + a[--i];
			r = n % 10;
			if(a[i] = (n - r) / 10) f = 1;
		}
		d.push(r);
	} while(f);
	for(i = ln(d); !d[--i];);
	return (m ? "-" : "") + d.slice(0, ++i).reverse().join("");
}

function i2s(v, n) {
	var r = v ? v.toString() : "0", l = ln(r);
	return n ? (l < n ? sNc("0", n - l) : "") + r : r;
}

function sum(a, b, e) {
	var r = 0, i = b || 0;
	while(i < (e || ln(a))) r += a[i++];
	return r&0xFF;
}

function parseHs(s) {
	var p = s ? s.split(/[\s,]/) : [], r = [], t, i = 0;
	while(i < ln(p)) if(ln(t = p[i++])) r = r.concat(t.match(/.{1,2}/g));
	return r;
}

function hs2i(s) {
	return Number("0x" + s.replace(/^#/, ''));
}

function hs2a(s) {
	var a = parseHs(s), r = [], v, i = 0;
	while(i < ln(a)) {
		v = hs2i(a[i++]);
		if(isNaN(v) || v < 0 || v > 255) throw '"' + a[i] + '" is not a hex byte, pos ' + i;
		r.push(v);
	}
	return r;
}

function b2hs(i) {
	i = Number(i);
	return (i < 16 ? "0" : "") + i.toString(16);
}

function ba2i(a) {
	var i = ln(a);
	if(!i || i > 4) return i ? a : 0;
	var r = a[--i], m = i == 3 ? 0 : r&128 ? (r&=127, -(1<<i*8+7)) : 0;
	while(i>0) r = (r<<8) + a[--i];
	return r + m;
}

function ba2b(a) {
	var i = ln(a), r = 0;
	while(i) r = (r<<8) + a[--i];
	return r;
}

function ba2bcd(a, x) {
	var r = 0, i = ln(a), v, h, l, s = "", e = 0, m = 0;
	function p(c) {
		if(m) c = -c;
		if(c < 10) s += c;
		else e = 1, s += "A-C EF".charAt(c - 10);
	}
	while(i) {
		v = a[--i], h = (v&0xF0)>>4, l = v&0xF;
		if(m) h = -h, l = -l;
		r = r * 100 + h * 10 + l;
		p(h);
		if(1 == ln(s)) {
			e = 0;
			if(h == 13) e = 1;
			else if(h > 13) {
				m = 1, l = -l, r = l;
				if(h == 14) r -= 10;
			}
		}
		p(l);
	}
	if(!x && e) throw s;
	return e ? s : r;
}

function i2c(i) {
	return String.fromCharCode(i);
}

function ba2s(a) {
	var r = [], i = ln(a);
	while(i) r.push(i2c(a[--i]));
	return r.join("");
}

function date(y, m, d) {
	return {
		rawY: y, y: 1900 + y + (y < 100 ? 100 : 0), m: m, d: d,
		toString: function() {
			var t = this, r = i2s(d, 2) + "." + i2s(m, 2) + "." + t.y;
			if(t.hr !== undefined) r += " " + i2s(t.hr, 2) + ":" + i2s(t.mi, 2)
				+ (t.se !== undefined ? (":" + i2s(t.se, 2)) : "");
			if(t.s) r += " (summer)";
			if(t.i) r += " (invalid)";
			return r;
		}
	};
}

function i2d(i) {
	return i ? date(i>>5&7|i>>9&0x78, i>>8&0xF, i&0x1F) : null;
}

function i2t(i) {
	var l = ln(i) || 0, b = l > 5 ? 1 : 0, s = b ? i[--l] : 0, i = l ? ba2b(i.slice(b, l)) : i;
	if(!i) return null;
	var r = i2d(i>>16);
	r.hr = i>>8&0x1F;
	r.mi = i&0x3F;
	if(b) r.se = s&0x3F;
	if(i&0x8000) r.s = true;
	if(i&0x80) r.i = true;
	return r;
}

function ba2f(a) {
	var l = ln(a) - 1, s = 7;
	if(l == 7) s = 4;
	else if(l != 3) return NaN;
	var b = l - 1, m = (1<<s) - 1, f = (a[b]&m)<<b*8, h = 1<<b*8+s, y = 1<<14-s,
		e = (a[b]>>s) + ((a[l]&0x7F)<<8-s) + 1 - y, g = a[l]>>7 ? -1 : 1, i;
	for(i = 0; i < b; ++i) f += a[i]<<i*8;
	if(e == y) return g * (f ? NaN : Number.POSITIVE_INFINITY);
	if(f) f = e == 1 - y ? f / (h>>1) : (f|h) / h;
	return g * f * Math.pow(2, e);
}

function tmbus(h) {

var a = hs2a(h), isA = Array.isArray, O = [0], MS = "Manufacturer specific", R = "Reserved", UH = "Units for H.C.A.";
while(ln(a)) if(a[0] != 255) break; else a.splice(0, 1);
var l = ln(a), e = l - 2, r = {len: l}, id = 0, n = 0, c, w;
if(!l) return r;

function er(s) {
	throw (s || "Wrong frame length") + ", pos " + n;
}

function i() {
	if(n == l) er();
	return c = a[n++];
}

function sl(t, s) {
	var p = n, r = s + n;
	if(r > e) er("Premature end of data when reading " + t + " (need " + s + ", available " + (e - n) + ")");
	n = r;
	return a.slice(p, n);
}

function ii(t, b, s) {
	var r = sl(t, s || 4);
	return b ? ba2i(b == 2 ? r.reverse() : r) : ba2bcd(r, 1);
}

function aSum(b) {
	if(sum(a, b, e) != a[e]) er("Check sum failed");
}

i();
if(l == 1) {
	c == 0xe5 ? r.type = "OK" : er("Invalid char");
	return r;
}
if(l < 5) er();
if(a[l - 1] != 0x16) er("No Stop");
if(c == 0x10) {
	r.type = "Short";
	aSum(1);
	r.c = i();
	r.a = i();
	return r;
}
if(c != 0x68) er("No Start");
r.type = "Data";
r.l = i();
if(a[2] != c) er("Invalid length");
if(a[0] != a[3]) er("Invalid format");
if(c != l - 6) er("Wrong length");
aSum(n = 4);
r.c = i();
r.a = i();
r.ci = i();
w = r.errors = [];
if((c&0xFA) == 0x72) r.fixed = (c&1) == 1;
else {
	r.type = "Error";
	var s = ["Unspecified error", "Unimplemented CI-Field", "Buffer too long, truncated", "Too many records",
		"Premature end of record", "More than 10 DIFE's", "More than 10 VIFE's",
		R, "Application too busy for handling readout request", "Too many readouts"];
	if(c == 0x70) {
		w.push(s[n == e ? 0 : i() < 10 ? c : 7]);
		return r;
	}
	er(s[1]);
}
r.id = ii("ID");

var M = " meter", S = ["Heat" + M, "Cooling" + M, " (Volume measured at ", "return temperature: outlet)", "flow temperature: inlet)", "Customer unit", "Radio converter ", "Access Code "],
	D = ["Other", "Oil" + M, "Electricity" + M, "Gas" + M, S[0], "Steam" + M, "Hot water" + M, "Water" + M, "Heat Cost Allocator", R,
	S[0] + S[2] + S[3], "Compressed air", S[1] + S[2] + S[3], S[1] + S[2] + S[4], S[0] + S[2] + S[4], "Combined Heat / " + S[1], "Bus / System component", "Unknown device type", "Cold water" + M, "Dual water" + M,
	"Pressure" + M + " / pressure device", "A/D Converter", "Warm water" + M, "Calorific value", "Smoke detector / smoke alarm device", "Room sensor", "Gas detector", "Consumption" + M, "Sensor", "Breaker (electricity)",
	"Valve (gas or water)", "Switching device", S[5] + " (display device)", S[5], "Waste water" + M, "Garbage", "Carbon dioxide", "Environmental" + M, "System device", "Communication controller",
	"Unidirectional repeater", "Bidirectional repeater", S[6] + "(system side)", S[6] + "(meter side)", "Wired Adapter"],
fD = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 3, 4, 5, 6, 7, 8, 9],
vD = [0, 1, 2, 3, 10, 5, 22, 7, 8, 11, 12, 13, 14, 15, 16, 17,
	27, 27, 27, 27, 23, 6, 18, 19, 20, 21, 24, 25, 26, 28, 28, 28,
	29, 30, 31, 31, 31, 32, 33, 33, 34, 35, 36, 37, 37, 37, 37, 37,
	38, 39, 40, 41, 38, 38, 42, 43, 44],
vFunc = ["Instantaneous", "Maximum", "Minimum", "During error state"];

function i2fu(i) {
	var U = ["Wh", "kWh", "MWh", "kJ", "MJ", "GJ", "W", "kW", "MW", "kJ/h", "MJ/h", "GJ/h", "ml", "l", "m\xB3", "ml/h", "l/h", "m\xB3/h"];
	return i < 2 ? [["h,m,s", "D,M,Y"][i], 0]
	: i < 0x38 ? [U[Math.floor((i - 2) / 3)], (i - 2) % 3]
	: i < 0x39 ? ["\xB0C", -3]
	: i < 0x3A ? [UH, 0]
	: [R, 0];
}

function m2c(i) {
	return i2c((i&0x1F) + 64);
}

function deManIdi(n) {
	return m2c(n>>10) + m2c(n>>5) + m2c(n);
}

function deManId(a, n) {
	return deManIdi(ii("ManID", 1, 2));
}

function deD(i) {
	return D[i > 0x3F ? 9 : i > 0x38 ? 38 : vD[i]];
}

function deS(r) {
	var s = r.status;
	if(r.fixed) r.cStored = s&2 ? "At fixed date" : "Actual";
	else {
		if((s&3) != 3) {
			if(s&1) w.push("Application Busy");
			if(s&2) w.push("Application Error");
		}
	}
	if(s&4) w.push("Power Low");
	if(s&8) w.push("Permanent Error");
	if(s&16) w.push("Temporary Error");
	return s&1;
}

function nv() {
	if(!r.data) r.data = [];
	var v = {id: id++};
	r.data.push(v);
	return v;
}

function sD(d, m) {
	r.deviceCode = d;
	r.deviceType = m;
}

function pF() {
	r.accessN = i();
	r.status = i();
	var s = deS(r), u1 = i(), u2 = i(), m = (u1>>6)|(u2>>4&0xC);
	sD(m, D[fD[m]]);
	if(m > 9 && m < 15 && s) s = 2;
	var x = nv(), y = nv(), ux = i2fu(u1&0x3f), vy = u2&0x3f, uy, v = 1;
	x.storage = 0;
	x.func = vFunc[0];
	x.value = p10(ii("Counter 1", s), ux[1]);
	x.unit = ux[0];
	if(vy == 0x3e) uy = ux;
	else {
		v = 0;
		if(vy != 0x3f) uy = i2fu(vy);
	}
	y.storage = v;
	y.func = vFunc[0];
	v = ii("Counter 2", s);
	y.value = uy ? p10(v, uy[1]) : v;
	y.unit = uy ? uy[0] : "";
}

function rif(i) {
	var v = ln(i);
	v = v ? i[v - 1] : 128;
	while(n < e && v>>7) {
		v = a[n++];
		i.push(v);
	}
	return i;
}

var T = ["Reserved", "Energy", "Volume", "Mass", "On Time", "Operating Time", "Power", "Volume Flow", "Volume Flow ext.", "Mass flow",
	"Flow Temperature", "Return Temperature", "Temperature Difference", "External Temperature", "Pressure", "Time Point", UH, "Averaging Duration", "Actuality Duration", "Credit",
	"Debit", "Access Number", "Medium", "Manufacturer", "Parameter set id", "Model/Version", "Hardware version #", "Firmware version #", "Software version #", "Customer location",
	"Customer", S[7] + "User", S[7] + "Operator", S[7] + "System Operator", S[7] + "Developer", "Password", "Error flags", "Error mask", "Digital Output", "Digital Input",
	"Baudrate", "Response delay time", "Retry", "First cyclic storage #", "Last cyclic storate #", "Storage block size", "Storage interval", "Duration since last readout", "Start of tariff", "Duration of tariff",
	"Period of tariff", "Voltage", "Current", "Dimensionless", "Reset counter", "Cumulation counter", "Control signal", "Day of week", "Week number", "Time point of day change",
	"State of parameter activation", "Special supplier information", "Duration since last cumulation", "Operating time battery", "Battery change", "Cold/Warm Temperature Limit", "Cumul. count max power"
], U = ["seconds", "minutes", "hours", "days", "months", "years", "Wh", "J", "m\xB3", "kg",
	"W", "J/h", "m\xB3/h", "m\xB3/min", "m\xB3/s", "kg/h", "\xB0C", "K", "bar", "currency unit",
	"binary", "baud", "bittimes", "V", "A", "MWh", "GJ", "t", "feet\xB3", "american gallon",
	"american gallon/min", "american gallon/h", "MW", "GJ/h", "\xB0F", "revolution / measurement", "liter", "kWh", "kW", "K*l"
];

function deV(v, b, n) {
	v.type = T[b[0]];
	var e = b[1];
	if(ln(b) > 1) {
		if(e == 5) {
			e = 9;
			n += 2;
		}
		if(e == 9) v.unit = U[n];
		else if(e == 8) {
			v.type += " (" + (n ? "time & " : "") + "date)";
			v.f = n == 1 ? i2t : i2d;
		} else if(e > 5) v.f = e == 7 ? deD : deManIdi;
		else {
			v.unit = U[b[2]];
			v.e = n + b[1];
		}
	}
}

function deVif(v, d) {
	var t = d>>3&0xF, n = d&7, m = [
	[1, -3, 6],
	[1, 1, 7],
	[2, -6, 8],
	[3, -3, 9],
	[[4, 9], [5, 9]],
	[6, -3, 10],
	[6, 1, 11],
	[7, -6, 12],
	[8, -7, 13],
	[8, -9, 14],
	[9, -3, 15],
	[[10, -3, 16], [11, -3, 16]],
	[[12, -3, 17], [13, -3, 16]],
	[[14, -3, 18], [[15, 8], [[16], O]]],
	[[17, 9], [18, 9]]];
	if(t == 0xF) {
		if(n < 3) v.type = ["Fabrication No", "(Enhanced)", "Bus Address"][n];
	} else {
		var b = m[t], i = 2;
		for(; isA(b[0]); n &= 0xF^1<<i, b = b[d>>i--&1]);
		deV(v, b, n);
	}
}

function deVifD(v, d) {
	var t = d>>2&0xF, n = d&3, m = [
	[19, -3, 19],
	[20, -3, 19],
	[[21], [22, 7], [23, 6], [24]],
	[[25], [26], [27], [28]],
	[[29], [30], [31], [32]],
	[[33], [34], [35], [36, 0, 20]],
	[[37], O, [38, 0, 20], [39, 0, 20]],
	[[40, 0, 21], [41, 0, 22], [42], O],
	[[43], [44], [45], O],
	[46, 9],
	[[46, 0, 4], [46, 0, 5], O, O],
	[47, 9],
	[[48, 8], [49, 0, 1], [49, 0, 2], [49, 0, 3]],
	[50, 9],
	[[50, 0, 4], [50, 0, 5], [53], O],
	O,
	[[54], [55], [56], [57]],
	[[58], [59], [60], [61]],
	[62, 5],
	[63, 5],
	[[64, 8]]
	];
	if(d&0x40) t = (t&7) + 16;
	var b = d > 0x70 ? O : m[t];
	if((d&0x60) == 0x40) {
		t = d&16;
		n = d&0xF;
		b = t ? [52, -12, 24] : [51, -9, 23];
	} else {
		if(isA(b[0])) {
			b = b[n];
			n = 0;
		}
	}
	deV(v, b, n);
}

function deVifB(v, d) {
	var t = d>>3&0xF, n = d&7, m = [
	[[[1, -1, 25]]],
	[[[1, -1, 26]]],
	[[[2, 2, 8]]],
	[[[3, 2, 27]]],
	[[[O, [2, -1, 28]], [[2, -1, 29], [2, 0, 29]]], [[[7, -3, 30], [7, 0, 30]], [[7, 0, 31], O]]],
	[[[6, -1, 32]]],
	[[[6, -1, 33]]],
	O,
	O,
	O,
	O,
	[[10, -3, 34], [11, -3, 34]],
	[[12, -3, 34], [13, -3, 34]],
	O,
	[[65, -3, 34], [65, -3, 16]],
	[66, -3, 10]];
	var b = m[t], i = 2;
	for(; isA(b[0]); n &= 0xF^1<<i, b = d>>i--&1 ? (ln(b) < 1 ? O : b[1]) : b[0]);
	deV(v, b, n);
}

function deVife(v, d) {
	var e, t = d&7, p = "per ", m = "multiplied by sek", o = t&2 ? "out" : "in",
		w = d&8 ? "upper" : "lower", f = d&4 ? "last" : "first", b = d&1 ? "end" : "begin",
		D = "Duration of ", L = " limit exceed";
	e = d < 2 ? (d ? "Too many DIFE's" : e)
	: d < 8 ? ["Storage number", "Unit number", "Tariff number", "Function", "Data class", "Data size"][t - 2] + " not implemented"
	: d < 0xb ? e
	: d < 0x10 ? ["Too many VIFE's", "Illegal VIF-Group", "Illegal VIF-Exponent", "VIF/DIF mismatch", "Unimplemented action"][t - 3]
	: d < 0x15 ? e
	: d < 0x19 ? ["No data available (undefined value)", "Data overflow", "Data underflow", "Data error"][t - 5]
	: d < 0x1C ? "Premature end of record"
	: d < 0x20 ? e
	: d < 0x27 ? p + U[t].slice(0, -1)
	: d < 0x28 ? p + U[35]
	: d < 0x2C ? "increment per " + o + "put pulse on " + o + "put channel #" + (d&1)
	: d < 0x36 ? p + U[[36, 8, 9, 17, 37, 26, 38, 39, 23, 24][d - 0x2C]]
	: d < 0x37 ? m
	: d < 0x39 ? m + " / " + U[24 - (d&1)]
	: d < 0x3D ? ["start date(/time) of", "VIF contains uncorrected unit instead of corrected unit", "Accumulation only if positive contributions",
		"Accumulation of abs value only if negative contributions"][t - 1]
	: d < 0x40 ? T[0]
	: d < 0x4A ? (t ? "# of exceeds of " + w + " limit" : w + " limit value")
	: d < 0x50 ? "Date (/time) of: " + b + " of " + f + " " + w + L
	: d < 0x60 ? D + f + " " + w + L + ", " + U[t&3]
	: d < 0x68 ? D + f + ", " + U[t&3]
	: d < 0x70 ? (t&2 ? "Date (/time) of " + f + " " + b : e)
	: d < 0x78 ? (v.e = t - 6, e)
	: d < 0x7C ? "Additive correction constant: 10E" + (t - 3) + "*" + v.type + " (offset)"
	: d < 0x7D ? e
	: d < 0x7E ? (v.e = 3, e)
	: ["future value", MS + " data next"][t&1];
	if(e) v.typeE.push(e);
}

function deVifs(v) {
	var y = v.vif, l = ln(y), i = 0, t = y[i], m = 0x7F, d = t&m, b;
	if(t == 0xFD || t == 0xFB) {
		d = y[++i]&m;
		(t == 0xFD ? deVifD : deVifB)(v, d);
	} else if(d < 0x7C) deVif(v, d);
	else if(d == 0x7C) {
		b = a[(n -= l - 2) - 1];
		v.type = ba2s(sl("VIF type", b));
		y = v.vif = rif([t]);
		l = ln(y);
	}
	if(d == m) v.type = MS;
	if(!(y[i]>>7)) return;
	if(d != m) ++i;
	v.typeE = [];
	b = 0;
	while(i < l && i < 11) {
		t = y[i++], d = t&m;
		b ? v.typeE.push(d) : (b = d == m, deVife(v, d));
		if(!(t&0x80)) break;
	}
	if(!ln(v.typeE)) delete v.typeE;
}

function rv(v) {
	deVifs(v);
	var y = v.dif, l = ln(y) - 1, p, i, d = y[0], f = d>>4&3, t = d&0xF, m, b = d&7, u, s;
	if(t == 0xD) {
		p = b = a[n++];
		if(b < 0xC0) m = ba2s;
		else {
			b &= 0xF;
			if(p > 0xEF) {
				if(p < 0xFB) m = ba2f;
			} else {
				m = p > 0xDF ? ba2i : ba2bcd;
				s = (p&0xF0) == 0xD0;
			}
		}
	} else {
		if(b == 5) {
			--b;
			m = ba2f;
		} else {
			if(b == 7) ++b;
			m = t&8 ? ba2bcd : ba2i;
		}
	}
	i = t = sl("Record #" + v.id, b);
	if(m) {
		try {
			t = m(t);
		} catch(e) {
			v.error = true;
			t = e;
		}
	}
	if(!v.error) {
		if(v.f) t = v.f(t);
		m = Array.isArray(t);
		if(m) t = ha2si(t);
		if(s) t = m ? (t.charAt(0) == "-" ? t.slice(1) : ("-" + t)): -t;
		if(v.e) t = p10(t, v.e);
	}
	v.value = t;
	v.rawValue = i;
	v.func = vFunc[f];
	d >>= 6; f = d&1; i = t = u = 0;
	if(d&2) {
		for(; i < l; ++i) {
			d = y[i + 1];
			u += (d>>6&1)<<i;
			t += (d>>4&3)<<i*2;
			f += (d&0xF)<<i*4+1;
		}
		v.device = u;
		v.tariff = t;
	}
	v.storage = f;
	delete v.f;
	delete v.e;
}

function pV() {
	r.manId = deManId();
	r.version = i(), i();
	sD(c, deD(c));
	r.accessN = i();
	r.status = i();
	deS(r);
	n += 2;
	while(n < e - 1) {
		var t = a[n], v = t == 0x2F ? v : nv();
		if((t&0xF) == 0xF) {
			t = t>>4&7; ++n;
			if(t < 2) {
				if(t) v.request = "Readout again";
				v.type = MS;
				v.value = sl(v.type, e - n);
			} else if(t > 6) v.request = "Global readout";
		} else {
			v.dif = rif([]);
			v.vif = rif([]);
			rv(v);
		}
	}
}

r.fixed ? pF() : pV();
return r;
}

function _ba2hs(a, s) {
  var r = [], i = 0;
  while (i < ln(a)) r.push(b2hs(a[i++]));
  return r.join(s || "");
}

// Function that assembles fake bytes around variable block to from valid mbus frame.
function invoke_tmbus(block_arr) {
  var len = ln(block_arr) + 21;

  var data_arr = [
    0x68, len - 6, len - 6, 0x68, 0x08, 0x02, 0x72, 0x78, 0x56, 0x34,
    0x12, 0x24, 0x40, 0x01, 0x07, 0x55, 0x00, 0x00, 0x00,
  ].concat(Array.from(block_arr));
  var crc = sum(data_arr, 4, len - 2);
  data_arr.push(crc, 0x16);

  var res = tmbus(_ba2hs(data_arr));
  return { data: res.data, errors: res.errors };
}

function convert_units(unit) {
  unit = unit.replace(/\s+/g, '');
  // e.g. "american gallon/min", "american gallon/h"
  // key with unit looks like "meter_accumulated_volume__m3"
  // let unit = key.split('__')[1] || '';
  unit = unit.replace(' ', '_');
  unit = unit.replace('/', '_per_');
  unit = unit.replace('³', '3');
  unit = unit.replace('°', 'deg');
  return unit;
}

function convert_time_to_iso(x) {
  var iso_time = x.y + '-' + pad(x.m, 2) + '-' + pad(x.d, 2);
  if (x.hr) {
    iso_time += 'T' + pad(x.hr, 2) + ':' + pad(x.mi, 2);
  }
  return iso_time;
}
// , "VIF contains uncorrected unit instead of corrected unit", 
// "Accumulation only if positive contributions",
// "Accumulation of abs value only if negative contributions"
function convert_datarecords(data) {
  var result = {};
  for (var obj of data) {
    var storage_num = obj.storage;
    var storage_str = "";
    if (storage_num > 0) {
      storage_str = 'storage' + storage_num + "_";
    }

    // first regex replaces white spaces, the second one removes brackets
    var type_str = obj.type.replace(/\s+/g, '_').replace(/_\(.*?\)/g, '');
    var name_extra = '';
    if (obj.typeE) {
      for (let i = 0; i < obj.typeE.length; i++) {
        if (obj.typeE[i] && obj.typeE[i].trim() !== "") {
          let value = obj.typeE[i];
          // Define mapping of values to replace
          const valueMap = {
            "VIF contains uncorrected unit": "_VIF",
            "Accumulation only if positive contributions": "_accumulated_pos",
            "Accumulation of abs value only if negative contributions": "_Accumulated_neg",
          };
          // Replace values
          for (const key in valueMap) {
            value = value.replace(key, valueMap[key]);
          }
          console.log(`Value ${i + 1}: ${value}`);
          name_extra = value;
        }
      }
    }

    var func_lookup = { "Instantaneous": "", "Maximum": "_max", "Minimum": "_min", "During error state": "_during_error" };
    var func_str = "";
    if (obj.func) {
      func_str = func_lookup[obj.func];
    }
    var tariff_str = '';
    if (obj.tariff) {
      tariff_str = 'tariff' + obj.tariff + '_';
    }
    var subunit_str = '';
    if (obj.device) {

      subunit_str = 'subunit' + obj.device + '_';
    }
    var value = obj.value;
    if (obj.type.includes("Time Point")) {
      value = convert_time_to_iso(value);
    }

    var unit_str = "";
    if (obj.unit) {
      unit_str = '__' + convert_units(obj.unit);
      if (obj.unit == "binary") {
        var len = obj.dif[0] & 0x0F;
        value = "0x" + intToHexStr(obj.value, len * 2);
      }
    }
    var name_parts = [storage_str, subunit_str, tariff_str, type_str, name_extra, func_str];
    var cleaned_parts = name_parts.filter(part => part !== undefined);
    var name = cleaned_parts.join('').toLowerCase();
    name = name.replace("__", "_");
    name += unit_str;

    result[name] = value;
  }
  return result;
}

function decode_mbus(byte_array) {
  var decoded_tmbus = invoke_tmbus(byte_array);
  return convert_datarecords(decoded_tmbus.data);
}

function byte_arr_2_hex(byte_arr) {
  var r = [], i = 0;
  while (i < ln(byte_arr)) r.push(b2hs(byte_arr[i++]));
  return r.join("");
}

// FORMATTER AND CONVERTER FUNCTIONS
function mbusStatus(status, err) {
  switch (status) {
    case 0:
      return 'connected';
    case 1:
      return 'nothing_requested';
    case 2:
      return 'bus_unpowered';
    case 3:
      return 'no_response';
    case 5:
      return 'crc_or_len_error';
    case 6:
      return 'parse_error';
    case 7:
      return 'bus_shorted';
    default:
      err.errors.push('invalid_mbus_status');
      return 'invalid_mbus_status';
  }
}

function usagePulseMediumType(medium, err) {
  switch (medium) {
    case 0:
      return 'triggers';
    case 1:
      return 'pulses';
    case 2:
      return 'L_water';
    case 3:
      return 'Wh_electricity';
    case 4:
      return 'L_gas';
    default:
      err.errors.push('invalid_medium');
      return 'invalid_medium';
  }
}

function serialFormat(serial) {
  if (serial === 0xFFFFFFFF) { return 'not_available'; }
  return intToHexStr(serial, 8);
}

function actualityDurationToMinutesFormat(actualityRaw) {
  if (actualityRaw < 60) { return actualityRaw; }
  if (actualityRaw < 156) { return (actualityRaw - 60) * 15; }
  if (actualityRaw < 200) { return (actualityRaw - 156) * 24 * 60; }
  if (actualityRaw < 253) { return (actualityRaw - 200) * 7 * 24 * 60; }
  if (actualityRaw === 253) { return 365 * 24 * 60; }
  return null;
}

function actualityDurationToFormatStr(actualityRaw) {
  var minutes = actualityDurationToMinutesFormat(actualityRaw);
  if (actualityRaw < 60) { return minutes + ' minutes'; }
  if (actualityRaw < 156) { return (minutes / 60).toFixed(2) + ' hours'; }
  if (actualityRaw < 200) { return (minutes / (60 * 24)).toFixed(2) + ' days'; }
  if (actualityRaw < 253) { return (minutes / (60 * 24 * 7)).toFixed(2) + ' weeks'; }
  if (actualityRaw === 253) { return (minutes / (60 * 24 * 365)).toFixed(2) + ' years'; }
  return null;
}

function usagePulseMultiplier(exp) {
  switch (exp) {
    case 0:
      return 1;
    case 1:
      return 10;
    case 2:
      return 100;
    case 3:
      return 1000;
    default:
      throw Error('invalid_multiplier');
  }
}

function pulseInputModeAndUnit(modeAndUnit, err) {
  switch (modeAndUnit) {
    case 0:
      return 'disabled';
    case 1:
      return 'pulses';
    case 2:
      return 'L_water';
    case 3:
      return 'Wh_electricity';
    case 4:
      return 'L_gas';
    case 9:
      return 'triggers_1_sec';
    case 10:
      return 'triggers_10_sec';
    case 11:
      return 'triggers_1_min';
    case 12:
      return 'triggers_1_h';
    default:
      err.errors.push('invalid_input_mode');
      throw Error('invalid_input_mode');
  }
}

function lorawanProfileFormat(profile, err) {
  switch (profile) {
    case 0x00:
      return 'lorawan_disabled';
    case 0x01:
      return 'lorawan_24_h_privacy';
    case 0x02:
      return 'lorawan_24_h';
    case 0x03:
      return 'lorawan_12_h';
    case 0x07:
      return 'lorawan_1_h_static';
    case 0x08:
      return 'lorawan_15_min_static';
    case 0x17:
      return 'lorawan_1_h_dynamic';
    case 0x18:
      return 'lorawan_15_min_dynamic';
    default:
      err.errors.push('invalid_lorawan_profile');
      return 'invalid_lorawan_profile';
  }
}

function wmbusProfileFormat(profile, err) {
  switch (profile) {
    case 0x00:
      return 'wmbus_disabled';
    case 0x01:
      return 'wmbus_privacy';
    case 0x02:
      return 'wmbus_driveby';
    case 0x03:
      return 'wmbus_fixnet';
    default:
      err.errors.push('invalid_wmbus_profile');
      return 'invalid_wmbus_profile';
  }
}

function packetErrorReasonFormatter(reason, err) {
  switch (reason) {
    case 0x00:
      return 'n/a';
    case 0x01:
      return 'n/a';
    case 0x02:
      return 'unknown_fport';
    case 0x03:
      return 'packet_size_short';
    case 0x04:
      return 'packet_size_long';
    case 0x05:
      return 'value_error';
    case 0x06:
      return 'protocol_parse_error';
    case 0x07:
      return 'reserved_flag_set';
    case 0x08:
      return 'invalid_flag_combination';
    case 0x09:
      return 'unavailable_feature_request';
    case 0x0A:
      return 'unsupported_header';
    case 0x0B:
      return 'unreachable_hw_request';
    case 0x0C:
      return 'address_not_available';
    case 0x0D:
      return 'internal_error';
    default:
      err.errors.push('invalid_error_code');
      return 'invalid_error_code';
  }
}

function hardwareConfigFormat(hw, err) {
  switch (hw) {
    case 0x00:
      return 'pulse_only';
    case 0x01:
      return 'pulse_analog';
    case 0x02:
      return 'pulse_ssi';
    case 0x04:
      return 'pulse_mbus';
    case 0x06:
      return 'pulse_lbus';
    case 0x07:
      return 'pulse_izar';
    default:
      err.errors.push('invalid_hardware_config');
      return 'invalid_hardware_config';
  }
}

function shutdownReasonFormat(reason, err) {
  switch (reason) {
    case 0x32:
      return 'enter_dfu';
    case 0x33:
      return 'app_shutdown';
    case 0x34:
      return 'switch_to_wmbus';
    default:
      err.errors.push('invalid_shutdown_reason');
      return 'invalid_shutdown_reason';
  }
}

function bootPacketReason(reason, err) {
  switch (reason) {
    case 0:
      return 'unknown_reset';
    case 1:
      return 'from_shutdown';
    case 2:
      return 'from_dfu';
    case 3:
      return 'froced_reset';
    case 4:
      return 'lorawan_rejoin';
    default:
      err.errors.push('invalid_boot_packet_reason');
      return 'invalid_boot_packet_reason';
  }
}

function mbusMedium(medium) {
  switch (medium) {
    case 0x00:
      return 'other';
    case 0x01:
      return 'oil';
    case 0x02:
      return 'electricity';
    case 0x03:
      return 'gas';
    case 0x04:
      return 'heat (outlet vol)';
    case 0x05:
      return 'steam';
    case 0x06:
      return 'hot Water';
    case 0x07:
      return 'water';
    case 0x08:
      return 'heat cost allocator';
    case 0x09:
      return 'compressed air';
    case 0x0A:
    case 0x0B:
      return 'cooling load meter';
    case 0x0C:
      return 'heat (inlet vol)';
    case 0x0D:
      return 'heat / cooling load meter';
    case 0x0E:
      return 'bus / system';
    case 0x0F:
      return 'unknown';
    case 0x16:
      return 'cold water';
    case 0x17:
      return 'dual water';
    case 0x18:
      return 'pressure';
    case 0x19:
      return 'A/D converter';
    default:
      return 'unknown';
  }
}

function mbusManufacturer(mfgId) {
  // eslint-disable-next-line no-bitwise
  var out = String.fromCharCode(((mfgId >> 10) & 0x001F) + 64);
  // eslint-disable-next-line no-bitwise
  out += String.fromCharCode(((mfgId >> 5) & 0x001F) + 64);
  // eslint-disable-next-line no-bitwise
  out += String.fromCharCode(((mfgId) & 0x001F) + 64);
  return out;
}

function ssiSensor(status, err) {
  switch (status) {
    case 0:
      return 'disconnected';
    case 1:
      return 'pressure_30bar_temperature';
    default:
      err.errors.push('unknown_sensor_index');
      return 'unknown_sensor_index';
  }
}

// USAGE PAYLOAD
function pulseUsageParse(dataView, err) {
  var res = {};
  var bits4 = dataView.getUint8Bits();
  res['input_state'] = bits4.getBits(1) === true ? 'closed' : 'open';
  var serialSent = bits4.getBits(1);
  var multiplier = usagePulseMultiplier(bits4.getBits(2));
  res['muliplier'] = multiplier;
  var mediumType = usagePulseMediumType(bits4.getBits(4), err);
  res['medium_type'] = mediumType;

  res['accumulated__' + mediumType] = dataView.getUint32() * multiplier;
  if (serialSent) {
    res['serial'] = serialFormat(dataView.getUint32());
  }
  return res
}

function usageAndStatusParser(buffer, result, err) {
  var mbus_res = {};
  var ssi_res = {};
  var dataView = new BinaryExtract(buffer);

  var deviceStatusSent = false;
  var packetType = dataView.getUint8();
  if (packetType === 0x02) {
    result.packet_type = 'usage_packet';
  } else if (packetType === 0x82) {
    result.packet_type = 'status_packet';
    deviceStatusSent = true;
  } else {
    err.errors.push('invalidpacket_type ' + packetType);
    return;
  }

  var bits1 = dataView.getUint8Bits();
  var activeAlerts = {};
  activeAlerts.pulse_1_trigger_alert = bits1.getBits(1);
  activeAlerts.pulse_2_trigger_alert = bits1.getBits(1);
  bits1.getBits(4);
  activeAlerts.low_battery = bits1.getBits(1);
  result.app_connected_within_a_day = bits1.getBits(1);
  result.active_alerts = activeAlerts;
  // TODO add to warnings

  if (deviceStatusSent) {
    result.battery_remaining__years = parseFloat((dataView.getUint8() / 12.0).toFixed(1));
    result.battery_voltage__V = dataView.getUint8() / 100.0 + 1.5;

    result.internal_temperature__C = dataView.getInt8();
    var bits5 = dataView.getUint8Bits();
    result.internal_temperature_min__C = bits5.getBits(4) * -2 + result.internal_temperature__C;
    result.internal_temperature_max__C = bits5.getBits(4) * 2 + result.internal_temperature__C;

    result.radio_downlink_rssi__dBm = -1 * dataView.getUint8();
    var bits6 = dataView.getUint8Bits();
    result.radio_downlink_snr__dB = bits6.getBits(4) * 2 - 20;
    result.radio_uplink_power__dBm = bits6.getBits(4) * 2;
  }

  var actuality = dataView.getUint8();
  result.meter_actuality_duration__minutes = actualityDurationToMinutesFormat(actuality);
  result.meter_actuality_duration_formatted = actualityDurationToFormatStr(actuality);

  var bits2 = dataView.getUint8Bits();
  var pulse1Sent = bits2.getBits(1);
  var pulse2Sent = bits2.getBits(1);
  var mainInterfaceSent = bits2.getBits(4);
  var mbusSent = mainInterfaceSent === 0x08;
  var ssiSent = mainInterfaceSent === 0x04;

  if (pulse1Sent) {
    result.pulse_1 = pulseUsageParse(dataView, err);
  }
  if (pulse2Sent) {
    result.pulse_2 = pulseUsageParse(dataView, err);
  }
  if (mbusSent) {
    var bits7 = dataView.getUint8Bits();
    mbus_res.last_bus_status = mbusStatus(bits7.getBits(4), err);
    mbus_res.records_truncated = bits7.getBits(1);
    var stateAndSerialSent = bits7.getBits(1);
    var serialExtensionSent = bits7.getBits(1);

    if (stateAndSerialSent) {
      mbus_res.status = '0x' + intToHexStr(dataView.getUint8(), 2);
      mbus_res.serial = serialFormat(dataView.getUint32());
    }
    if (serialExtensionSent) {
      mbus_res.manufacturer = mbusManufacturer(dataView.getUint16());
      mbus_res.version = dataView.getUint8();
      mbus_res.medium = mbusMedium(dataView.getUint8());
    }

    var mbus_buf = dataView.getRaw(dataView.availableLen());
    mbus_res.data_records_raw = byte_arr_2_hex(mbus_buf).toUpperCase();

    mbus_res.data_records = {};
    var decoded_tmbus = decode_mbus(mbus_buf);
    for (var key in decoded_tmbus) {
      mbus_res.data_records[key] = decoded_tmbus[key];
    }
    result.mbus = mbus_res;
  }

  if (ssiSent) {
    var bits8 = dataView.getUint8Bits();
    ssi_res.sensor = ssiSensor(bits8.getBits(6), err);

    var bits9 = dataView.getUint8Bits();
    var ch1Inst = bits9.getBits(1);
    var ch1Avg = bits9.getBits(1);
    var ch2Inst = bits9.getBits(1);
    var ch2Avg = bits9.getBits(1);
    var ch3Inst = bits9.getBits(1);
    var ch3avg = bits9.getBits(1);
    var ch4Inst = bits9.getBits(1);
    var ch4Avg = bits9.getBits(1);

    if (ch1Inst) ssi_res.channel_1 = parseFloat(dataView.getFloat().toFixed(5));
    if (ch1Avg) ssi_res.channel_1_avg = parseFloat(dataView.getFloat().toFixed(5));
    if (ch2Inst) ssi_res.channel_2 = parseFloat(dataView.getFloat().toFixed(5));
    if (ch2Avg) ssi_res.channel_2_avg = parseFloat(dataView.getFloat().toFixed(5));
    if (ch3Inst) ssi_res.channel_3 = parseFloat(dataView.getFloat().toFixed(5));
    if (ch3avg) ssi_res.channel_3_avg = parseFloat(dataView.getFloat().toFixed(5));
    if (ch4Inst) ssi_res.channel_4 = parseFloat(dataView.getFloat().toFixed(5));
    if (ch4Avg) ssi_res.channel_4_avg = parseFloat(dataView.getFloat().toFixed(5));
    result.ssi = ssi_res;
  }
}

// CONFIGURATION PAYLOADS

function pulseConfigParse(dataView, err) {
  var res = {};
  res['input_mode_and_unit'] = pulseInputModeAndUnit(dataView.getUint8Bits().getBits(4), err);

  var bits2 = dataView.getUint8Bits();
  var multiplierSent = bits2.getBits(1);
  var accumulatedAbsoluteSent = bits2.getBits(1);
  var accumulatedOffsetSent = bits2.getBits(1);
  var serialSent = bits2.getBits(1);
  bits2.getBits(2);
  var multiplier = usagePulseMultiplier(bits2.getBits(2));

  if (multiplierSent) {
    res['multiplier_numerator'] = dataView.getUint16();
    res['multiplier_denominator'] = dataView.getUint8();
  }
  if (accumulatedAbsoluteSent) {
    res['accumulated_absolute'] = dataView.getUint32() * multiplier;
  }
  if (accumulatedOffsetSent) {
    res['accumulated_offset'] = dataView.getInt32() * multiplier;
  }
  if (serialSent) {
    res['serial'] = serialFormat(dataView.getUint32());
  }
  return res;
}

function generalConfigurationParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x12) { result.packet_type = 'general_configuration_packet'; } else {
    err.errors.push('invalid_configuration_type ' + packetType);
    return;
  }

  var bits1 = dataView.getUint8Bits();
  var radioLorawanProfileSent = bits1.getBits(1);
  var radioWmbusProfileSent = bits1.getBits(1);
  bits1.getBits(2);
  var pulse1Sent = bits1.getBits(1);
  var pulse2Sent = bits1.getBits(1);

  if (radioLorawanProfileSent) {
    result.radio_lorawan_profile = lorawanProfileFormat(dataView.getUint8(), err);
  }
  if (radioWmbusProfileSent) {
    result.radio_wmbus_profile = wmbusProfileFormat(dataView.getUint8(), err);
  }
  if (pulse1Sent) {
    result.pulse_1 = pulseConfigParse(dataView, err);
  }
  if (pulse2Sent) {
    result.pulse_2 = pulseConfigParse(dataView, err);
  }
}

function mbusConfigurationParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x14) { result.packet_type = 'mbus_configuration_packet'; } else {
    err.errors.push('invalid_configuration_type ' + packetType);
    return;
  }
  var bits1 = dataView.getUint8Bits();
  var usageCount = bits1.getBits(4);
  var statusCount = bits1.getBits(4);
  if (usageCount > 10 || statusCount > 10) {
    err.errors.push('invalid_usage_or_status_count');
    return;
  }
  // result.mbus_usage_data_record_headers = {};
  // result.mbus_status_data_record_headers = {};
  result.mbus_data_record_header_raw = '';
  while (dataView.offset < dataView.buffer.length) {
    result.mbus_data_record_header_raw += intToHexStr(dataView.getUint8(), 2);
  }
}

function locationConfigurationParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x21) { result.packet_type = 'location_configuration_packet'; } else {
    err.errors.push('invalid_configuration_type ' + packetType);
    return;
  }
  var configuredParams = {};
  var bits1 = dataView.getUint8Bits();
  configuredParams.gps_position_sent = bits1.getBits(1);
  configuredParams.time_zone_sent = bits1.getBits(1);
  configuredParams.address_sent = bits1.getBits(1);
  configuredParams.id_customer_sent = bits1.getBits(1);
  configuredParams.id_location_sent = bits1.getBits(1);

  if (configuredParams.gps_position_sent) {
    result.gps_position_latitude__deg = dataView.getInt32() / 10000000.0;
    result.gps_position_longitude__deg = dataView.getInt32() / 10000000.0;
  }
  if (configuredParams.time_zone_sent) {
    result.time_zone__h = dataView.getInt8() / 4.0;
  }
  if (configuredParams.address_sent) {
    var addressLen = dataView.getUint8();
    result.address = dataView.getTextUtf8(addressLen);
  }
  if (configuredParams.id_customer_sent) {
    var idCustomerLen = dataView.getUint8();
    result.id_customer = dataView.getTextUtf8(idCustomerLen);
  }
  if (configuredParams.id_location_sent) {
    var idLocationLen = dataView.getUint8();
    result.id_location = dataView.getTextUtf8(idLocationLen);
  }
}

// CONFIGURATION REQUESTS AND COMMANDS
function configurationRequestsParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x12) {
    result.packet_type = 'general_configuration_request';
  } else if (packetType === 0x14) {
    result.packet_type = 'mbus_configuration_request';
  } else if (packetType === 0x21) {
    result.packet_type = 'location_configuration_request';
  } else {
    err.errors.push('invalid_request_type ' + packetType);
  }
}

function commandParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x03) {
    if (buffer.length === 1) {
      result.packet_type = 'local_time_request';
      return;
    }
    result.packet_type = 'local_time_response';
    result.device_local_time__s = dataView.getUint32();

    var date = new Date(result.device_local_time__s * 1000);
    result.device_local_time_formatted = date.toISOString().replace(/.\d+Z$/g, 'Z');
    var startOf2020 = 1577836800;
    if (result.device_local_time__s < startOf2020) { result.device_local_time_formatted = 'invalid'; }
  } else if (packetType === 0x81) {
    if (buffer.length === 1) {
      result.packet_type = 'mbus_available_data_records_request';
      return;
    }
    result.packet_type = 'mbus_available_data_records';

    var bits = dataView.getUint8Bits();
    result.packet_number = bits.getBits(3);
    result.more_packets_following = bits.getBits(1);
    bits.getBits(2);
    var mbusHeaderSent = bits.getBits(1);

    if (mbusHeaderSent) {
      result.mbus_header = {};
      result.mbus_header.serial = serialFormat(dataView.getUint32());
      result.mbus_header.manufacturer = mbusManufacturer(dataView.getUint16());
      result.mbus_header.version = '0x' + intToHexStr(dataView.getUint8(), 2);
      result.mbus_header.medium = mbusMedium(dataView.getUint8());
      result.mbus_header.access_number = dataView.getUint8();
      result.mbus_header.status = '0x' + intToHexStr(dataView.getUint8(), 2);
      var sig1 = intToHexStr(dataView.getUint8(), 2);
      var sig2 = intToHexStr(dataView.getUint8(), 2);
      result.mbus_header.signature = sig1 + sig2;
    }
    //result.mbus_data_record_headers = {};
    result.mbus_data_record_header_raw = '';
    while (dataView.offset < dataView.buffer.length) {
      result.mbus_data_record_header_raw += intToHexStr(dataView.getUint8(), 2);
    }
  } else if (packetType === 0xFF) { result.packet_type = 'enter_dfu_command'; } else {
    err.errors.push('invalid_command_type ' + packetType);
  }
}

// SYSTEM MESSAGES
function sysMessagesParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x13) {
    result.packet_type = 'faulty_downlink_packet';
    result.packet_fport = dataView.getUint8();
    result.packet_error_reason = packetErrorReasonFormatter(dataView.getUint8(), err);
    err.warnings.push('faulty_downlink_packet ' + result.packet_error_reason);
  } else if (packetType === 0x00) {
    result.packet_type = 'boot_packet';
    result.device_serial = serialFormat(dataView.getUint32());

    result.device_firmware_version = dataView.getUint8().toString() + '.' + dataView.getUint8() + '.' + dataView.getUint8();

    var bits1 = dataView.getUint8Bits();
    var reason = {};
    reason.reason_0 = bits1.getBits(1);
    reason.watchdog_reset = bits1.getBits(1);
    reason.soft_reset = bits1.getBits(1);
    reason.reason_3 = bits1.getBits(1);
    reason.magnet_wakeup = bits1.getBits(1);
    reason.reason_5 = bits1.getBits(1);
    reason.reason_6 = bits1.getBits(1);
    reason.nfc_wakeup = bits1.getBits(1);
    result.wakeup_reason_mcu = objToList(reason);
    // TODO add to alerts

    var bits2 = dataView.getUint8Bits();
    bits2.getBits(4);
    result.packet_reason = bootPacketReason(bits2.getBits(3), err);
    result.configuration_restored = bits2.getBits(1);

    result.hardware_configuration = hardwareConfigFormat(dataView.getUint8(), err);
    result.device_uptime_accumulated__days = parseFloat((dataView.getUint24() / 24.0).toFixed(2));
  } else if (packetType === 0x01) {
    var shutdownReason = shutdownReasonFormat(dataView.getUint8(), err);
    var bufferUsage = buffer.slice(2);
    usageAndStatusParser(bufferUsage, result);
    result.packet_type = 'shutdown_packet';
    result.shutdown_reason = shutdownReason;
  } else {
    err.errors.push('invalid_command_type ' + packetType);
  }
}

function checkFport(fport, expectedFport, err) {
  if (fport !== expectedFport) { err.errors.push('wrong fport or header'); }
}

function decodeByPacketHeader(fport, bytes, result, err) {
  if (bytes.length === 0) { err.errors.push('empty_payload'); } else if (bytes[0] === 0x02) {
    usageAndStatusParser(bytes, result, err);
    checkFport(fport, 25, err);
  } else if (bytes[0] === 0x82) {
    usageAndStatusParser(bytes, result, err);
    checkFport(fport, 24, err);
  } else if (bytes[0] === 0x12) {
    if (bytes.length === 1) {
      configurationRequestsParser(bytes, result, err);
      checkFport(fport, 49, err);
    } else {
      generalConfigurationParser(bytes, result, err);
      checkFport(fport, 50, err);
    }
  } else if (bytes[0] === 0x21) {
    if (bytes.length === 1) {
      configurationRequestsParser(bytes, result, err);
      checkFport(fport, 49, err);
    } else {
      locationConfigurationParser(bytes, result, err);
      checkFport(fport, 50, err);
    }
  } else if (bytes[0] === 0x14) {
    if (bytes.length === 1) {
      configurationRequestsParser(bytes, result, err);
      checkFport(fport, 49, err);
    } else {
      mbusConfigurationParser(bytes, result, err);
      checkFport(fport, 50, err);
    }
  } else if (bytes[0] === 0x03 || bytes[0] === 0x81 || bytes[0] === 0xFF) {
    commandParser(bytes, result, fport);
    if (bytes.length === 1) {
      checkFport(fport, 60, err);
    } else if (bytes[0] === 0x03) {
      checkFport(fport, 60, err);
    } else {
      checkFport(fport, 61, err);
    }
  } else if (bytes[0] === 0x00 || bytes[0] === 0x01 || bytes[0] === 0x13) {
    sysMessagesParser(bytes, result, err);
    checkFport(fport, 99, err);
  } else {
    err.errors.push('invalid_packet_type');
  }
}

// eslint-disable-next-line import/prefer-default-export
function decodeRaw(fport, bytes) {
  var res = {};
  var err = { errors: [], warnings: [] };
  try {
    decodeByPacketHeader(fport, bytes, res, err);
  } catch (error) {
    err.errors.push("decoder_error " + error.message);
  }
  return { data: res, errors: err.errors, warnings: err.warnings };
}

// You need only one entrypoint, others can be removed.

// entry point for TTN new api
function decodeDownlink(input) {
  return decodeRaw(input.fPort, input.bytes);
}

// entry point for TTN new api
function decodeUplink(input) {
  return decodeRaw(input.fPort, input.bytes);
}

// entry point for TTN old version
function Decoder(bytes, fport) {
  return decodeRaw(fport, bytes);
}

// entry point for Chirpstack
function Decode(fport, bytes) {
  return decodeRaw(fport, bytes);
}