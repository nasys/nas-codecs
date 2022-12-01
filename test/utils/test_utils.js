export function hexToBytes(hex) {
  hex = hex.replace(/\s/g, '');
  var bytes = [];
  for (var c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

export function testPacket({
  decoderFn, fport, data, expected,
}) {
  var buffer = hexToBytes(data);
  var res = decoderFn(fport, buffer);

  // sort to ignore order for tests
  var sortedRes = Object.keys(res).sort().reduce((result, key) => {
    result[key] = res[key];
    return result;
  }, {});
  var sortedExp = Object.keys(expected).sort().reduce((result, key) => {
    result[key] = res[key];
    return result;
  }, {});

  expect(JSON.stringify(sortedRes)).toEqual(JSON.stringify(sortedExp));
}
