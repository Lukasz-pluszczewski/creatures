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
export type Creature = {
  id: string,
  genome: Genome,
  parsedGenome: ParsedGene[],
  validNeurons: Set<Neuron['id']>,
  x: number,
  y: number,
  neuronsState: { [neuronId: number]: number },
  ancestors?: Creature[],
};

export type Neuron = {
  id: FixedLengthNumber<8>,
  label: string,
  activation: (input: number) => number,
  output?: number,
  input?: number,
  getValue?: (creature: Creature, config: Config, creatures: Creature[]) => number,
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
};

export type World = { id: Creature['id'] }[][];

export type SimulationStats = {
  step: number,
  generation: number,
  reproduced: number,
  populationInGeneration: number,
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
  lastGenerationSteps: { id: Creature['id'], x: Creature['x'], y: Creature['y'] }[][],
  world: World,
};
