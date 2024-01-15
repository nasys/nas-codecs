import { decodeRaw } from '../src/ul20xx_1_1_x_decoder.processed';

// You need only one entrypoint, others can be removed.

// entry point for TTN new api
export function decodeDownlink(input) {
  return decodeRaw(input.fPort, input.bytes);
}

// entry point for TTN new api
export function decodeUplink(input) {
  return decodeRaw(input.fPort, input.bytes);
}

// entry point for TTN old version
export function Decoder(bytes, fport) {
  return decodeRaw(fport, bytes);
}

// entry point for Chirpstack
export function Decode(fport, bytes) {
  return decodeRaw(fport, bytes);
}
