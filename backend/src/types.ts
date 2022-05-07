import { Brand, FixedLengthNumber } from './typesUtils';
import { Config } from './config';

export type BinString = Brand<string, 'Bin'>;
export type HexString = Brand<string, 'Hex'>;

/*
  Genome example
  sourceType[1], sourceId[8], targetType[1], targetId[8], weight[16]
  1 000000011 0 000000100 0001100001000101
*/

export type SourceType = FixedLengthNumber<1>;
export type SourceId = FixedLengthNumber<8>;
export type TargetType = FixedLengthNumber<1>;
export type TargetId = FixedLengthNumber<8>;
export type Weight = FixedLengthNumber<16>;

export type ParsedGene = [SourceType, SourceId, TargetType, TargetId, Weight];

export type Gene = Brand<FixedLengthNumber<34>, 'Gene'>;
export type Genome = Gene[];
export type CreatureState = {
  energy: number, // 0 - 1
};
export type Creature = {
  id: string,
  genome: Genome,
  parsedGenome: ParsedGene[],
  validNeurons: Set<Neuron['id']>,
  x: number,
  y: number,
  neuronsState: { [neuronId: number]: number },
  creatureState: CreatureState,
  ancestors?: Creature[],
};

export type Neuron = {
  id: FixedLengthNumber<8>,
  label: string,
  activation: (input: number) => number,
  output?: number,
  input?: number,
  getValue?: (creature: Creature, config: Config, simulator: Simulator) => number,
  act?: (output: number, creature: Creature, config: Config, simulator: Simulator) => void,
  type: number;
};

export type InputValues = { [inputNeuronId: number]: number };

export type SimulationNeurons = {
  inputNeurons: Neuron[],
  inputNeuronsIds: FixedLengthNumber<8>[],
  internalNeurons: Neuron[],
  internalNeuronsIds: FixedLengthNumber<8>[],
  outputNeurons: Neuron[],
  outputNeuronsIds: FixedLengthNumber<8>[],
  neuronMap: { [neuronId: FixedLengthNumber<8>]: Neuron },
  reproduceNeuronId: FixedLengthNumber<8>,
};

export type Food = {
  x: number,
  y: number,
  value: number,
};

export type World = { creatureId: Creature['id'] | null, food: number }[][];

export type SimulationStats = {
  step: number,
  generation: number,
  reproduced: number,
  populationInGeneration: number,
  averageEnergy: number,
  averageOffspring: number,
};

export type SimulatorCache = {
  [key: string]: any,
};

export type Simulator = {
  config: Config,
  neurons: SimulationNeurons,
  creatures: Creature[],
  simulateStep: () => void,
  simulateGeneration: () => void,
  moveCreature: (creature: Creature, deltaX: number, deltaY: number) => void,
  step: number,
  generation: number,
  history: SimulationStats[],
  lastGenerationCreatures: Creature[],
  lastGenerationSteps: {
    creatures: { id: Creature['id'], x: Creature['x'], y: Creature['y'] }[],
    food: { value: number, x: number, y: number }[],
  }[],
  world: World,
  stepCache: SimulatorCache,
  getStepCached: (key: string, getter: () => any) => any,
};
