import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';

type Props = {
  tabs: {
    id: string;
    label: string;
    render: () => JSX.Element;
  }[];
};
export const Tabs = ({ tabs }: Props) => {
  const [activeKey, setActiveKey] = useState(tabs[0].id);
  return (
    <div>
      <Nav variant="tabs" activeKey={activeKey} onSelect={setActiveKey}>
        {tabs.map(({ id, label }) => (
          <Nav.Item key={id}>
            <Nav.Link eventKey={id}>{label}</Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      <div>{tabs.find(({ id }) => id === activeKey)?.render()}</div>
    </div>
  );
};
