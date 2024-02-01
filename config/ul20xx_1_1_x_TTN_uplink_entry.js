import { decodeRaw } from '../src/ul20xx_1_1_x_decoder.processed';

// entry point for TTN new api
export function decodeUplink(input) {
  return decodeRaw(input.fPort, input.bytes);
}
