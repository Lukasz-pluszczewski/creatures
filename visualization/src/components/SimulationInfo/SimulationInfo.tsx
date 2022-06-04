import React from 'react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

export const SimulationInfo = ({ history }) => {
  const data = history.map((item, index) => {
    return {
      value: item.totalOffspring,
      index,
    };
  })
  return (
    <div>
      <h4>Simulation Info</h4>
      <div>
        <LineChart width={500} height={200} data={data}
                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
        </LineChart>
      </div>
    </div>
  );
};
