import {
  CreaturesData,
  FoodData,
  Genomes,
  isTypedArray,
  Simulator,
  TypedArray,
  TypedArrayConstructor,
  WorldData
} from './types';

export function getSharedTypedArray(elements: number[], typedArrayConstructor: Uint8ArrayConstructor): Uint8Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Uint16ArrayConstructor): Uint16Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Uint32ArrayConstructor): Uint32Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Uint8ClampedArrayConstructor): Uint8ClampedArray;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Int8ArrayConstructor): Int8Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Int16ArrayConstructor): Int16Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Int32ArrayConstructor): Int32Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Float32ArrayConstructor): Float32Array;
export function getSharedTypedArray(elements: number[], typedArrayConstructor: Float64ArrayConstructor): Float64Array;

export function getSharedTypedArray(length: number, typedArrayConstructor: Uint8ArrayConstructor): Uint8Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Uint16ArrayConstructor): Uint16Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Uint32ArrayConstructor): Uint32Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Uint8ClampedArrayConstructor): Uint8ClampedArray;
export function getSharedTypedArray(length: number, typedArrayConstructor: Int8ArrayConstructor): Int8Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Int16ArrayConstructor): Int16Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Int32ArrayConstructor): Int32Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Float32ArrayConstructor): Float32Array;
export function getSharedTypedArray(length: number, typedArrayConstructor: Float64ArrayConstructor): Float64Array;

export function getSharedTypedArray(argument: number | number[] | SharedArrayBuffer | TypedArray, typedArrayConstructor: TypedArrayConstructor) {
  if (Array.isArray(argument)) {
    const typedArray = new typedArrayConstructor(new SharedArrayBuffer(argument.length * typedArrayConstructor.BYTES_PER_ELEMENT));
    typedArray.set(argument);

    return typedArray;
  }
  if (typeof argument === 'number') {
    return new typedArrayConstructor(new SharedArrayBuffer(argument * typedArrayConstructor.BYTES_PER_ELEMENT));
  }
  if (isTypedArray(argument) && argument.buffer instanceof SharedArrayBuffer) {
    return new typedArrayConstructor(argument.buffer);
  }
  if (argument instanceof SharedArrayBuffer) {
    return new typedArrayConstructor(argument);
  }

  throw new Error('Invalid argument');
}

export class BitArray {
  typedArray: Uint8Array;
  byteLength: number;
  length: number;
  getBit: (index: number) => boolean;
  setBit: (index: number, value: number | boolean) => void;

  constructor(argument: number | ArrayLike<number | boolean> | BitArray | ArrayBufferLike) {
    this.getBit = index => ((this.typedArray[Math.floor(index / 8)]>>(index % 8)) % 2 != 0);

    this.setBit = (index, value) => {
      const arrayIndex = Math.floor(index / 8);
      this.typedArray[arrayIndex] = value
        ? (this.typedArray[arrayIndex] | 1<<(index % 8))
        : (this.typedArray[arrayIndex] & ~(1<<(index % 8)));
    };

    if (typeof argument === 'number') {
      this.typedArray = new Uint8Array(Math.ceil(argument / 8));
      this.byteLength = this.typedArray.length;
      this.length = argument;
    } else if (Array.isArray(argument) || isTypedArray(argument)) {
      this.typedArray = new Uint8Array(Math.ceil(argument.length / 8));
      argument.forEach((value, index) => {
        this.setBit(index, value);
      });
      this.byteLength = this.typedArray.length;
      this.length = argument.length;
    } else if (argument instanceof BitArray) {
      this.typedArray = argument.typedArray;
      this.byteLength = this.typedArray.length;
      this.length = argument.length;
    }  else {
      this.typedArray = new Uint8Array(argument as ArrayBufferLike);
      this.byteLength = this.typedArray.length;
      this.length = this.typedArray.length * 8;
    }


    return new Proxy(this, {
      get: function (target, index) {
        if (
          typeof index === 'symbol' ||
          index === 'BYTES_PER_ELEMENT'
        ) {
          return target.typedArray[index];
        }
        if (index === 'typedArray') {
          return target.typedArray;
        }
        if (
          index === 'byteLength' ||
          index === 'length'
        ) {
          return target[index];
        }

        return target.getBit(+index);
      },
      set: function (target, index, value) {
        if (typeof index === 'symbol') {
          return target.typedArray[index] = value;
        }

        target.setBit(+index, value);
        return true;
      }
    });
  }
}

