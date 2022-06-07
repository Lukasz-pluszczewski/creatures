import { iterateOverRange, times } from './arrayUtils';
import { getRawConnectionMap, traverseOutputNeurons } from './graphUtils';
import { genomeValidator, worldDataValidator } from './debugUtils';
import {
  createTestSimulator,
  resultCondition,
  testFood as getTestFood,
  testCreatures as getTestCreatures,
  testConfig,
} from './testSimulator';
import { generateNeurons } from './neuronsUtils';

const testCreatures = getTestCreatures(testConfig, generateNeurons(testConfig));
const testFood = getTestFood(testConfig);

describe('test data', () => {
  it('is valid', () => {
    expect(testCreatures.length).toBe(testConfig.population);
  });
});
describe('simulator', () => {
  let simulator;
  beforeEach(() => {
    simulator = createTestSimulator(testConfig, resultCondition, testCreatures, testFood);
  });

  describe('data storage', () => {
    it('has correct creatures data', () => {
      let numberOfCreatures = 0;
      iterateOverRange(1, simulator.config.population, creatureIndex => {
        if (simulator.state.creaturesData.alive[creatureIndex]) {
          numberOfCreatures++;
          const testCreatureDefinition = testCreatures.find(
            (creatureDefinition, index) => (index + 1) === creatureIndex
          );
          expect(simulator.state.creaturesData.x[creatureIndex]).toBe(testCreatureDefinition.x);
          expect(simulator.state.creaturesData.y[creatureIndex]).toBe(testCreatureDefinition.y);
          expect(simulator.state.creaturesData.energy[creatureIndex]).toBe(testCreatureDefinition.energy);
          expect(simulator.state.world.creatures[testCreatureDefinition.y * simulator.config.worldSizeX + testCreatureDefinition.x])
            .toBe(creatureIndex);
        }
      });

      expect(numberOfCreatures).toBe(testCreatures.length);
    });

    it('has correct food data', () => {
      testFood.forEach((food, index) => {
        expect(simulator.state.foodData.x[index + 1]).toBe(food.x);
        expect(simulator.state.foodData.y[index + 1]).toBe(food.y);
        expect(simulator.state.foodData.energy[index + 1]).toBe(food.energy);
        expect(simulator.state.world.food[food.y * simulator.config.worldSizeX + food.x]).toBe(index + 1);
      });
    });

    it('has correct maxFoodIndex', () => {
      expect(simulator.state.maxFoodIndex).toBe(testFood.length);
    });

    it('has correct numberOfFood', () => {
      expect(simulator.state.numberOfFood).toBe(testFood.length);
    });

    it('has correct genome data', () => {
      testCreatures.forEach((creature, index) => {
        const rawConnectionMap = getRawConnectionMap(index + 1, simulator.state.genomes, testConfig);
        const validNeurons = traverseOutputNeurons(simulator.neurons, rawConnectionMap);

        let validNeuronIdIndex = 0;
        validNeurons.forEach((validNeuronId) => {
          expect(simulator.state.creaturesData.validNeurons[
          (index + 1) * simulator.neurons.numberOfNeurons + validNeuronIdIndex++
            ]).toBe(validNeuronId);
        });
      });


      testCreatures.forEach((creature, index) => {
        times(simulator.config.genomeLength, geneIndex => {
          expect(simulator.state.genomes.sourceId[(index + 1) * testConfig.genomeLength + geneIndex])
            .toBe(creature.genome[geneIndex].sourceId);
          expect(simulator.state.genomes.targetId[(index + 1) * testConfig.genomeLength + geneIndex])
            .toBe(creature.genome[geneIndex].targetId);
          expect(simulator.state.genomes.weight[(index + 1) * testConfig.genomeLength + geneIndex])
            .toBe(creature.genome[geneIndex].weight);
        });
      });
    });
  });
  describe('step simulator', () => {
    beforeEach(() => {
      // we test if the food actually disappear and is not available for "trying to eat food too" creature
      // so we must disable regrowing food for this test
      simulator.config.foodRegrowLimit = 0;
    });
    testCreatures.forEach((creature, index) => {
      it(`simulates step of creature "${creature.label}"`, () => {
        times(2, i => {
          simulator.simulateStep();
          expect(simulator.state.creaturesData.x[index + 1]).toBe(creature.expect[i].x);
          expect(simulator.state.creaturesData.y[index + 1]).toBe(creature.expect[i].y);
          expect(simulator.state.creaturesData.energy[index + 1]).toBe(creature.expect[i].energy);
          expect(simulator.state.world.creatures[creature.expect[i].y * simulator.config.worldSizeX + creature.expect[i].x])
            .toBe(index + 1);
        });
      });
    });
  });
  describe('generation simulator', () => {
    it('simulates generation', () => {
      times(50, () => {
        const result = simulator.simulateGeneration();

        expect(result).toBe(true);
        genomeValidator(
          simulator.state.creaturesData,
          simulator.state.genomes,
          simulator.config
        );
        worldDataValidator(
          simulator.state.world,
          simulator.state.creaturesData,
          simulator.state.foodData,
          simulator.config,
        );
      });
    });
  });
  describe('simulator.cloneState', () => {
    it('structuredClone clones object with typed array', () => {
      const source = {
        foo: new Uint8Array([1, 3, 5, 7, 10]),
      };
      const clone = structuredClone(source);
      expect(clone).toEqual(source);
      expect(clone).not.toBe(source);
    });
    it('clones whole state', () => {
      const clonedState = simulator.cloneState();
      expect(clonedState).not.toBe(simulator.state);

      clonedState.genomes.sourceId.forEach((sourceId, index) => {
        expect(sourceId).toBe(simulator.state.genomes.sourceId[index]);
      });
      clonedState.genomes.targetId.forEach((targetId, index) => {
        expect(targetId).toBe(simulator.state.genomes.targetId[index]);
      });
      clonedState.genomes.weight.forEach((weight, index) => {
        expect(weight).toBe(simulator.state.genomes.weight[index]);
      });
      clonedState.genomes.validConnection.forEach((validConnection, index) => {
        expect(validConnection).toBe(simulator.state.genomes.validConnection[index]);
      })
      clonedState.creaturesData.x.forEach((x, index) => {
        expect(x).toBe(simulator.state.creaturesData.x[index]);
      });
      clonedState.creaturesData.y.forEach((y, index) => {
        expect(y).toBe(simulator.state.creaturesData.y[index]);
      });
      clonedState.creaturesData.energy.forEach((energy, index) => {
        expect(energy).toBe(simulator.state.creaturesData.energy[index]);
      });
      clonedState.creaturesData.validNeurons.forEach((validNeuron, index) => {
        expect(validNeuron).toBe(simulator.state.creaturesData.validNeurons[index]);
      });

      genomeValidator(clonedState.creaturesData, clonedState.genomes, simulator.config);
      worldDataValidator(clonedState.world, clonedState.creaturesData, clonedState.foodData, simulator.config);
    });
    it('clones part of the state', () => {
      const clonedState = simulator.cloneState({ pick: ['genomes'] });
      expect(clonedState.genomes).not.toBe(simulator.state.genomes);

      clonedState.genomes.sourceId.forEach((sourceId, index) => {
        expect(sourceId).toBe(simulator.state.genomes.sourceId[index]);
      });
      clonedState.genomes.targetId.forEach((targetId, index) => {
        expect(targetId).toBe(simulator.state.genomes.targetId[index]);
      });
      clonedState.genomes.weight.forEach((weight, index) => {
        expect(weight).toBe(simulator.state.genomes.weight[index]);
      });
      clonedState.genomes.validConnection.forEach((validConnection, index) => {
        expect(validConnection).toBe(simulator.state.genomes.validConnection[index]);
      })

      genomeValidator(simulator.state.creaturesData, clonedState.genomes, simulator.config);
    });
  });
  describe('generation log', () => {
    it('contains valid data', () => {
      simulator.simulateGeneration();
      simulator.simulateGeneration();
      simulator.simulateGeneration();

      times(3, generationIndex => {
        times(simulator.config.generationLength, stepIndex => {
          genomeValidator(
            simulator.generationsHistory[generationIndex].stepHistory[stepIndex].state.creaturesData,
            simulator.generationsHistory[generationIndex].state.genomes,
            simulator.config
          );
          worldDataValidator(
            simulator.generationsHistory[generationIndex].stepHistory[stepIndex].state.world,
            simulator.generationsHistory[generationIndex].stepHistory[stepIndex].state.creaturesData,
            simulator.generationsHistory[generationIndex].stepHistory[stepIndex].state.foodData,
            simulator.config,
          );
        });
      });
    });
  });
});
