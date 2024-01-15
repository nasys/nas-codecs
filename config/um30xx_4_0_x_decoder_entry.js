import { decodeRaw } from '../src/um30xx_decoder';

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
