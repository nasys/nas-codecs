import {decodeRawUplink} from '../src/lcu_uplink_decoder.js';
import {toFormatted} from '../src/util/format.js';

// TTN new api
export function decodeUplink(input) {
    var dec = decodeRawUplink(input.fPort, input.bytes);
    var res = toFormatted(dec);
    return res;
}
