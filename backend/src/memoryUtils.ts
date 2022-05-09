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
  const genomes = {
    sourceId: new Uint8Array(config.populationLimit * config.genomeLength),
    targetId: new Uint8Array(config.populationLimit * config.genomeLength),
    weight: new Int16Array(config.populationLimit * config.genomeLength),
  };

  // creating memory storage for creatures' data
  const creaturesData = {
    x: config.worldSizeX > 255
      ? new Uint16Array(config.populationLimit)
      : new Uint8Array(config.populationLimit),
    y: config.worldSizeY > 255
      ? new Uint16Array(config.populationLimit)
      : new Uint8Array(config.populationLimit),
    validNeurons: new Uint8Array(config.populationLimit * neurons.numberOfNeurons),
    energy: new Uint16Array(config.populationLimit),

    // creating memory storage for creatures' additional data that is not accessed frequently
    additionalData: [] as CreaturesAdditionalData[],
  };

  return { genomes, creaturesData };
};
export const clearDataStorage = <T extends { [key: string]: TypedArray | any }>(data: T) => {
  Object.values(data).forEach((typedArray) => typedArray.fill(0));
};
export const copyDataStorage = (source: Record<string, TypedArray | any>, target: Record<string, TypedArray | any>) => {
  Object.entries(target).forEach(([key, value]) => {
    if (isTypedArray(value) && isTypedArray(target[key])){
      return target[key].set(value);
    }
    target[key] = value;
  });
}

  // delete me
// export const copyDataStorage = (
//   source: { genomes: Genomes, creaturesData: CreaturesData, world: WorldData },
//   target: { genomes: Genomes, creaturesData: CreaturesData, world: WorldData }
// ) => {
//   target.genomes.sourceId.set(source.genomes.sourceId);
//   target.genomes.targetId.set(source.genomes.targetId);
//   target.genomes.weight.set(source.genomes.weight);
//   target.creaturesData.x.set(source.creaturesData.x);
//   target.creaturesData.x.set(source.creaturesData.x);
//   target.creaturesData.validNeurons.set(source.creaturesData.validNeurons);
//   target.creaturesData.energy.set(source.creaturesData.energy);
//   target.creaturesData.additionalData = source.creaturesData.additionalData;
//   target.world.creatures.set(source.world.creatures);
//   target.world.food.set(source.world.food);
// };
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
