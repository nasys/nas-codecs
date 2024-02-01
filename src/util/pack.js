
export function BitPack(err) {
  // BINARY PACKING UTILITIES - Many workarounds here are only because
  // Dataview and other newer features are not available in ES5 (required by chirpstack).
  // basically a class (which is not directly supported in ES5)
  this.data_byte = 0;
  this.offset = 0; // 0 - 7
  this.err = err;
}

BitPack.prototype.addBit = function (val, key) {
  if (typeof val === 'string')
  {
    val = val.toLowerCase();
  }
  var val_int = parseInt(val);
  if (val === "true" || val === true || val_int === 1)
  {
    var val_bool = true;
  }
  else if (val === "false" || val === false || val_int === 0)
  {
    var val_bool = false;
  }
  else
  {
    var val_bool = false;
    this.err.warnings.push(key + "_invalid_boolean_value");
  }

  if (this.offset + 1 >= 8)
  {
    this.err.errors.push(key + "_too_many_bits");
  }

  this.data_byte |= val_bool << this.offset;
  this.offset += 1;
};

BitPack.prototype.addBits = function (val, lengthBits, key) {
  val = parseInt(val);
  if (val === null) // TODO
  {
    this.err.warnings.push(key + "_invalid_bits");
  }
  if (this.offset + lengthBits > 8)
  {
    this.err.errors.push(key + "_too_many_bits");
  }

  var mask = Math.pow(2, lengthBits) - 1;

  // eslint-disable-next-line no-bitwise
  this.data_byte |= (val & mask) << this.offset;
  this.offset += lengthBits;
};


export function BinaryPack(err) {
  // everything is little-endian for now
  this.buffer = [];
  this.err = err;
}

BinaryPack.prototype.length = function () {
  return this.buffer.length;
};

BinaryPack.prototype.int_invalid = function (val, val_int, val_min, val_max, key) {
  if (val === undefined)
  {
    this.err.warnings.push(key+"_key_not_found");
    return true;
  }
  if (isNaN(val_int)) {
    this.err.warnings.push(key+"_value_not_integer");
    return true;
  }
  if (val_int < val_min) {
    this.err.warnings.push(key+"_value_too_small");
    return true;
  }
  if (val_int > val_max) {
    this.err.warnings.push(key+"_value_too_large");
    return true;
  }
  return false;
};

BinaryPack.prototype.addFloat = function(val, key){
  var value = parseFloat(val);
  if (isNaN(value)) {
    this.err.warnings.push(key+"_value_not_integer");
    return true;
  }
  
  var bytes = 0;
  switch (value) {
    case Number.POSITIVE_INFINITY: bytes = 0x7F800000; break;
    case Number.NEGATIVE_INFINITY: bytes = 0xFF800000; break;
    case +0.0: bytes = 0x40000000; break;
    case -0.0: bytes = 0xC0000000; break;
    default:
      if (Number.isNaN(value)) { bytes = 0x7FC00000; break; }

      if (value <= -0.0) {
        bytes = 0x80000000;
        value = -value;
      }

      var exponent = Math.floor(Math.log(value) / Math.log(2));
      var significand = ((value / Math.pow(2, exponent)) * 0x00800000) | 0;

      exponent += 127;
      if (exponent >= 0xFF) {
        exponent = 0xFF;
        significand = 0;
      } else if (exponent < 0) exponent = 0;

      bytes = bytes | (exponent << 23);
      bytes = bytes | (significand & ~(-1 << 23));
    break;
  }
  this.addInt32(bytes, key);
};

BinaryPack.prototype.addUint8Arr = function(val) {
  for (var c = 0; c < val.length; c += 2)
  this.buffer.push(parseInt(val.substr(c, 2), 16));
};

BinaryPack.prototype.addUint8 = function (val, key) {
  var val_int = parseInt(val);
  if (this.int_invalid(val, val_int, 0, 255, key))
  {
    this.buffer.push(0);
    return;
  }
  this.buffer.push(val_int);
};

BinaryPack.prototype.addInt8 = function (val, key) {
  var val_int = parseInt(val);
  if (this.int_invalid(val, val_int, -128, 127, key))
  {
    this.buffer.push(0);
    return;
  }
  this.buffer.push(val_int >= 0 ? val_int : 0x100 + val_int);
};

BinaryPack.prototype.addUint16 = function (val, key) {
  var val_int = parseInt(val.toString(2).slice(-16), 2);
  if (this.int_invalid(val, val_int, 0, 65535, key))
  {
    this.buffer.push(0);
    this.buffer.push(0);
    return;
  }
  this.buffer.push(val_int & 0xFF);
  this.buffer.push((val_int >> 8) & 0xFF);
};

BinaryPack.prototype.addInt16 = function (val, key) {
  var val_int = parseInt(val);
  if (this.int_invalid(val, val_int, -32768, 32767, key))
  {
    this.buffer.push(0);
    this.buffer.push(0);
    return;
  }
  var pos_val = val_int >= 0 ? val_int : 0x10000 + val_int;
  this.buffer.push(pos_val & 0xFF);
  this.buffer.push((pos_val >> 8) & 0xFF);
};

BinaryPack.prototype.addUint32 = function (val, key) {
  var val_int = parseInt(val);
  if (this.int_invalid(val, val_int, 0, 4294967295, key))
  {
    this.buffer.push(0);
    this.buffer.push(0);
    this.buffer.push(0);
    this.buffer.push(0);
    return;
  }
  this.buffer.push(val_int & 0xFF);
  this.buffer.push((val_int >> 8) & 0xFF);
  this.buffer.push((val_int >> 16) & 0xFF);
  this.buffer.push((val_int >> 24) & 0xFF);
};

BinaryPack.prototype.addInt32 = function (val, key) {
  var val_int = parseInt(val);
  if (this.int_invalid(val, val_int, -2147483648, 2147483647, key))
  {
    this.buffer.push(0);
    this.buffer.push(0);
    this.buffer.push(0);
    this.buffer.push(0);
    return;
  }
  var pos_val = val_int >= 0 ? val_int : 0x100000000 + val_int;
  this.buffer.push(pos_val & 0xFF);
  this.buffer.push((pos_val >> 8) & 0xFF);
  this.buffer.push((pos_val >> 16) & 0xFF);
  this.buffer.push((pos_val >> 24) & 0xFF);
};
