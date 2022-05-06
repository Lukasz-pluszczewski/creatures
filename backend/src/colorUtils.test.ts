import { createNumber, toBinString } from './numberUtils';
import { buildGene, parseGene, randomGene } from './geneUtils';
import {
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID,
  MIN_OUTPUT_NEURON_ID,
  SOURCE_INPUT,
  TARGET_OUTPUT
} from './constants';
import { generateNeurons } from './neuronsUtils';
import { Config, config } from './config';
import { murmurHash } from 'murmurhash-native';
import { createArray } from './arrayUtils';
import { FixedLengthNumber } from './typesUtils';
import { hslToHex } from './colorUtils';

describe('color', () => {
  it('color', () => {
    console.log(hslToHex(300, 100, 50));

  });
});
