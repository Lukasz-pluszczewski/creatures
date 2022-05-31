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
  // creating memory storage for genomes' values SourceType, SourceId, TargetType, TargetId, Weight
  // creatures indexes start with 1
  const genomes = {
    sourceId: new Uint8Array((config.populationLimit + 1) * config.genomeLength),
    targetId: new Uint8Array((config.populationLimit + 1) * config.genomeLength),
    weight: new Int16Array((config.populationLimit + 1) * config.genomeLength),
  };

  // creating memory storage for creatures' data
  // creatures indexes start with 1
  const creaturesData = {
    x: config.worldSizeX > 255
      ? new Uint16Array((config.populationLimit + 1))
      : new Uint8Array((config.populationLimit + 1)),
    y: config.worldSizeY > 255
      ? new Uint16Array((config.populationLimit + 1))
      : new Uint8Array((config.populationLimit + 1)),
    validNeurons: new Uint8Array((config.populationLimit + 1) * neurons.numberOfNeurons),
    energy: new Uint16Array((config.populationLimit + 1)),
    alive: new Int8Array((config.populationLimit + 1)),

    // creating memory storage for creatures' additional data that is not accessed frequently
    // creatures indexes start with 1
    additionalData: [] as CreaturesAdditionalData[],
  };

  return { genomes, creaturesData };
};
export const clearDataStorage = <T extends { [key: string]: TypedArray | any }>(data: T) => {
  Object.entries(data).forEach(([key, value]) => {
    if (isTypedArray(value)){
      value.fill(0);
    } else {
      data[key as keyof T] = [] as TypedArray | any;
    }
  });
};
export const copyDataStorage = (source: Record<string, TypedArray | any>, target: Record<string, TypedArray | any>) => {
  Object.entries(source).forEach(([key, value]) => {
    if (isTypedArray(value) && isTypedArray(target[key])){
      return target[key].set(value);
    }
    target[key] = value;
  });
}

export const createFoodDataStorage = (config: Config) => {
  const maxFoodNumber = config.worldSizeX * config.worldSizeY;
  const foodData: FoodData = {
    x: config.worldSizeX > 255
      ? new Uint16Array(maxFoodNumber)
      : new Uint8Array(maxFoodNumber),
    y: config.worldSizeY > 255
      ? new Uint16Array(maxFoodNumber)
      : new Uint8Array(maxFoodNumber),
    energy: new Uint16Array(maxFoodNumber),
  };

  return foodData;
};
