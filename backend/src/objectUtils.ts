import {
  CreatureDataView,
  CreaturesData,
  FoodData,
  FoodDataView,
  Genomes,
  GenomeView,
  NeuronsData, Simulator,
  TypedArray
} from './types';
import { Config } from './config';
import { createArray, iterateOverRange } from './arrayUtils';

export const omitPick = <
  TObject extends { [key: string]: unknown },
  TOmit extends keyof TObject = never,
  TPick extends keyof TObject = keyof TObject,
>(
  object: TObject,
  { omit, pick }: { omit?: TOmit[], pick?: TPick[] } = {},
) => {
  return Object.keys(object)
    .reduce((acc, key) => {
      if (omit && omit.length && (omit as string[]).includes(key)) {
        return acc;
      }
      if (pick && pick.length && !(pick as string[]).includes(key)) {
        return acc;
      }
      acc[key] = object[key];
      return acc;
    }, {} as Omit<Pick<TObject, TPick>, TOmit>);
};

export const getCreaturesDataView = (
  creaturesData: CreaturesData,
  neurons: NeuronsData,
): CreatureDataView[] => {
  const creaturesDataView: CreatureDataView[] = [];
  let index = 1;
  while (creaturesData.alive[index]) {
    creaturesDataView.push({
      alive: !!creaturesData.alive[index],
      validNeurons: createArray(neurons.numberOfNeurons).map((__, neuronIndex) => creaturesData.validNeurons[index * neurons.numberOfNeurons + neuronIndex]),
      energy: creaturesData.energy[index],
      additionalData: creaturesData.additionalData[index],
      y: creaturesData.y[index],
      x: creaturesData.x[index],
    });
    index++;
  }

  return creaturesDataView;
};

export const getGenomesView = (
  creaturesData: CreaturesData,
  genomes: Genomes,
  config: Config,
): GenomeView[] => {
  const genomesView: GenomeView[] = [];
  let index = 1;
  while (creaturesData.alive[index]) {
    genomesView.push(createArray(config.genomeLength).map((__, genomeIndex) => {
      const geneIndex = index * config.genomeLength + genomeIndex;

      return {
        sourceId: genomes.sourceId[geneIndex],
        targetId: genomes.targetId[geneIndex],
        weight: genomes.weight[geneIndex],
        validConnection: !!genomes.validConnection[geneIndex],
      };
    }));
    index++;
  }

  return genomesView;
};

export const getFoodDataView = (
  foodData: FoodData,
  simulator: Simulator,
): FoodDataView[] => {
  const foodDataView: FoodDataView[] = [];

  iterateOverRange(1, simulator.state.maxFoodIndex, (foodIndex) => {
    foodDataView.push({
      x: foodData.x[foodIndex],
      y: foodData.y[foodIndex],
      energy: foodData.energy[foodIndex],
    });
  });

  return foodDataView;
};
