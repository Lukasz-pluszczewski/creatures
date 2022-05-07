import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { FormControl, Button, Container, Col, Row } from 'react-bootstrap';

import './Home.scss';

import { World } from '../World/World';
import { NeuronVisualization } from '../NeuronVisualization/NeuronVisualization';
import { CreatureInfo } from '../CreatureInfo/CreatureInfo';
import { Tabs } from '../Tabs/Tabs';
import { SimulationInfo } from '../SimulationInfo/SimulationInfo';

const useLoadData = () => {
  return useQuery('data', () => {
    return axios.get('http://localhost:8080');
  });
};
const useStep = () => {
  const queryClient = useQueryClient();
  return useMutation(async () => {
    await axios.post('http://localhost:8080/step');
    queryClient.invalidateQueries('data');
  })
};
const useReset = () => {
  const queryClient = useQueryClient();
  return useMutation(async () => {
    await axios.delete('http://localhost:8080');
    queryClient.invalidateQueries('data');
  })
};
const useGeneration = () => {
  const queryClient = useQueryClient();
  return useMutation(async () => {
    await axios.post('http://localhost:8080/generation');
    queryClient.invalidateQueries('data');
  })
};
const useMultipleGeneration = (numberOfGenerations) => {
  const queryClient = useQueryClient();
  return useMutation(async () => {
    await axios.post(`http://localhost:8080/generation/${numberOfGenerations}`);
    queryClient.invalidateQueries('data');
  })
};

const useInput = (initial) => {
  const [state, setState] = useState(initial);
  const handleChange = event => setState(event.target.value);
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

  const { data, isLoading, refetch } = useLoadData();

  const { mutate } = useStep();
  const { mutate: reset } = useReset();
  const { mutate: generation } = useGeneration();
  const { mutate: multipleGeneration } = useMultipleGeneration(numberOfGenerationsToSimulate);

  const [creatureIndex, setCreatureIndex] = useState(0);
  const [creatureAncestorIndex, setCreatureAncestor] = useState(null);

  const handleCreatureIndexChange = creatureIndex => {
    setCreatureAncestor(null);
    setCreatureIndex(creatureIndex);
  };

  const creatureToVisualize = getCreatureToVisualize(data, creatureIndex, creatureAncestorIndex);

  return (
    <Container fluid>
      <Row style={{ display: 'flex', gap: '10px' }}>
        <Button variant="outline-primary" onClick={refetch}>Refetch</Button>
        <Button variant="success" onClick={mutate}>Step</Button>
        <Button variant="success" onClick={generation}>Generation</Button>
        <Button variant="success" onClick={multipleGeneration}>{`${numberOfGenerationsToSimulate} generations`}</Button>
        <Button variant="outline-danger" onClick={reset}>Reset</Button>
        <FormControl
          style={{ display: 'inline-block', width: 'auto' }}
          type="number"
          value={numberOfGenerationsToSimulate}
          onChange={setNumberOfGenerationsToSimulate}
        />
      </Row>
      <hr />
      <Row>
        <Col>
          <World
            config={data?.data?.config}
            creatures={data?.data?.creatures}
            food={data?.data?.food}
            creatureSelectedIndex={creatureIndex}
            handleCreatureSelectIndex={handleCreatureIndexChange}
            lastGenerationCreatures={data?.data?.lastGenerationCreatures}
            lastGenerationSteps={data?.data?.lastGenerationSteps}
          />
        </Col>
        <Col>
          <Tabs tabs={[
            {
              label: 'Creature',
              id: 'creature',
              render: () => (
                <CreatureInfo creature={data?.data?.creatures[creatureIndex]} setCreatureAncestor={setCreatureAncestor}/>
              ),
            },
            {
              label: 'Simulation info',
              id: 'simulation',
              render: () => (
                <SimulationInfo history={data?.data?.history} />
              ),
            },
          ]}/>

        </Col>
      </Row>
      <div>
        {!isLoading && creatureToVisualize && <NeuronVisualization
          creature={creatureToVisualize}
          config={data?.data?.config}
          isLoading={isLoading}
          neurons={data?.data?.neurons}
        />}
      </div>
    </Container>
  )
};

Home.propTypes = {
  children: PropTypes.node,
};

export default Home;
