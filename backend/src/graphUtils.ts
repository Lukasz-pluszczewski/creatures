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
import { NEURON_TYPE_OUTPUT, SOURCE_INPUT, SOURCE_INTERNAL, TARGET_INTERNAL } from './constants';
import { config } from './config';
import { union } from './setUtils';
import { testGenome } from './testEntities';

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

  // console.log('------------- Calculating... -------------');

  // calculating input neurons
  neurons.inputNeurons.forEach(neuron => {
    if (!validNeurons.has(neuron.id)) {
      return;
    }
    inputAndInternalNeuronsValuesMap[neuron.id] = neuron.activation(inputs[neuron.id]);
    // console.log('Input calculated', neuron.label, inputs[neuron.id], inputAndInternalNeuronsValuesMap[neuron.id]);
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
    // console.log('Internal calculated', neuron.label, inputSum, inputAndInternalNeuronsValuesMap[neuron.id]);
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
    // console.log('Output calculated', neuron.label, inputSum, outputNeuronsValuesMap[neuron.id]);
  });

  return outputNeuronsValuesMap;
}



// /*
// Going backwards from output neurons, to calculate what input neurons can have any influence on output neurons
// and thus must be calculated. It also detects cycles in graph.
//  */
// export const traverseTheGraph = (neuronIds: Neuron['id'][], connectionMap: ConnectionMap, internalNeuronsHistory?: number[]) => {
//   let inputNeuronsToCalculate: Record<SourceId, true> = {};
//   let internalNeuronsToCalculate: Record<SourceId, true> = {};
//   neuronIds.forEach(neuronId => {
//
//     // checking if we returned to already visited neuron (thus detecting a cycle). We allow connecting neuron to itself so we need the third condition
//     if (
//       internalNeuronsHistory
//       && internalNeuronsHistory.includes(neuronId)
//       && internalNeuronsHistory[internalNeuronsHistory.length - 1] !== neuronId
//     ) {
//       throw new Error('Cycle detected');
//     }
//     const internalNeurons: Neuron['id'][] = [];
//     connectionMap.to[neuronId]?.forEach(({ index, sourceId, sourceType }) => {
//       if (sourceType === SOURCE_INPUT) {
//         if (!sourceId) {
//           console.log('!sourceId', index, sourceType, sourceId);
//           console.log('connectionMap', connectionMap);
//         }
//         inputNeuronsToCalculate[sourceId] = true;
//       } else {
//         internalNeurons.push(sourceId);
//       }
//     });
//     const {
//       inputNeuronsToCalculate: subInputNeuronsToCalculate,
//     } = traverseTheGraph(
//       internalNeurons,
//       connectionMap,
//       internalNeuronsHistory ? [...internalNeuronsHistory, neuronId] : [],
//     );
//     inputNeuronsToCalculate = {
//       ...inputNeuronsToCalculate,
//       ...subInputNeuronsToCalculate,
//     };
//   });
//
//   return {
//     inputNeuronsToCalculate,
//   };
// };
//
//
//
// /*
// Verify circular dependencies, and orphaned connections
//  */
// export const validateGenomeGraph = (genome: Gene[], inputNeurons: Neuron[], internalNeurons: Neuron[], outputNeurons: Neuron[]) => {
//   const connectionMap = getRawConnectionMap(genome);
//
//   const duplicateHashTable: Record<string, true> = {};
//   const parsedGenome = genome.map((gene, index) => {
//     const [
//       sourceType,
//       sourceId,
//       targetType,
//       targetId,
//       weight,
//     ] = parseGene(gene);
//     const duplicated = duplicateHashTable[`${sourceId}-${targetId}`];
//     duplicateHashTable[`${sourceId}-${targetId}`] = true;
//
//     return {
//       sourceType,
//       sourceId,
//       targetType,
//       targetId,
//       weight,
//       duplicated,
//       self: sourceId === targetId,
//       index,
//     };
//   });
//
//   try {
//     const {
//       inputNeuronsToCalculate,
//     } = traverseTheGraph(outputNeurons.map(({ id }) => id), connectionMap);
//
//     return {
//       inputNeuronsToCalculate,
//       parsedGenome,
//       connectionMap,
//     };
//   } catch (error) {
//     return {
//       inputNeuronsToCalculate: {},
//       parsedGenome,
//       connectionMap,
//     };
//   }
// };
//
//
// /*
// Go through whole graph built according to genome and calculate outputs
//  */
// export const calculateGraphLegacy = (inputs: InputValues, genome: ParsedGene[], inputNeurons: Neuron[], internalNeurons: Neuron[], outputNeurons: Neuron[]) => {
//   const rawConnectionMap = getRawConnectionMap(genome);
//
//
//
//   const validNeurons = traverseOutputNeurons(outputNeurons, rawConnectionMap);
//   const validGenome = cleanGenome(parsedTestGonome, validNeurons);
//
//   const {
//     inputNeuronsToCalculate,
//     parsedGenome,
//     connectionMap,
//   } = validateGenomeGraph(genome, inputNeurons, internalNeurons, outputNeurons);
//
//   const neuronMap = [...inputNeurons, ...internalNeurons, ...outputNeurons].reduce<{ [neuronId: number]: Neuron }>((accu, neuron) => {
//     accu[neuron.id] = neuron;
//     return accu;
//   }, {});
//
//
//   // calculating input neurons
//   Object.keys(inputNeuronsToCalculate).forEach(inputNeuronId => {
//     const neuron = neuronMap[parseInt(inputNeuronId)];
//     if (!neuron) {
//       // console.log('inputNeuronId', inputNeuronId);
//       // console.log('neuronMap', neuronMap);
//       // console.log('inputNeuronsToCalculate', inputNeuronsToCalculate);
//       // console.log('inputNeurons', inputNeurons);
//     }
//     neuron.input = inputs[neuron.id];
//     neuron.output = neuron.activation(neuron.input);
//   });
//
//   // calculating internal neurons
//   internalNeurons.forEach((internalNeuron) => {
//     const inputSum = (connectionMap.to[internalNeuron.id] || []).reduce((sum, connection) => {
//       const connectedNeuron = neuronMap[connection.sourceId];
//       return sum + connectedNeuron.output * getWeight(connection.weight, config.weightMultiplier);
//     }, 0);
//     internalNeuron.input = inputSum;
//     internalNeuron.output = internalNeuron.activation(internalNeuron.input);
//   });
//
//   // calculating output neurons
//   outputNeurons.forEach((outputNeuron) => {
//     const inputSum = (connectionMap.to[outputNeuron.id] || []).reduce((sum, connection) => {
//       const connectedNeuron = neuronMap[connection.sourceId];
//       return sum + connectedNeuron.output * getWeight(connection.weight, config.weightMultiplier);
//     }, 0);
//     outputNeuron.input = inputSum;
//     outputNeuron.output = outputNeuron.activation(outputNeuron.input);
//   });
//
//   return outputNeurons;
// };