export const getSimulatorStateWithBuffers = (simulatorState: Simulator['state']) => {
  return {
    genomes: {
      sourceId: simulatorState.genomes.sourceId.buffer,
      targetId: simulatorState.genomes.targetId.buffer,
      weight: simulatorState.genomes.weight.buffer,
      validConnection: simulatorState.genomes.validConnection.buffer,
    },
    lastWorld: {
      creatures: simulatorState.lastWorld.creatures.buffer,
      food: simulatorState.lastWorld.food.buffer,
    },
    world: {
      creatures: simulatorState.world.creatures.buffer,
      food: simulatorState.world.food.buffer,
    },
    creaturesData: {
      alive: simulatorState.creaturesData.alive.buffer,
      validNeurons: simulatorState.creaturesData.validNeurons.buffer,
      energy: simulatorState.creaturesData.energy.buffer,
      y: simulatorState.creaturesData.y.buffer,
      x: simulatorState.creaturesData.x.buffer,
    },
    lastCreaturesData: {
      alive: simulatorState.lastCreaturesData.alive.buffer,
      validNeurons: simulatorState.lastCreaturesData.validNeurons.buffer,
      energy: simulatorState.lastCreaturesData.energy.buffer,
      y: simulatorState.lastCreaturesData.y.buffer,
      x: simulatorState.lastCreaturesData.x.buffer,
    },
    lastGenomes: {
      sourceId: simulatorState.lastGenomes.sourceId.buffer,
      targetId: simulatorState.lastGenomes.targetId.buffer,
      weight: simulatorState.lastGenomes.weight.buffer,
      validConnection: simulatorState.lastGenomes.validConnection.buffer,
    },
    foodData: {
      y: simulatorState.foodData.y.buffer,
      x: simulatorState.foodData.x.buffer,
      energy: simulatorState.foodData.energy.buffer,
    },
    stepCache: {
      closestFood: simulatorState.stepCache.closestFood.buffer,
    },
    maxFoodIndex: simulatorState.maxFoodIndex,
    numberOfFood: simulatorState.numberOfFood,
    generation: simulatorState.generation,
    step: simulatorState.step,
  };
}
export const getSimulatorStateFromBuffers = (simulatorState): Simulator['state'] => {
  return {
    genomes: {
      sourceId: getSharedTypedArray(simulatorState.genomes.sourceId, Uint8Array),
      targetId: getSharedTypedArray(simulatorState.genomes.targetId, Uint8Array),
      weight: getSharedTypedArray(simulatorState.genomes.weight, Int16Array),
      validConnection: getSharedTypedArray(simulatorState.genomes.validConnection, Uint8Array),
    },
    lastWorld: {
      creatures: getSharedTypedArray(simulatorState.lastWorld.creatures, Uint16Array),
      food: getSharedTypedArray(simulatorState.lastWorld.food, Uint16Array),
    },
    world: {
      creatures: getSharedTypedArray(simulatorState.world.creatures, Uint16Array),
      food: getSharedTypedArray(simulatorState.world.food, Uint16Array),
    },
    creaturesData: {
      alive: getSharedTypedArray(simulatorState.creaturesData.alive, Int8Array),
      validNeurons: getSharedTypedArray(simulatorState.creaturesData.validNeurons, Uint8Array),
      energy: getSharedTypedArray(simulatorState.creaturesData.energy, Uint16Array),
      y: getSharedTypedArray(simulatorState.creaturesData.x, Uint16Array),
      x: getSharedTypedArray(simulatorState.creaturesData.y, Uint16Array),
    },
    lastCreaturesData: {
      alive: getSharedTypedArray(simulatorState.lastCreaturesData.alive, Int8Array),
      validNeurons: getSharedTypedArray(simulatorState.lastCreaturesData.validNeurons, Uint8Array),
      energy: getSharedTypedArray(simulatorState.lastCreaturesData.energy, Uint16Array),
      y: getSharedTypedArray(simulatorState.lastCreaturesData.x, Uint16Array),
      x: getSharedTypedArray(simulatorState.lastCreaturesData.y, Uint16Array),
    },
    lastGenomes: {
      sourceId: getSharedTypedArray(simulatorState.lastGenomes.sourceId, Uint8Array),
      targetId: getSharedTypedArray(simulatorState.lastGenomes.targetId, Uint8Array),
      weight: getSharedTypedArray(simulatorState.lastGenomes.weight, Int16Array),
      validConnection: getSharedTypedArray(simulatorState.lastGenomes.validConnection, Uint8Array),
    },
    foodData: {
      y: getSharedTypedArray(simulatorState.foodData.y, Uint16Array),
      x: getSharedTypedArray(simulatorState.foodData.x, Uint16Array),
      energy: getSharedTypedArray(simulatorState.foodData.energy, Uint16Array),
    },
    stepCache: {
      closestFood: getSharedTypedArray(simulatorState.stepCache.closestFood, Uint16Array),
    },
    maxFoodIndex: simulatorState.maxFoodIndex,
    numberOfFood: simulatorState.numberOfFood,
    generation: simulatorState.generation,
    step: simulatorState.step,
  };
};
