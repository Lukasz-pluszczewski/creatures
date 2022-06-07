import {
  MAX_16_BIT_INTEGER,
  MIN_16_BIT_SIGNED_INTEGER,
} from '../constants';
import { Config, getConfig } from '../config';
import { createTestSimulator, TestCreature, TestFood } from '../testSimulator';

import { CreaturesData, NeuronsData, Simulator } from '../types';
import { generateNeurons, getNeuronIdByLabel } from '../neuronsUtils';

export const testConfig = getConfig({
  population: 1,
  generationLength: 200,
  genomeLength: 4,
  internalNeurons: 0,
  worldSizeX: 128,
  worldSizeY: 128,

  weightMultiplier: 0.2,
});
const resultCondition = (creatureIndex: number, creaturesData: CreaturesData, config: Config, simulator: Simulator) => {
  return { reproductionProbability: 1 };
};

const a = 500;
const testCreatures = (config: Config, neuronsData: NeuronsData): TestCreature[] => [
  {
    label: 'in the center',
    x: 20,
    y: 120,
    energy: MAX_16_BIT_INTEGER,
    genome: [
      {
        sourceId: getNeuronIdByLabel(neuronsData, 'northWallDistance'),
        targetId: getNeuronIdByLabel(neuronsData, 'moveVertical'),
        weight: a / config.weightMultiplier,
      },
      {
        sourceId: getNeuronIdByLabel(neuronsData, 'bias'),
        targetId: getNeuronIdByLabel(neuronsData, 'moveVertical'),
        weight: a * -0.55 / config.weightMultiplier,
      },
      {
        sourceId: getNeuronIdByLabel(neuronsData, 'eastWallDistance'),
        targetId: getNeuronIdByLabel(neuronsData, 'moveHorizontal'),
        weight: a / config.weightMultiplier,
      },
      {
        sourceId: getNeuronIdByLabel(neuronsData, 'bias'),
        targetId: getNeuronIdByLabel(neuronsData, 'moveHorizontal'),
        weight: a * -0.55 / config.weightMultiplier,
      },
    ],
  },
  {
    label: 'in the center',
    x: 100,
    y: 40,
    energy: MAX_16_BIT_INTEGER,
    genome: [
      {
        sourceId: getNeuronIdByLabel(neuronsData, 'northWallDistance'),
        targetId: getNeuronIdByLabel(neuronsData, 'moveVertical'),
        weight: a / config.weightMultiplier,
      },
      {
        sourceId: getNeuronIdByLabel(neuronsData, 'bias'),
        targetId: getNeuronIdByLabel(neuronsData, 'moveVertical'),
        weight: a * -0.55 / config.weightMultiplier,
      },
      {
        sourceId: getNeuronIdByLabel(neuronsData, 'eastWallDistance'),
        targetId: getNeuronIdByLabel(neuronsData, 'moveHorizontal'),
        weight: a / config.weightMultiplier,
      },
      {
        sourceId: getNeuronIdByLabel(neuronsData, 'bias'),
        targetId: getNeuronIdByLabel(neuronsData, 'moveHorizontal'),
        weight: a * -0.55 / config.weightMultiplier,
      },
    ],
  },
];
const testFood = (config: Config): TestFood[] => [];

export const createSimulator = () => createTestSimulator(
  testConfig,
  resultCondition,
  testCreatures(testConfig, generateNeurons(testConfig)),
  testFood(testConfig)
);
