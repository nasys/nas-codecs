export function hexToBytes(hex) {
  hex = hex.replace(/\s/g, '');
  var bytes = [];
  for (var c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

const sortKeys = (obj) => Object.assign(...Object.entries(obj).sort().map(([key, value]) => ({
  [key]: value,
})));

export function testPacket({
  decoderFn, fport, data, expected,
}) {
  var buffer = hexToBytes(data);
  var res = decoderFn(fport, buffer);

  // sort to ignore order for tests
  var sortedRes = sortKeys(res);
  var sortedExp = sortKeys(expected);

  if (JSON.stringify(sortedRes) !== JSON.stringify(sortedExp)) {
    console.log(JSON.stringify(res));
  }
  expect(sortedRes).toEqual(sortedExp);
//  expect(JSON.stringify(sortedRes)).toEqual(JSON.stringify(sortedExp));
}
