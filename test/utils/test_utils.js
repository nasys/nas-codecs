
export function hexToBytes(hex) {
    hex = hex.replace(/\s/g,'');
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

export function testPacket({decoderFn, fport, data, expected}) {    
    var buffer = hexToBytes(data);
    var res = decoderFn(fport, buffer);

    // sort to ignore order for tests
    var sorted_res = Object.keys(res).sort().reduce(function (result, key) {
        result[key] = res[key];
        return result;
    }, {});
    var sorted_exp = Object.keys(expected).sort().reduce(function (result, key) {
        result[key] = res[key];
        return result;
    }, {});

    expect(JSON.stringify(sorted_res)).toEqual(JSON.stringify(sorted_exp));
}
