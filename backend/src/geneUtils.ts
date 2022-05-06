import { BinString, Gene, SimulationNeurons, SourceId, SourceType, TargetId, TargetType, Weight } from './types';
import {
  binString2Number, clamp,
  randomFixedLengthNumber,
  randomInteger, randomNumber,
  sliceBinString2Number,
  toBinString
} from './numberUtils';
import {
  MAX_16_BIT_INTEGER,
  MIN_INPUT_NEURON_ID,
  MIN_INTERNAL_NEURON_ID,
  MIN_OUTPUT_NEURON_ID,
  SOURCE_INPUT,
  TARGET_OUTPUT
} from './constants';
import { FixedLengthNumber } from './typesUtils';
import { Config } from './config';

export const buildGene = (
  sourceType: SourceType,
  sourceId: SourceId,
  targetType: TargetType,
  targetId: TargetId,
  weight: Weight,
): Gene => {
  const binString = `${toBinString(sourceType, 1)}${toBinString(sourceId, 8)}${toBinString(targetType, 1)}${toBinString(targetId, 8)}${toBinString(weight, 16)}` as BinString;
  const result = binString2Number<34>(binString) as Gene;
  return result;
}


export const randomGene = (
  neurons: SimulationNeurons,
  config: Config,
) => () => {
  const sourceType = neurons.internalNeuronsIds.length
    ? randomFixedLengthNumber(1)
    : SOURCE_INPUT as FixedLengthNumber<1>;
  const targetType = neurons.internalNeuronsIds.length && sourceType === SOURCE_INPUT
    ? randomFixedLengthNumber(1)
    : TARGET_OUTPUT as FixedLengthNumber<1>;

  const sourceId = (sourceType === SOURCE_INPUT
    ? randomInteger(MIN_INPUT_NEURON_ID, config.maxInputNeuronId)
    : randomInteger(MIN_INTERNAL_NEURON_ID, config.maxInternalNeuronId)) as FixedLengthNumber<8>;

  const targetId = (targetType === TARGET_OUTPUT
    ? randomInteger(MIN_OUTPUT_NEURON_ID, config.maxOutputNeuronId)
    : randomInteger(MIN_INTERNAL_NEURON_ID, config.maxInternalNeuronId)) as FixedLengthNumber<8>;

  return buildGene(
    sourceType,
    sourceId,
    targetType,
    targetId,
    randomFixedLengthNumber(16),
  );
}

export const parseGene = (gene: Gene): [SourceType, SourceId, TargetType, TargetId, Weight] => {
  const binString = toBinString(gene, 34) as BinString;

  return [
    sliceBinString2Number(binString, 0, 1),
    sliceBinString2Number(binString, 1, 8),
    sliceBinString2Number(binString, 9, 1),
    sliceBinString2Number(binString, 10, 8),
    sliceBinString2Number(binString, 18, 16),
  ];
};

const mutateType = <T extends number>(type: T, probability: number): T => {
  if (probability > Math.random()) {
    return (type ? 0 : 1) as T;
  }

  return type;
};

const mutateId = <T extends number>(id: T, probability: number, min, max): T => {
  let newId = id;
  if (probability > Math.random()) {
    newId = id + randomInteger(-1, 1) as T;
  }

  return clamp(newId, min, max) as T;
};

export const mutateWeight = (weight: Weight, probability: number): Weight => {
  let newWeight = weight;
  if (probability > Math.random()) {
    // Random modifier with higher probability of lower values (https://www.wolframalpha.com/input?i2d=true&i=1+-+Surd%5B1+-+x%2C10%5D)
    const randomModifier = (1 - Math.pow(1 - Math.random(), 1/10)) * (MAX_16_BIT_INTEGER / 2);
    const randomSign = Math.random() > 0.5 ? 1 : -1;

    newWeight = weight + randomSign * randomModifier as Weight;
  }

  const result = Math.floor(clamp(newWeight, 0, MAX_16_BIT_INTEGER)) as Weight;
  return result;
};

export const mutateGene = (gene: Gene, config: Config) => {
  const { mutationProbabilityMatrix } = config;
  const [
    sourceType,
    sourceId,
    targetType,
    targetId,
    weight,
  ] = parseGene(gene);

  const newSourceType = mutateType(sourceType, mutationProbabilityMatrix.sourceType);
  const newTargetType = mutateType(targetType, mutationProbabilityMatrix.targetType);

  const newSourceId = mutateId(
    sourceId,
    mutationProbabilityMatrix.sourceId,
    newSourceType === SOURCE_INPUT ? MIN_INPUT_NEURON_ID : MIN_INTERNAL_NEURON_ID,
    newSourceType === SOURCE_INPUT ? config.maxInputNeuronId : config.maxInternalNeuronId,
  ) ;
  const newTargetId = mutateId(
    targetId,
    mutationProbabilityMatrix.targetId,
    newTargetType === TARGET_OUTPUT ? MIN_OUTPUT_NEURON_ID : MIN_INTERNAL_NEURON_ID,
    newTargetType === TARGET_OUTPUT ? config.maxOutputNeuronId : config.maxInternalNeuronId,
  );

  return buildGene(
    newSourceType,
    newSourceId,
    newTargetType,
    newTargetId,
    mutateWeight(weight, mutationProbabilityMatrix.weight),
  )
};
