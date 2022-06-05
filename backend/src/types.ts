import { Config } from './config';

export type TypedArray = Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array;
export const isTypedArray = (value: any): value is TypedArray =>
  ArrayBuffer.isView(value) && !(value instanceof DataView);

// indexes start with 1
export type Genomes = {
  sourceId: Uint8Array,
  targetId: Uint8Array,
  weight: Int16Array,
  validConnection: Uint8Array,
};
export type GenomeView = {
  sourceId: number,
  targetId: number,
  weight: number,
  validConnection: boolean,
}[];

// data stored in traditional array, not accessed frequently, indexes start with 1
export type CreaturesAdditionalData = {
  ancestors: { generation: number, id: number }[],
};

// indexes start with 1
export type CreaturesData = {
  alive: Int8Array,
  validNeurons: Uint16Array | Uint8Array, // there are no neurons with id = 0
  energy: Uint16Array,
  additionalData: CreaturesAdditionalData[],
  y: Uint16Array | Uint8Array,
  x: Uint16Array | Uint8Array,
};
export type CreatureDataView = {
  alive: boolean,
  validNeurons: number[],
  energy: number,
  additionalData: CreaturesAdditionalData,
  y: number,
  x: number,
};

// indexes start with 1
export type FoodData = {
  y: Uint16Array | Uint8Array,
  x: Uint16Array | Uint8Array,
  energy: Uint16Array,
};
export type FoodDataView = {
  y: number,
  x: number,
  energy: number,
};

// position of creatures and food in the world, both start with 0, because these are world grid indexes not food's or creatures'
export type WorldData = {
  creatures: Uint16Array,
  food: Uint16Array,
};
export type WorldDataView = {
  creatures: number,
  food: number,
};

type ConnectionMapEntry = { weight: number, index: number };
export type ConnectionMap = {
  from: Record<number, (ConnectionMapEntry & { targetId: number })[]>,
  to: Record<number, (ConnectionMapEntry & { sourceId: number })[]>,
}


// neurons
export type Neuron = {
  id: number,
  label: string,
  activation: (input: number) => number,
  output?: number,
  input?: number,
  getValue?: (creatureIndex: number, config: Config, simulator: Simulator) => Promise<number>,
  act?: (output: number, creatureIndex: number, config: Config, simulator: Simulator) => Promise<void>,
  type: number,
};
export type NeuronMap = { [neuronId: Neuron['id']]: Neuron }

export type NeuronsData = {
  inputNeurons: Neuron[],
  internalNeurons: Neuron[],
  outputNeurons: Neuron[],
  inputNeuronsIds: number[],
  internalNeuronsIds: number[],
  outputNeuronsIds: number[],
  neuronMap: { [p: number]: Neuron },
  possibleConnectionsTo: { [neuronId: Neuron['id']]: Neuron['id'][] },
  possibleConnectionsFrom: { [neuronId: Neuron['id']]: Neuron['id'][] },
  numberOfPossibleTargetNeurons: number,
  numberOfPossibleSourceNeurons: number,
  // reproduceNeuronId: number,
  numberOfNeurons: number,

};

export type InputValues = { [inputNeuronId: number]: number };

// simulator
export type GenerationHistoryEntry = {
  stepHistory: StepHistoryEntry[],
  totalEnergy?: number,
  creaturesNumber?: number,
  totalOffspring?: number,
  numberOfCreaturesWithOffspring?: number,
  state?: Pick<Simulator['state'], 'genomes' | 'lastGenomes' | 'creaturesData'> | null,
  timeStart?: number,
  timeEnd?: number,
};
export type StepHistoryEntry = {
  creaturesNumber: number,
  creaturesWithEnergy: number,
  state: Omit<Simulator['state'], 'genomes' | 'lastGenomes'> | null,
  timeStart: number,
  timeEnd: number,
};
export type Simulator = {
  generationsHistory: GenerationHistoryEntry[],
  state: {
    genomes: Genomes,
    lastWorld: WorldData,
    world: WorldData,
    creaturesData: CreaturesData,
    lastCreaturesData: CreaturesData,
    lastGenomes: Genomes,
    foodData: FoodData,
    maxFoodIndex: number,
    numberOfFood: number,
    generation: number,
    step: number,
  },
  neurons: NeuronsData,
  config: Config,
  resultCondition: (creatureIndex: number, creaturesData: CreaturesData, config: Config, simulator: Simulator) => ({
    reproductionProbability: number,
  }),
  cloneState: <
    TOmit extends keyof Simulator['state'] = never,
    TPick extends keyof Simulator['state'] = keyof Simulator['state']
  >({ omit, pick }?: { omit?: TOmit[], pick?: TPick[] }) =>
    Promise<Omit<Pick<Simulator['state'], TPick>, TOmit>>,
  stepCache: { [cacheKey: string]: any },
  getStepCached: <T>(key: string, getter: () => Promise<T>) => Promise<T>,
  generationCache: { [cacheKey: string]: any },
  getGenerationCached: <T>(key: string, getter: () => T) => Promise<T>,
  moveCreature: (creatureIndex: number, x: number, y: number) => Promise<void>,
  simulateStep: (generationStepLoggingEnabled?: boolean) => Promise<void>,
  simulateGeneration: () => Promise<boolean>,
};
