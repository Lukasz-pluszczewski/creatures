import { parseGene } from './geneUtils';
import {
  Creature,
  Gene,
  InputValues,
  Neuron,
  ParsedGene,
  SimulationNeurons,
  SourceId,
  SourceType,
  TargetId,
  TargetType,
  Weight
} from './types';
import { push } from './arrayUtils';
import { SOURCE_INPUT, SOURCE_INTERNAL, TARGET_INTERNAL } from './constants';
import { config } from './config';

type ConnectionMap = {
  from: Record<number, { weight: Weight, index: number, sourceType: SourceType, targetId: TargetId, targetType: TargetType }[]>,
  to: Record<number, { weight: Weight, index: number, targetType: TargetType, sourceType: SourceType, sourceId: SourceId }[]>,
}

export const getWeight = (weight: Weight, weightMultiplier: number) => (weight - 32768) * weightMultiplier;

export const traverseNeuron = (neuronId: Neuron['id'], connectionMap: ConnectionMap, visitedNeurons: Neuron['id'][] = []) =>
  (connectionMap.to[neuronId] || []).reduce((
    validNeurons,
    { sourceId, sourceType, targetType }
  ) => {
    if (visitedNeurons[visitedNeurons.length - 1] === sourceId) {
      return validNeurons;
    }
    if (visitedNeurons.includes(sourceId)) {
      throw new Error(`Cycle detected in neuron ${neuronId} <- ${sourceId}`);
    }
    if (sourceType === SOURCE_INTERNAL && targetType === TARGET_INTERNAL && sourceId !== neuronId) {
      console.log('Internal connection detected', sourceId, neuronId);
      throw new Error('Currently internal neurons cannot connect with each other');
    }
    if (sourceType === SOURCE_INPUT) {
      validNeurons.add(neuronId);
      validNeurons.add(sourceId);
    } else {
      const subValidNeurons = traverseNeuron(sourceId, connectionMap, [...visitedNeurons, neuronId]);
      if (subValidNeurons.size) {
        validNeurons.add(neuronId);
        for (let neuron of subValidNeurons) {
          validNeurons.add(neuron);
        }
      }
    }

    return validNeurons;
  }, new Set<Neuron['id']>());

export const traverseOutputNeurons = (outputNeurons: Neuron[], connectionMap: ConnectionMap) =>
  outputNeurons.reduce((validNeurons, neuron) => {
    for (let validNeuron of traverseNeuron(neuron.id, connectionMap)) {
      validNeurons.add(validNeuron);
    }
    return validNeurons;
  }, new Set<Neuron['id']>());


export const getRawConnectionMap = (genome: ParsedGene[]) => {
  const connectionMap: ConnectionMap = {
    from: {},
    to: {},
  };
  genome.forEach((gene, index) => {
    const [
      sourceType,
      sourceId,
      targetType,
      targetId,
      weight,
    ] = gene;
    if (!sourceId || !targetId) {
      console.log('connectionMap 0', sourceType, sourceId, targetType, targetId, weight, index);
    }
    connectionMap.from[sourceId] = push(connectionMap.from[sourceId], { weight, index, sourceType, targetId, targetType });
    connectionMap.to[targetId] = push(connectionMap.to[targetId], { weight, index, targetType, sourceId, sourceType });
  });
  return connectionMap;
};

export const cleanGenome = (
  genome: ParsedGene[],
  validNeurons,
) => {
  return genome.filter(([, sourceId, , targetId], index) => {
    const isDuplicate = genome.findIndex(([, compareSourceId, , compareTargetId]) => {
      return sourceId === compareSourceId && targetId === compareTargetId;
    }) !== index;

    return validNeurons.has(sourceId) && validNeurons.has(targetId) && !isDuplicate;
  });
};

export const calculateGraph = (
  inputs: InputValues,
  genome: ParsedGene[],
  neurons: SimulationNeurons,
  validNeurons: Creature['validNeurons']
) => {
  const connectionMap = getRawConnectionMap(genome);
  const inputAndInternalNeuronsValuesMap: { [neuronId: Neuron['id']]: number } = {};
  const outputNeuronsValuesMap: { [neuronId: Neuron['id']]: number } = {};

  // calculating input neurons
  neurons.inputNeurons.forEach(neuron => {
    if (!validNeurons.has(neuron.id)) {
      return;
    }
    inputAndInternalNeuronsValuesMap[neuron.id] = neuron.activation(inputs[neuron.id]);
  });

  // calculating internal neurons
  neurons.internalNeurons.forEach(neuron => {
    if (!validNeurons.has(neuron.id)) {
      return;
    }
    const inputSum = (connectionMap.to[neuron.id] || []).reduce((sum, connection) => {
      return sum + inputAndInternalNeuronsValuesMap[connection.sourceId] * getWeight(connection.weight, config.weightMultiplier);
    }, 0);
    inputAndInternalNeuronsValuesMap[neuron.id] = neuron.activation(inputSum);
  });

  // calculating output neurons
  neurons.outputNeurons.forEach(neuron => {
    if (!validNeurons.has(neuron.id)) {
      return;
    }
    const inputSum = (connectionMap.to[neuron.id] || []).reduce((sum, connection) => {
      return sum + inputAndInternalNeuronsValuesMap[connection.sourceId] * getWeight(connection.weight, config.weightMultiplier);
    }, 0);
    outputNeuronsValuesMap[neuron.id] = neuron.activation(inputSum);
  });

  return outputNeuronsValuesMap;
}
