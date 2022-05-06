import React from 'react';
import _ from 'lodash';
import { Col, Row } from 'react-bootstrap';

import './Formatter.scss';

export const Indent = ({ level = 1, children }: { level?: number, children: any }) => (
  <div className="indent" style={{ marginLeft: level * 20 }}>{children}</div>
);

export const ArrayFormatter = ({ data }: { data?: Record<string, any> }) => {
  if (!data) {
    return null;
  }
  return (
    <div className="Formatter ArrayFormatter">
      {data.map((value: any, index: number) => (
        <Row key={index} className="Formatter__item">
          <Col className="Formatter__value"><Indent><Formatter data={value} /></Indent></Col>
        </Row>
      ))}
    </div>
  );
};

export const ObjectFormatter = ({ data }: { data?: Record<string, any> }) => {
  if (!data) {
    return null;
  }
  return (
    <div className="Formatter ObjectFormatter">
      {Object.entries(data).map(([key, value]) => (
        <Row key={key} className="Formatter__item">
          <Col className="Formatter__key">{key}</Col>
          <Col className="Formatter__value"><Formatter data={value} /></Col>
        </Row>
      ))}
    </div>
  );
};

export const Formatter = ({ data }: { data?: Record<string, any> | any[] | any }) => {
  if (!data) {
    return null;
  }
  if (_.isArray(data)) {
    return <ArrayFormatter data={data} />;
  }
  if (_.isObject(data)) {
    return <ObjectFormatter data={data} />;
  }
  return data;
};
