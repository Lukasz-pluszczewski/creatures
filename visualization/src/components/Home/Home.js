import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import _ from 'lodash';
import { FormControl, Form, Button, Container, Col, Row } from 'react-bootstrap';
import swich from 'swich';

import './Home.scss';

import { World } from '../World/World';
import { NeuronVisualization } from '../NeuronVisualization/NeuronVisualization';
import { CreatureInfo } from '../CreatureInfo/CreatureInfo';
import { Tabs } from '../Tabs/Tabs';
import { SimulationInfo } from '../SimulationInfo/SimulationInfo';
import { CustomDropdown } from './Dropdown';

const useLoadData = (cb) => {
  const queryClient = useQueryClient();
  return useQuery('data', () => {
    return axios.get('http://localhost:8080');
  }, {
    onSuccess: () => {
      cb();
      queryClient.invalidateQueries('generationData');
    },
  });
};
const useGenerationData = (generationIndex) => {
  return useQuery(['generationData', generationIndex], () => {
    return axios.get(`http://localhost:8080/generation/${parseInt(generationIndex)}`);
  });
};
const useStep = () => {
  const queryClient = useQueryClient();
  return useMutation(async () => {
    await axios.post('http://localhost:8080/step');
    queryClient.invalidateQueries('data');
    queryClient.invalidateQueries('generationData');
  })
};
const useReset = () => {
  const queryClient = useQueryClient();
  return useMutation(async () => {
    await axios.delete('http://localhost:8080');
    queryClient.invalidateQueries('data');
    queryClient.invalidateQueries('generationData');
  })
};
const useGeneration = () => {
  const queryClient = useQueryClient();
  return useMutation(async () => {
    await axios.post('http://localhost:8080/generation');
    queryClient.invalidateQueries('data');
    queryClient.invalidateQueries('generationData');
  })
};
const useMultipleGeneration = (numberOfGenerations) => {
  const queryClient = useQueryClient();
  return useMutation(async () => {
    await axios.post(`http://localhost:8080/generation/${numberOfGenerations}`);
    queryClient.invalidateQueries('data');
    queryClient.invalidateQueries('generationData');
  })
};

const useInput = (initial) => {
  const [state, setState] = useState(initial);
  const handleChange = (event = null) => setState(event ? event.target.value : initial);
  return [state, handleChange, setState];
};

const getCreatureToVisualize = (data, creatureIndex, creatureAncestorIndex) => {
  if (!data?.data) {
    return null;
  }
  if (creatureAncestorIndex || creatureAncestorIndex === 0) {
    return data.data.creatures[creatureIndex].ancestors[creatureAncestorIndex];
  }
  return data.data.creatures[creatureIndex];
};

