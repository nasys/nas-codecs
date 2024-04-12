import { BinaryPack, BitPack } from '../../src/util/pack';

function err() {
  return { errors: [], warnings: [] };
}

describe('BitPack tests', () => {
  test('addBit all valid', () => {
    var bits = new BitPack(err());
    bits.addBit(1, "key");
    bits.addBit(0, "key");
    bits.addBit(true, "key");
    bits.addBit(false, "key");
    bits.addBit("true", "key");
    bits.addBit("TRUE", "key");
    bits.addBit("false", "key");
    bits.addBit("1", "key");
    expect(bits.data_byte).toEqual(0xB5);
  });

  test('addBits all valid', () => {
    var bits = new BitPack(err());
    bits.addBits(3, 2, "key");
    bits.addBits(22, 6, "key");
    expect(bits.data_byte).toEqual(0x5B);
  });

  test('addBits overflow', () => {
    var bits = new BitPack(err());
    bits.addBits(3, 2, "key");
    bits.addBits(22, 7, "key");
    expect(bits.err.errors.length).toEqual(1);
  });

  test('addBit some string', () => {
    var bits = new BitPack(err());
    bits.addBit("true2", "key");
    expect(bits.err.warnings).toEqual(["key invalid_boolean_value_or_key_not_found"]);
  });

  test('addBit non-bool integer', () => {
    var bits = new BitPack(err());
    bits.addBit(3, "key");
    expect(bits.err.warnings).toEqual(["key invalid_boolean_value_or_key_not_found"]);
  });
});


describe('BinaryPack tests', () => {
  test('error too small', () => {
    var pack = new BinaryPack(err());
    pack.addUint8(-1, "key");
    expect(pack.err.warnings).toEqual(["key value_too_small"]);
    expect(pack.err.warnings.length).toEqual(1);
  });

  test('error too large', () => {
    var pack = new BinaryPack(err());
    pack.addUint8(256, "key");
    expect(pack.err.warnings).toEqual(["key value_too_large"]);
  });

  test('error not int', () => {
    var pack = new BinaryPack(err());
    pack.addUint8("abc", "key");
    expect(pack.err.warnings).toEqual(["key value_not_integer"]);
  });

  test('encode int8', () => {
    var pack = new BinaryPack(err());
    pack.addInt8(0, "key");
    pack.addInt8("1", "key");
    pack.addInt8(127, "key");
    pack.addInt8(-1, "key");
    pack.addInt8(-128, "key");

    expect(pack.buffer[0]).toEqual(0);
    expect(pack.buffer[1]).toEqual(1);
    expect(pack.buffer[2]).toEqual(127);
    expect(pack.buffer[3]).toEqual(255);
    expect(pack.buffer[4]).toEqual(128);
    expect(pack.err.warnings.length).toEqual(0);
  });

  test('encode int8', () => {
    var pack = new BinaryPack(err());
    pack.addInt8(0, "key");
    pack.addInt8("1", "key");
    pack.addInt8(127, "key");
    pack.addInt8(-1, "key");
    pack.addInt8(-128, "key");

    expect(pack.buffer[0]).toEqual(0);
    expect(pack.buffer[1]).toEqual(1);
    expect(pack.buffer[2]).toEqual(127);
    expect(pack.buffer[3]).toEqual(255);
    expect(pack.buffer[4]).toEqual(128);
    expect(pack.err.warnings.length).toEqual(0);
  });

  test('encode float 1', () => {
    var pack = new BinaryPack(err());
    pack.addFloat(1, "key");
    expect(pack.buffer).toEqual([0x00, 0x00, 0x80, 0x3F]);
    expect(pack.err.warnings.length).toEqual(0);
  });

  test('encode float -1', () => {
    var pack = new BinaryPack(err());
    pack.addFloat(-1, "key");
    expect(pack.buffer).toEqual([0x00, 0x00, 0x80, 0xbF]);
    expect(pack.err.warnings.length).toEqual(0);
  });

});
