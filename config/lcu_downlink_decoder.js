import {decodeRawDownlink} from '../src/lcu_downlink_decoder.js';
import {toFormatted} from '../src/util/format.js';

// TTN new api
export function decodeDownlink(input) {
    var dec = decodeRawDownlink(input.fPort, input.bytes);
    var res = toFormatted(dec);
    return res;
}
