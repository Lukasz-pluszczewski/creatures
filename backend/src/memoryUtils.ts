import { getSharedTypedArray } from './typedArraysUtils';
import type { Config } from './config';
import type {
  CreaturesAdditionalData,
  CreaturesData,
  FoodData,
  Genomes,
  NeuronsData,
  TypedArray,
} from './types';
import { isTypedArray } from './types';

export const createPopulationDataStorage = (
  config: Config,
  neurons: NeuronsData
): { genomes: Genomes, creaturesData: CreaturesData } => {
  // creating memory storage for genomes' values SourceId, TargetId, Weight, validConnection
  // creatures indexes start with 1
  const genomes = {
    sourceId: getSharedTypedArray((config.populationLimit + 1) * config.genomeLength, Uint8Array),
    targetId: getSharedTypedArray((config.populationLimit + 1) * config.genomeLength, Uint8Array),
    weight: getSharedTypedArray((config.populationLimit + 1) * config.genomeLength, Int16Array),
    validConnection: getSharedTypedArray((config.populationLimit + 1) * config.genomeLength, Uint8Array),
  };

  // creating memory storage for creatures' data
  // creatures indexes start with 1
  const creaturesData = {
    x: config.worldSizeX > 255
      ? getSharedTypedArray((config.populationLimit + 1), Uint16Array)
      : getSharedTypedArray((config.populationLimit + 1), Uint8Array),
    y: config.worldSizeY > 255
      ? getSharedTypedArray((config.populationLimit + 1), Uint16Array)
      : getSharedTypedArray((config.populationLimit + 1), Uint8Array),
    validNeurons: getSharedTypedArray((config.populationLimit + 1) * neurons.numberOfNeurons, Uint8Array),
    energy: getSharedTypedArray((config.populationLimit + 1), Uint16Array),
    alive: getSharedTypedArray((config.populationLimit + 1), Int8Array),

    // creating memory storage for creatures' additional data that is not accessed frequently
    // creatures indexes start with 1
    additionalData: [] as CreaturesAdditionalData[],
  };

  return { genomes, creaturesData };
};
export const clearTypedArray = (array: TypedArray): void => {
  array.fill(0);
}
export const clearDataStorage = <T extends { [key: string]: TypedArray | any }>(data: T) => {
  Object.entries(data).forEach(([key, value]) => {
    if (isTypedArray(value)) {
      clearTypedArray(value);
    } else {
      data[key as keyof T] = [] as TypedArray | any;
    }
  });
};
export const copyTypedArray = <T extends TypedArray>(source: T, target: T) => target.set(source);
export const copyDataStorage = (source: Record<string, TypedArray | any>, target: Record<string, TypedArray | any>) => {
  Object.entries(source).forEach(([key, value]) => {
    if (isTypedArray(value) && isTypedArray(target[key])) {
      return copyTypedArray(value, target[key]);
    }
    target[key] = value;
  });
}
export const cloneTypedArray = <T extends TypedArray>(array: T): T => {
  // @ts-ignore
  const cloned = new array.constructor(array.length);
  copyTypedArray(array, cloned);
  return cloned;
}
export const cloneDataStorage = <T extends Record<string, TypedArray | any>>(data: T): T => {
  return Object.entries(data).reduce((accu, [key, value]) => {
    accu[key as keyof T] = isTypedArray(value) ? cloneTypedArray(value) : value;
    return accu;
  }, {} as T);
}

export const createFoodDataStorage = (config: Config) => {
  const maxFoodNumber = config.worldSizeX * config.worldSizeY;
  // creating memory storage for food data
  // food indexes start with 1
  const foodData: FoodData = {
    x: config.worldSizeX > 255
      ? getSharedTypedArray(maxFoodNumber + 1, Uint16Array)
      : getSharedTypedArray(maxFoodNumber + 1, Uint8Array),
    y: config.worldSizeY > 255
      ? getSharedTypedArray(maxFoodNumber + 1, Uint16Array)
      : getSharedTypedArray(maxFoodNumber + 1, Uint8Array),
    energy: getSharedTypedArray(maxFoodNumber + 1, Uint16Array),
  };

  return foodData;
};
