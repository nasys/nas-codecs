export function pad(number, length) {
  var str = '' + number;
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
}

export function intToHexStr(int, len) {
  return pad(int.toString(16).toUpperCase(), len);
}

export function bytesToHexStr(byteArr) {
  var res = '';
  for (var i = 0; i < byteArr.length; i += 1) {
    res += ('00' + byteArr[i].toString(16)).slice(-2).toUpperCase();
  }
  return res;
}

export function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
  bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

export function objToList(obj) {
  var res = [];
  // eslint-disable-next-line no-restricted-syntax
  for (var key in obj) {
    if (obj[key] !== undefined && obj[key]) {
      res.push(key);
    }
  }
  return res;
}
