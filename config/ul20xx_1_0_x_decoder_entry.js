import { decodeRaw } from '../src/ul20xx_1_0_x_decoder.processed';
import { convertObjToFormatted, formatElementStrValueUnit, formatElementStrValue } from '../src/util/ul20xx_format';

// Change formatElementStrValueUnit to formatElementStrValue if only values are needed
// If raw formatting is desired, just return directly from decodeRaw() function
// You need only one entrypoint, others can be removed.

// entry point for TTN new api
export function decodeDownlink(input) {
  var dec = decodeRaw(input.fPort, input.bytes);
  return convertObjToFormatted(dec, formatElementStrValueUnit);
}

// entry point for TTN new api
export function decodeUplink(input) {
  var dec = decodeRaw(input.fPort, input.bytes);
  return convertObjToFormatted(dec, formatElementStrValueUnit);
}

// entry point for TTN old version
export function Decoder(bytes, fport) {
  var dec = decodeRaw(fport, bytes);
  return convertObjToFormatted(dec, formatElementStrValueUnit);
}

// entry point for Chirpstack
export function Decode(fport, bytes) {
  var dec = decodeRaw(fport, bytes);
  return convertObjToFormatted(dec, formatElementStrValueUnit);
}
