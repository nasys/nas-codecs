
export function BitExtract(data_byte) {
  // BINARY EXTRACTING UTILITIES - Many workarounds here are only because Dataview and other newer features are not available in ES5 (required by chirpstack).
  // basically a class (which is not directly supported in ES5)
  this.data = data_byte;
  this.offset = 0;
}

  BitExtract.prototype._assertOnRemainingLength = function(length_bits) {
      if(length_bits === 0)
          throw Error("invalid zero length bit field");
      if(this.offset + length_bits > 8)
          throw Error("invalid number of bits extracted");
  };

  BitExtract.prototype.getBits = function(length_bits) {
      this._assertOnRemainingLength(length_bits);
      var mask = Math.pow(2, length_bits) - 1;
      var res = (this.data >> this.offset) & mask;
      this.offset += length_bits;
      return length_bits == 1 ? Boolean(res) : res; 
  };

export function BinaryExtract(buffer) {
  // everything is little-endian for now
  this.buffer = buffer;
  this.offset = 0;
}

  BinaryExtract.prototype.availableLen = function() {
      return this.buffer.length - this.offset;
  }

  BinaryExtract.prototype._assertOnRemainingLength = function(length) {
      if(length > this.availableLen())
          throw Error("invalid buffer length: too short");
  };

  BinaryExtract.prototype.getUint8 = function() {
      this._assertOnRemainingLength(1);
      return this.buffer[this.offset++];
  };

  BinaryExtract.prototype.getInt8 = function() {
      var res = this.getUint8();
      return res > 0x7F ? res - 0x100 : res;
  };

  BinaryExtract.prototype.getUint16 = function() {
      this._assertOnRemainingLength(2);
      var res = this.buffer[this.offset++] +
          this.buffer[this.offset++] * 256;
      return res;
  };

  BinaryExtract.prototype.getInt16 = function() {
      var res = this.getUint16();
      return res > 0x7FFF ? res - 0x10000 : res;
  };

  BinaryExtract.prototype.getUint24 = function() {
      this._assertOnRemainingLength(3);
      var res = this.buffer[this.offset++] +
          this.buffer[this.offset++] * 256 + 
          this.buffer[this.offset++] * 65536;
      return res;
  };

  BinaryExtract.prototype.getUint32 = function() {
      this._assertOnRemainingLength(4);
      var res = this.buffer[this.offset++] +
          this.buffer[this.offset++] * 256 + 
          this.buffer[this.offset++] * 65536 +
          this.buffer[this.offset++] * 16777216;
      return res;
  };

  BinaryExtract.prototype.getInt32 = function() {
      var res = this.getUint32();
      return res > 0x7FFFFFFF ? res - 0x100000000 : res;
  };

  BinaryExtract.prototype.getUint64 = function() {
      var first = this.getUint32();
      var second = this.getUint32();
      var res = first + second * 0x100000000; // since double can safely represent needed range, its used MAX_SAFE_INTEGER → 9_007_199_254_740_991
      return res;
  };

  BinaryExtract.prototype.getTextUtf8 = function(len) {
      this._assertOnRemainingLength(len);
      var res = stringFromUTF8Array(this.buffer.slice(this.offset, this.offset + len));
      this.offset += len;
      return res;
  };

  BinaryExtract.prototype.getUint8Bits = function() {
      return new BitExtract(this.getUint8());
  };

  BinaryExtract.prototype.getRaw = function(len) {
      this._assertOnRemainingLength(len);
      var res = this.buffer.slice(this.offset, this.offset + len);
      this.offset += len;
      return res;
  }

  BinaryExtract.prototype.getFloat = function() {
    var bytes = this.getUint32();
    // from https://stackoverflow.com/a/16001019/12636611
    var sign = (bytes & 0x80000000) ? -1 : 1;
    var exponent = ((bytes >> 23) & 0xFF) - 127;
    var significand = (bytes & ~(-1 << 23));

    if (exponent == 128) 
        return sign * ((significand) ? Number.NaN : Number.POSITIVE_INFINITY);

    if (exponent == -127) {
        if (significand == 0) return sign * 0.0;
        exponent = -126;
        significand /= (1 << 22);
    } else significand = (significand | (1 << 23)) / (1 << 23);
    return sign * significand * Math.pow(2, exponent);
    };


function stringFromUTF8Array(data)
{
  // from https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/
  var extraByteMap = [ 1, 1, 1, 1, 2, 2, 3, 0 ];
  var count = data.length;
  var str = "";    
  for (var index = 0;index < count;)
  {
      var ch = data[index++];
      if (ch & 0x80)
      {
          var extra = extraByteMap[(ch >> 3) & 0x07];
          if (!(ch & 0x40) || !extra || ((index + extra) > count))
              return null;            
          ch = ch & (0x3F >> extra);
          for (;extra > 0;extra -= 1)
          {
              var chx = data[index++];
              if ((chx & 0xC0) != 0x80)
                  return null;
              ch = (ch << 6) | (chx & 0x3F);
          }
      }    
      str += String.fromCharCode(ch);
  }
  return str;
}
