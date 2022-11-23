import {decodeRaw} from '../src/um30xx_decoder.js';
import {convertToFormatted} from '../src/util/cm_um_30xx_format.js';
import {formatElementJson, formatElementStrValueUnit, formatElementStrValue} from '../src/util/cm_um_30xx_format.js';


// Change formatElementStrValueUnit to formatElementStrValue if only values are needed
// If raw formatting is desired, just return directly from decodeRaw() function
// You need only one entrypoint, others can be removed.


// entry point for TTN new api
export function decodeDownlink(input) {
    var dec = decodeRaw(input.fPort, input.bytes);
    return convertToFormatted(dec, formatElementStrValueUnit, false);
}

// entry point for TTN new api
export function decodeUplink(input) {
    var dec = decodeRaw(input.fPort, input.bytes);
    return convertToFormatted(dec, formatElementStrValueUnit, false);
}

// entry point for TTN old version
export function Decoder(bytes, fport) {
    var dec = decodeRaw(fport, bytes);
    return convertToFormatted(dec, formatElementStrValueUnit, false);
}

// entry point for Chirpstack
export function Decode(fport, bytes) {
    var dec = decodeRaw(fport, bytes);
    return convertToFormatted(dec, formatElementStrValueUnit, false);
}
