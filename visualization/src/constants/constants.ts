export const DIRECTION_N = 0;
export const DIRECTION_E = 1;
export const DIRECTION_S = 2;
export const DIRECTION_W = 3;

export const NEURON_TYPE_INPUT = 0;
export const NEURON_TYPE_INTERNAL = 1;
export const NEURON_TYPE_OUTPUT = 2;

export const SOURCE_INPUT = 0;
export const SOURCE_INTERNAL = 1;
export const TARGET_INTERNAL = 1;
export const TARGET_OUTPUT = 0;

export const SOURCE_MAPPING = {
  [SOURCE_INPUT]: 'INPUT',
  [SOURCE_INTERNAL]: 'INTERNAL',
};
export const TARGET_MAPPING = {
  [TARGET_INTERNAL]: 'INTERNAL',
  [TARGET_OUTPUT]: 'OUTPUT',
};

export const MIN_INPUT_NEURON_ID = 1;
export const MIN_INTERNAL_NEURON_ID = 128;
export const MIN_OUTPUT_NEURON_ID = 64;
