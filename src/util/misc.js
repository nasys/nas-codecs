
export function pad(number, length) {
  var str = "" + number;
  while (str.length < length) {
      str = "0" + str;
  }   
  return str;
}

export function bytesToHexStr(byte_arr) {
  var res = "";
  for(var i = 0; i<byte_arr.length; i++) {
      res += ("00"+byte_arr[i].toString(16)).slice(-2).toUpperCase();
  }
  return res;
}

export function bitFalseTrue(bit) {
  return {value: bit ? true: false}
}
