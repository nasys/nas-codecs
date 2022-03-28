
export function hexToBytes(hex) {
    hex = hex.replace(/\s/g,'');
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

export function testOnePacket({decoderFn, fport, data, expected}) {    
    var buffer = hexToBytes(data);
    var res = decoderFn(fport, buffer);
    expect(JSON.stringify(res)).toEqual(JSON.stringify(expected));
}
