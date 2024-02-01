import { rawEncode } from '../src/ul20xx_1_1_x_encoder';
import { decodeRaw } from '../src/ul20xx_1_1_x_decoder_no_uplink.processed';

// entry point for TTN new api
export function decodeDownlink(input) {
  return decodeRaw(input.fPort, input.bytes);
}

// entry point for TTN new api
export function encodeDownlink(input) {
  return rawEncode(input);
}

