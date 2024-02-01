import { rawEncode } from '../src/ul20xx_1_1_x_encoder';

// You need only one entrypoint, others can be removed.

// entry point for TTN new api
export function encodeDownlink(input) {
  return rawEncode(input);
}
