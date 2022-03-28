import {decodeRawDownlink} from '../src/lcu_downlink_decoder.js';
import {decodeRawUplink} from '../src/lcu_uplink_decoder.js';
import {toFormatted} from '../src/util/format.js';

// TTN new api
export function decodeDownlink(input) {
    var dec = decodeRawDownlink(input.fPort, input.bytes);
    var res = toFormatted(dec);
    return res;
}

// TTN new api
export function decodeUplink(input) {
    var dec = decodeRawUplink(input.fPort, input.bytes);
    var res = toFormatted(dec);
    return res;
}
