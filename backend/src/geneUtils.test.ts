import { createNumber, toBinString } from './numberUtils';
import { buildGene, mutateGene, mutateWeight, parseGene, randomGene } from './geneUtils';
import {
  MAX_16_BIT_INTEGER,
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
import { areDistinct } from './testUtils';
import { Neuron } from './types';

describe('buildGene', () => {
  it('generates gene that is then correctly parsed', () => {
    const sourceType = createNumber(SOURCE_INPUT, 1);
    const sourceId = createNumber(2, 8);
    const targetType = createNumber(TARGET_OUTPUT, 1);
    const targetId = createNumber(65, 8);
    const weight = createNumber(10000, 16);

    const gene = buildGene(
      sourceType,
      sourceId,
      targetType,
      targetId,
      weight,
    );

    const [
      resultSourceType,
      resultSourceId,
      resultTargetType,
      resultTargetId,
      resultWeight,
    ] = parseGene(gene);

    expect(resultSourceType).toEqual(sourceType);
    expect(resultSourceId).toEqual(sourceId);
    expect(resultTargetType).toEqual(targetType);
    expect(resultTargetId).toEqual(targetId);
    expect(resultWeight).toEqual(weight);
  });
});
describe('parseGene', () => {
  it('parses gene that is then correctly built', () => {
    throw new Error('IMPLEMENT!!!!');
    // const sourceType = createNumber(SOURCE_INPUT, 1);
    // const sourceId = createNumber(2, 8);
    // const targetType = createNumber(TARGET_OUTPUT, 1);
    // const targetId = createNumber(65, 8);
    // const weight = createNumber(10000, 16);
    //
    // const gene = buildGene(
    //   sourceType,
    //   sourceId,
    //   targetType,
    //   targetId,
    //   weight,
    // );
    // console.log('gene', gene);
    //
    // const [
    //   resultSourceType,
    //   resultSourceId,
    //   resultTargetType,
    //   resultTargetId,
    //   resultWeight,
    // ] = parseGene(gene);
    //
    // expect(resultSourceType).toEqual(sourceType);
    // expect(resultSourceId).toEqual(sourceId);
    // expect(resultTargetType).toEqual(targetType);
    // expect(resultTargetId).toEqual(targetId);
    // expect(resultWeight).toEqual(weight);
  });
});
describe('randomGene', () => {
  it('generates random values inside correct ranges', () => {
    const neurons = generateNeurons(config);

    Array(1000).fill(0).forEach(() => {
      const gene = randomGene(neurons, config)();
      const [
        resultSourceType,
        resultSourceId,
        resultTargetType,
        resultTargetId,
        resultWeight,
      ] = parseGene(gene);

      if (resultSourceType === SOURCE_INPUT) {
        expect(resultSourceId).toBeGreaterThanOrEqual(MIN_INPUT_NEURON_ID);
        expect(resultSourceId).toBeLessThanOrEqual(config.maxInputNeuronId);
      } else {
        expect(resultSourceId).toBeGreaterThanOrEqual(MIN_INTERNAL_NEURON_ID);
        expect(resultSourceId).toBeLessThanOrEqual(config.maxInternalNeuronId);
      }
      if (resultTargetType === TARGET_OUTPUT) {
        expect(resultTargetId).toBeGreaterThanOrEqual(MIN_OUTPUT_NEURON_ID);
        expect(resultTargetId).toBeLessThanOrEqual(config.maxOutputNeuronId);
      } else {
        expect(resultTargetId).toBeGreaterThanOrEqual(MIN_INTERNAL_NEURON_ID);
        expect(resultTargetId).toBeLessThanOrEqual(config.maxInternalNeuronId);
      }
    });
  });
});
describe('mutate gene', () => {
  it('correctly mutates gene', () => {
    const sourceType = createNumber(SOURCE_INPUT, 1);
    const sourceId = createNumber(2, 8);
    const targetType = createNumber(TARGET_OUTPUT, 1);
    const targetId = createNumber(65, 8);
    const weight = createNumber(10000, 16);

    const gene = buildGene(
      sourceType,
      sourceId,
      targetType,
      targetId,
      weight,
    );

    const resultingGene = mutateGene(gene, {
      ...config,
      mutationProbabilityMatrix: {
        sourceType: 0,
        sourceId: 1,
        targetType: 0,
        targetId: 1,
        weight: 1,
      },
    } as unknown as Config)

    const geneParsed = parseGene(gene);
    const resultingGeneParsed = parseGene(resultingGene);

    expect(resultingGene).not.toEqual(gene);

    console.log(resultingGeneParsed[4]);
    // we only check if weight changed, as there are not enough neurons to ensure that source or target changed
    expect(resultingGeneParsed[4]).not.toEqual(geneParsed[4]);
  });

  describe('mutateWeight', () => {
    it('should correctly mutate weight', () => {
      [
        0,
        100,
        1000,
        10000,
        20000,
        50000,
        65500,
        MAX_16_BIT_INTEGER,
      ].forEach((weight) => {
        const baseWeight = createNumber(weight, 16);

        const results = [
          mutateWeight(baseWeight, 1),
          mutateWeight(baseWeight, 1),
          mutateWeight(baseWeight, 1),
          mutateWeight(baseWeight, 1),
          mutateWeight(baseWeight, 1),
          mutateWeight(baseWeight, 1),
          mutateWeight(baseWeight, 1),
        ];

        // we check if weight actually randomly mutated, but we allow min and max values to repeat
        expect(areDistinct(results.filter(value => (value !== 0 && value !== MAX_16_BIT_INTEGER)))).toBe(true);
        results.forEach(result => {
          expect(result).toBeLessThanOrEqual(MAX_16_BIT_INTEGER);
          expect(result).toBeGreaterThanOrEqual(0);
        })
      });

    })
  });
});


describe.skip('Locality sensitive hashing algorithm', () => {
  it.skip('murmurhash', () => {
    var murmurHash = require('murmurhash-native').murmurHash;

    const gene = '100010000010010011100010000';
    const geneHash = murmurHash(gene, 0);

    [
      '100010000010010011100010000',
      '100010000010010011100010001',
      '000010000010010011100010000',
      '100010000010010111100010000',
      '100010000010010010100010000',
      '100010000000010011100010000',
    ].forEach(gene => {
      const geneHash = murmurHash(gene, 0);
      console.log(gene, geneHash);
    });

    //
    // [
    //   ''
    // ]
    // console.log(murmurHash( 'hash me!' )) // 2061152078
    // console.log(murmurHash( 'hash mee!' ))
    // console.log(murmurHash( 'hash mf!' ))
    // console.log(murmurHash( 'hash ma!' ))
    // console.log(murmurHash( 'asdf' ))
    // console.log(murmurHash( 'asdfa' ))
  });
  it('nilsimsa', () => {
    const random = () => {
      const gene = randomGene(
        {
          inputNeurons: [],
          inputNeuronsIds: [1, 2, 3, 4, 5] as FixedLengthNumber<8>[],
          internalNeurons: [],
          internalNeuronsIds: [] as FixedLengthNumber<8>[],
          outputNeurons: [],
          outputNeuronsIds: [64, 65] as FixedLengthNumber<8>[],
          neuronMap: {},
        },
        config,
      )();

      return toBinString(gene);
    };
    const minGene = () => {
      const sourceType = createNumber(SOURCE_INPUT, 1);
      const sourceId = createNumber(MIN_INPUT_NEURON_ID, 8);
      const targetType = createNumber(TARGET_OUTPUT, 1);
      const targetId = createNumber(MIN_OUTPUT_NEURON_ID, 8);
      const weight = createNumber(0, 16);

      const gene = buildGene(
        sourceType,
        sourceId,
        targetType,
        targetId,
        weight,
      );

      return toBinString(gene * 2 as any);
    };
    const { Nilsimsa } = require('nilsimsa');
    // const base = '000000000000000000000000000';
    const base = minGene();
    const baseHash = new Nilsimsa(base).digest('hex');

    [
      '100010000010010011100010000',
      '100010000010010011100010001',
      '000010000010010011100010000',
      '100010000010010111100010000',
      '100010000010010010100010000',
      '100010000000010011100010000',
    ].forEach(gene => {
      const geneHash = new Nilsimsa(gene).digest('hex');
      console.log(gene, geneHash, Nilsimsa.compare(baseHash, geneHash));
    });

    console.log('-----------------------------------')
    const results = { min: 999999999, max: 0 };
    createArray(20).forEach(() => {
      const gene = random();
      const geneHash = new Nilsimsa(gene).digest('hex');
      const diff = Nilsimsa.compare(baseHash, geneHash);
      results.min = Math.min(diff, results.min);
      results.max = Math.max(diff, results.max);
      console.log('diff', gene, diff);
    });
    console.log(results);
    console.log('-----------')

    // const d1 = new Nilsimsa('The quick brown fox').digest('hex'); // 0a31b4be01a0808a29e0ec60e9a258545dc0526770022348380a2128708f2fdb
    // const d2 = new Nilsimsa('The quicker brown fox').digest('hex'); // 1a31bc3e02a080a28b642864ea224857ddd0526f78022b48380e2269329d3fdb
    //
    // Nilsimsa.compare(d1, d2) // 91
  });
  it('string-similarity', () => {
    const random = () => {
      const gene = randomGene(
        {
          inputNeurons: [],
          inputNeuronsIds: [1, 2, 3, 4, 5] as FixedLengthNumber<8>[],
          internalNeurons: [],
          internalNeuronsIds: [] as FixedLengthNumber<8>[],
          outputNeurons: [],
          outputNeuronsIds: [64, 65] as FixedLengthNumber<8>[],
          neuronMap: {},
        },
        config,
      )();

      return toBinString(gene);
    };
    const minGene = () => {
      const sourceType = createNumber(SOURCE_INPUT, 1);
      const sourceId = createNumber(MIN_INPUT_NEURON_ID, 8);
      const targetType = createNumber(TARGET_OUTPUT, 1);
      const targetId = createNumber(MIN_OUTPUT_NEURON_ID, 8);
      const weight = createNumber(0, 16);

      const gene = buildGene(
        sourceType,
        sourceId,
        targetType,
        targetId,
        weight,
      );

      return toBinString(gene * 2 as any);
    };
    const stringSimilarity = require('string-similarity');
    // const base = '000000000000000000000000000';
    const base = minGene();

    [
      '100010000010010011100010000',
      '100010000010010011100010001',
      '000010000010010011100010000',
      '100010000010010111100010000',
      '100010000010010010100010000',
      '100010000000010011100010000',
    ].forEach(gene => {
      // const geneHash = new Nilsimsa(gene).digest('hex');
      console.log(gene, stringSimilarity.compareTwoStrings(gene, base));
    });

    console.log('-----------------------------------')
    const results = { min: 999999999, max: 0 };
    createArray(20).forEach(() => {
      const gene = random();
      const diff = stringSimilarity.compareTwoStrings(gene, base);
      results.min = Math.min(diff, results.min);
      results.max = Math.max(diff, results.max);
      console.log('diff', gene, diff);
    });
    console.log(results);
    console.log('-----------')

    // const d1 = new Nilsimsa('The quick brown fox').digest('hex'); // 0a31b4be01a0808a29e0ec60e9a258545dc0526770022348380a2128708f2fdb
    // const d2 = new Nilsimsa('The quicker brown fox').digest('hex'); // 1a31bc3e02a080a28b642864ea224857ddd0526f78022b48380e2269329d3fdb
    //
    // Nilsimsa.compare(d1, d2) // 91
  })
})