const Home = () => {
  const [numberOfGenerationsToSimulate, setNumberOfGenerationsToSimulate] = useInput(100);
  const { mutate: multipleGeneration } = useMultipleGeneration(numberOfGenerationsToSimulate);

  const [selectedGeneration, setSelectedGeneration] = useInput(0);
  const [selectedStep, setSelectedStep] = useInput(0);
  const [selectedCreature, setSelectedCreature] = useState(0);

  const [isAnimating, setIsAnimating] = useState(false);

  const { data, isLoading: isLoadingSimulationData, refetch: refetchSimulationData } = useLoadData(() => {
    setSelectedGeneration();
    setSelectedStep();
    setSelectedCreature(0);
  });
  const {
    data: generationData,
    isLoading: isLoadingGenerationData,
    refetch: refetchGenerationData
  } = useGenerationData(selectedGeneration);

  const isLoading = isLoadingSimulationData || isLoadingGenerationData;
  const refetch = useCallback(() => {
    refetchSimulationData();
    refetchGenerationData();
  }, [refetchSimulationData, refetchSimulationData]);

  const config = data?.data?.config;
  const neurons = data?.data?.neurons;

  const generations = data?.data?.generations || [];
  const generation = generationData?.data;

  const steps = generation?.stepHistory || [];
  const step = steps[parseInt(selectedStep)];

  // debug
  window.debugData = {
    data: data?.data,
    generationData: generationData?.data,
    generations,
    generation,
    steps,
    step,
  };

  return (
    <Container fluid>
      <Row>
        <Col style={{ flexGrow: 0, minWidth: 100 }}>
          <Row>
            <Form.Group>
              <FormControl type="number" min="0" value={numberOfGenerationsToSimulate}
                           onChange={setNumberOfGenerationsToSimulate}/>
            </Form.Group>
          </Row>
          <Row>
            <Button variant="outline-primary"
                    onClick={multipleGeneration}>{`Simulate ${numberOfGenerationsToSimulate}`}</Button>
          </Row>
          <Row>
            <Button variant="outline-primary" onClick={refetch}>Refetch</Button>
          </Row>
          <Row>
            <Button
              variant="outline-primary"
              disabled={!steps?.length}
              onClick={() => steps?.length ? setIsAnimating(!isAnimating) : null}
            >
              {swich([
                [() => isAnimating, 'Stop animation'],
                [() => steps?.length, 'Animate generation'],
                ['No sim data'],
              ])()}
            </Button>
          </Row>
          <Row>
            <Form.Group>
              <Form.Label>Generation</Form.Label>
              <FormControl type="number" min="0" max={100000} value={selectedGeneration}
                           onChange={setSelectedGeneration}/>
            </Form.Group>
            <Form.Group>
              <Form.Label>Step</Form.Label>
              <FormControl type="number" min="0" max={steps.length} value={selectedStep} onChange={setSelectedStep}/>
            </Form.Group>
          </Row>
        </Col>
        <Col>
          <Row>
            <Col style={{ flexGrow: 0 }}>
              <Row>
                <pre>
                  {JSON.stringify({
                    creaturesNumber: generation?.creaturesNumber,
                    timeStart: generation?.timeStart,
                    timeEnd: generation?.timeEnd,
                    time: `${(generation?.timeEnd - generation?.timeStart).toFixed(2)}ms`,
                    totalEnergy: generation?.totalEnergy,
                    totalOffspring: generation?.totalOffspring,
                    numberOfCreaturesWithOffspring: generation?.numberOfCreaturesWithOffspring,
                    averageOffspring: `${(generation?.totalOffspring / generation?.numberOfCreaturesWithOffspring).toFixed(2)} baby per creature`,
                  }, null, 2)}
                </pre>
              </Row>
              <Row>
                <SimulationInfo history={generations}/>
              </Row>
            </Col>
            <Col>
              <World
                config={data?.data?.config}
                generation={generation}
                step={step}
                steps={steps}
                creatureSelectedIndex={selectedCreature}
                handleCreatureSelectIndex={setSelectedCreature}
                isAnimating={isAnimating}
                setIsAnimating={setIsAnimating}
              />
            </Col>
          </Row>

        </Col>
      </Row>
      <Row>{
        step
          ? (
            <NeuronVisualization
              genome={generation.state.genomes[selectedCreature] || []}
              config={config}
              neurons={neurons}
            />
          )
          : 'nope'
      }</Row>
      <Row>
        <Col>
          <Row>Config</Row>
          <Row>
            <pre>{JSON.stringify(config || {}, null, 2)}</pre>
          </Row>
        </Col>
        <Col>
          <Row>
            <Col>
              <Row>{`Creature ${selectedCreature}`}</Row>
              <Row>
                <pre>
                  {step ? JSON.stringify(step.creaturesData[selectedCreature], null, 2) : 'nope'}
                </pre>
              </Row>
              <Row>
                <pre>
                  {generation ? JSON.stringify(generation?.state?.genomes[selectedCreature], null, 2) : 'nope'}
                </pre>
              </Row>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  )
};

Home.propTypes = {
  children: PropTypes.node,
};

export default Home;
