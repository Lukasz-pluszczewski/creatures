import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Indent } from '../ObjectFormatter/ObjectFormatter';
import { SOURCE_MAPPING, TARGET_MAPPING } from '../../constants/constants';


const Gene = ({ gene: [sourceType, sourceId, targetType, targetId, weight] }) => {
  return <div>{`${SOURCE_MAPPING[sourceType]}[${sourceId}] -> ${TARGET_MAPPING[targetType]}[${targetId}] (${weight})`}</div>
};

const Ancestor = ({ creature, index, onClick }) => {
  if (!creature) {
    return null;
  }

  const { genome, id, x, y } = creature;

  return (
    <div style={{ fontSize: '0.6em', cursor: 'pointer' }} onClick={() => onClick(index)}>
      <div>{`${id}, {${x}, ${y}}`}</div>
      {genome.map((gene, index) => <Indent key={index}><Gene key={index} gene={gene}/></Indent>)}
    </div>
  );
};

export const CreatureInfo = ({ creature, setCreatureAncestor }) => {
  if (!creature) {
    return null;
  }

  const { genome, ancestors, id, x, y, creatureState, neuronsState } = creature;

  return (
    <Container>
      <h4>Creature info:</h4>
      <Row>
        <Col>
          <b>{`${id} {${x}, ${y}} (${creatureState?.energy})`}</b>
          <div style={{ marginTop: '1em' }}>Genes:</div>
          {genome.map((gene, index) => <Gene key={index} gene={gene}/>)}
        </Col>
        {ancestors && <Col style={{ maxHeight: '548px', overflowY: 'auto' }}>
          <b>Ancestors:</b>
          <div>
            {ancestors
              ? ancestors.map((ancestor, index) => (
                <Ancestor key={index} index={index} creature={ancestor} onClick={setCreatureAncestor} />
              ))
              : null}
          </div>
        </Col>}
      </Row>
    </Container>
  );
};
