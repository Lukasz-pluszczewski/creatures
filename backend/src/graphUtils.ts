import { push, times } from './arrayUtils';
import {
  NEURON_TYPE_INPUT,
  NEURON_TYPE_INTERNAL,
} from './constants';
import { Config } from './config';
import { ConnectionMap, Genomes, InputValues, Neuron, NeuronsData, Simulator } from './types';

export const getWeight = (weight: number, weightMultiplier: number) => weight * weightMultiplier;

export const traverseNeuron = (
  neuronId: Neuron['id'],
  connectionMap: ConnectionMap,
  neurons: NeuronsData,
  visitedNeurons: Neuron['id'][] = []
) =>
  (connectionMap.to[neuronId] || []).reduce((
    validNeurons,
    { sourceId }
  ) => {
    if (visitedNeurons[visitedNeurons.length - 1] === sourceId) {
      return validNeurons;
    }
    if (visitedNeurons.includes(sourceId)) {
      throw new Error(`Cycle detected in neuron ${neuronId} <- ${sourceId}`);
    }
    if (
      neurons.neuronMap[sourceId].type === NEURON_TYPE_INTERNAL
      && neurons.neuronMap[neuronId].type === NEURON_TYPE_INTERNAL
      && sourceId !== neuronId
    ) {
      console.log('Internal connection detected', sourceId, neuronId);
      throw new Error('Currently internal neurons cannot connect with each other');
    }
    if (neurons.neuronMap[sourceId].type === NEURON_TYPE_INPUT) {
      validNeurons.add(neuronId);
      validNeurons.add(sourceId);
    } else {
      const subValidNeurons = traverseNeuron(
        sourceId,
        connectionMap,
        neurons,
        [...visitedNeurons, neuronId]
      );
      if (subValidNeurons.size) {
        validNeurons.add(neuronId);
        for (let neuron of subValidNeurons) {
          validNeurons.add(neuron);
        }
      }
    }

    return validNeurons;
  }, new Set<Neuron['id']>());

export const traverseOutputNeurons = (neurons: NeuronsData, connectionMap: ConnectionMap) =>
  neurons.outputNeurons.reduce<Set<Neuron['id']>>((validNeurons, neuron) => {
    for (let validNeuron of traverseNeuron(neuron.id, connectionMap, neurons)) {
      validNeurons.add(validNeuron);
    }
    return validNeurons;
  }, new Set<Neuron['id']>());


export const getRawConnectionMap = (creatureIndex: number, genomes: Genomes, config: Config) => {
  const connectionMap: ConnectionMap = {
    from: {},
    to: {},
  };
  times(config.genomeLength, geneIndex => {
    const sourceId = genomes.sourceId[creatureIndex * config.genomeLength + geneIndex];
    const targetId = genomes.targetId[creatureIndex * config.genomeLength + geneIndex];
    const weight = genomes.weight[creatureIndex * config.genomeLength + geneIndex];

    if (!sourceId || !targetId) {
      return;
    }
    connectionMap.from[sourceId] = push(connectionMap.from[sourceId], { weight, index: geneIndex, targetId });
    connectionMap.to[targetId] = push(connectionMap.to[targetId], { weight, index: geneIndex, sourceId });
  });
  return connectionMap;
};

export const cleanGenome = (
  creatureIndex: number,
  genomes: Genomes,
  validNeurons: Set<Neuron['id']>,
  config: Config,
) => {
  times(config.genomeLength, geneIndex => {
    genomes.validConnection[creatureIndex * config.genomeLength + geneIndex] = 1;
    const sourceId = genomes.sourceId[creatureIndex * config.genomeLength + geneIndex];
    const targetId = genomes.targetId[creatureIndex * config.genomeLength + geneIndex];

    let isDuplicate = false;
    times(config.genomeLength, compareGeneIndex => {
      if (compareGeneIndex === geneIndex) {
        return;
      }
      const compareSourceId = genomes.sourceId[creatureIndex * config.genomeLength + compareGeneIndex];
      const compareTargetId = genomes.targetId[creatureIndex * config.genomeLength + compareGeneIndex];
      if (sourceId === compareSourceId && targetId === compareTargetId) {
        isDuplicate = true;
      }
    });

    if (isDuplicate || !validNeurons.has(sourceId) || !validNeurons.has(targetId)) {
      // genomes.sourceId[creatureIndex * config.genomeLength + geneIndex] = 0;
      // genomes.targetId[creatureIndex * config.genomeLength + geneIndex] = 0;
      // genomes.weight[creatureIndex * config.genomeLength + geneIndex] = 0;
      genomes.validConnection[creatureIndex * config.genomeLength + geneIndex] = 0;
    }
  });
};

export const calculateGraph = async (
  creatureIndex: number,
  inputValues: InputValues,
  simulator: Simulator,
) => {
  const connectionMap = getRawConnectionMap(creatureIndex, simulator.state.genomes, simulator.config);
  const inputAndInternalNeuronsValuesMap: { [neuronId: Neuron['id']]: number } = {};
  const outputNeuronsValuesMap: { [neuronId: Neuron['id']]: number } = {};

  const validNeuronsMap = new Set();
  times(simulator.neurons.numberOfNeurons, neuronIndex => {
    const validNeuronId =
      simulator.state.creaturesData.validNeurons[creatureIndex * simulator.neurons.numberOfNeurons + neuronIndex];

    if (validNeuronId) {
      validNeuronsMap.add(validNeuronId);
    }
  });

  // calculating input neurons
  simulator.neurons.inputNeurons.forEach(neuron => {
    if (!validNeuronsMap.has(neuron.id)) {
      return;
    }
    inputAndInternalNeuronsValuesMap[neuron.id] = neuron.activation(
      inputValues[creatureIndex * (simulator.config.maxInputNeuronId + 1) + neuron.id]
    );
  });

  // calculating internal neurons
  simulator.neurons.internalNeurons.forEach(neuron => {
    if (!validNeuronsMap.has(neuron.id)) {
      return;
    }
    const inputSum = (connectionMap.to[neuron.id] || []).reduce((sum, connection) => {
      return sum + inputAndInternalNeuronsValuesMap[connection.sourceId] * getWeight(connection.weight, simulator.config.weightMultiplier);
    }, 0);
    inputAndInternalNeuronsValuesMap[neuron.id] = neuron.activation(inputSum);
  });

  // calculating output neurons
  simulator.neurons.outputNeurons.forEach(neuron => {
    if (!validNeuronsMap.has(neuron.id)) {
      return;
    }
    const inputSum = (connectionMap.to[neuron.id] || []).reduce((sum, connection) => {
      return sum + inputAndInternalNeuronsValuesMap[connection.sourceId] * getWeight(connection.weight, simulator.config.weightMultiplier);
    }, 0);
    outputNeuronsValuesMap[neuron.id] = neuron.activation(inputSum);
  });

  return outputNeuronsValuesMap;
}
