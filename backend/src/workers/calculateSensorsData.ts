import { expose } from 'threads/worker';

import { Config } from '../config';
import { InputValues, NeuronsData, Simulator } from '../types';
import { forEachAsync } from '../arrayUtils';
import { generateNeurons } from '../neuronsUtils';
import { getSimulatorStateFromBuffers } from '../typedArraysUtils';
import { RecursiveToBuffers } from '../typesUtilities';

const workerState: { neurons: NeuronsData, config: Config } = {
  neurons: null,
  config: null,
};

const worker = {
  setConfig: async (config: Config) => {
    workerState.neurons = generateNeurons(config);
    workerState.config = config;
  },
  calculate: async (creatureIndexes: number[], resultsBuffer: InputValues['buffer'], stateBuffers: any) => {
    const state = getSimulatorStateFromBuffers(stateBuffers);
    const results = new Float32Array(resultsBuffer);
    results[2] = 15;

    await forEachAsync(creatureIndexes, async (creatureIndex) => {
      await forEachAsync(workerState.neurons.inputNeurons, async inputNeuron => {
        const { id, getValue } = inputNeuron;
        if (getValue) {
          const value = await getValue(creatureIndex, workerState.config, state);
          results[creatureIndex * (workerState.config.maxInputNeuronId + 1) + id] = value;
          results[3] = creatureIndex * (workerState.config.maxInputNeuronId + 1) + id;
        }
      });
    });
  },
};

expose(worker);

export type Worker = typeof worker;
