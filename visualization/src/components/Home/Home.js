import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import _ from 'lodash';
import { FormControl, Form, Button, Container, Col, Row } from 'react-bootstrap';

import './Home.scss';

import { World } from '../World/World';
import { NeuronVisualization } from '../NeuronVisualization/NeuronVisualization';
import { CreatureInfo } from '../CreatureInfo/CreatureInfo';
import { Tabs } from '../Tabs/Tabs';
import { SimulationInfo } from '../SimulationInfo/SimulationInfo';
import { CustomDropdown } from './Dropdown';

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
  const { mutate: multipleGeneration } = useMultipleGeneration(numberOfGenerationsToSimulate);

  const [selectedGeneration, setSelectedGeneration] = useInput(0);
  const [selectedStep, setSelectedStep] = useInput(0);
  const [selectedCreature, setSelectedCreature] = useState(0);

  const [isAnimating, setIsAnimating] = useState(false);

  const { data, isLoading, refetch } = useLoadData();

  // console.log('data', data?.data);

  const config = data?.data?.config;
  const neurons = data?.data?.neurons;

  const generations = data?.data?.generations || [];
  const generation = generations[parseInt(selectedGeneration)];

  const steps = generation?.stepHistory || [];
  const step = steps[parseInt(selectedStep)];

  return (
    <Container fluid>
      <Row>
        <Col style={{ flexGrow: 0, minWidth: 100 }}>
          <Row>
            <Form.Group>
              <FormControl type="number" min="0" value={numberOfGenerationsToSimulate} onChange={setNumberOfGenerationsToSimulate} />
            </Form.Group>
          </Row>
          <Row>
            <Button variant="outline-primary" onClick={multipleGeneration}>{`Simulate ${numberOfGenerationsToSimulate}`}</Button>
          </Row>
          <Row>
            <Button variant="outline-primary" onClick={refetch}>Refetch</Button>
          </Row>
          <Row>
            <Button
              variant="outline-primary"
              onClick={() => setIsAnimating(!isAnimating)}
            >
              {isAnimating ? 'Stop animation' : 'Animate generation'}
            </Button>
          </Row>
          <Row>
            <Form.Group>
              <Form.Label>Generation</Form.Label>
              <FormControl type="number" min="0" max={generations.length} value={selectedGeneration} onChange={setSelectedGeneration} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Step</Form.Label>
              <FormControl type="number" min="0" max={steps.length} value={selectedStep} onChange={setSelectedStep} />
            </Form.Group>
          </Row>
        </Col>
        <Col>
          <Row>
            <Col style={{ flexGrow: 0 }}>
              <Row>
                <pre>
                  {JSON.stringify(_.pick(generation, ['creaturesNumber', 'timeStart', 'timeEnd', 'totalEnergy', 'totalOffspring']), null, 2)}
                </pre>
              </Row>
              <Row>
                <SimulationInfo history={generations} />
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
      <Row>{step ? JSON.stringify(step.creaturesData[selectedCreature], null, 2) : 'nope'}</Row>
      <Row>{
        step
          ? (
            <NeuronVisualization
              genome={generation.state.genomes[selectedCreature]}
              config={config}
              neurons={neurons}
            />
          )
          : 'nope'
      }</Row>
      <Row>
        Food {step?.foodData?.length}
        <pre>{JSON.stringify(step || {}, null, 2)}</pre>
      </Row>
    </Container>
  )

  // const { mutate } = useStep();
  // const { mutate: reset } = useReset();
  // const { mutate: generation } = useGeneration();
  // const { mutate: multipleGeneration } = useMultipleGeneration(numberOfGenerationsToSimulate);
  //
  // const [creatureIndex, setCreatureIndex] = useState(0);
  // const [creatureAncestorIndex, setCreatureAncestor] = useState(null);
  //
  // const handleCreatureIndexChange = creatureIndex => {
  //   setCreatureAncestor(null);
  //   setCreatureIndex(creatureIndex);
  // };
  //
  // const creatureToVisualize = getCreatureToVisualize(data, creatureIndex, creatureAncestorIndex);
  //
  // return (
  //   <Container fluid>
  //     <Row style={{ display: 'flex', gap: '10px' }}>
  //       <Button variant="outline-primary" onClick={refetch}>Refetch</Button>
  //       <Button variant="success" onClick={mutate}>Step</Button>
  //       <Button variant="success" onClick={generation}>Generation</Button>
  //       <Button variant="success" onClick={multipleGeneration}>{`${numberOfGenerationsToSimulate} generations`}</Button>
  //       <Button variant="outline-danger" onClick={reset}>Reset</Button>
  //       <FormControl
  //         style={{ display: 'inline-block', width: 'auto' }}
  //         type="number"
  //         value={numberOfGenerationsToSimulate}
  //         onChange={setNumberOfGenerationsToSimulate}
  //       />
  //     </Row>
  //     <hr />
  //     <Row>
  //       <Col>
  //         <World
  //           config={data?.data?.config}
  //           creatures={data?.data?.creatures}
  //           food={data?.data?.food}
  //           creatureSelectedIndex={creatureIndex}
  //           handleCreatureSelectIndex={handleCreatureIndexChange}
  //           lastGenerationCreatures={data?.data?.lastGenerationCreatures}
  //           lastGenerationSteps={data?.data?.lastGenerationSteps}
  //         />
  //       </Col>
  //       <Col>
  //         <Tabs tabs={[
  //           {
  //             label: 'Creature',
  //             id: 'creature',
  //             render: () => (
  //               <CreatureInfo creature={data?.data?.creatures[creatureIndex]} setCreatureAncestor={setCreatureAncestor}/>
  //             ),
  //           },
  //           {
  //             label: 'Simulation info',
  //             id: 'simulation',
  //             render: () => (
  //               <SimulationInfo history={data?.data?.history} />
  //             ),
  //           },
  //         ]}/>
  //
  //       </Col>
  //     </Row>
  //     <div>
  //       {!isLoading && creatureToVisualize && <NeuronVisualization
  //         creature={creatureToVisualize}
  //         config={data?.data?.config}
  //         isLoading={isLoading}
  //         neurons={data?.data?.neurons}
  //       />}
  //     </div>
  //   </Container>
  // )
};

Home.propTypes = {
  children: PropTypes.node,
};

export default Home;
