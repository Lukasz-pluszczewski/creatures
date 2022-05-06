import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

const colors = scaleOrdinal(schemeCategory10).range();


const getDistance = (x1, y1, x2, y2) => {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
}

const getClickedCreatureIndex = (chartX, chartY, data) => {
  let closest = [null, 9999999];
  data.forEach(({ x, y, creatureIndex }) => {
    const distance = getDistance(x, y, chartX, chartY);
    if (distance < closest[1]) {
      closest = [creatureIndex, distance];
    }
  });

  return closest[0];
};

export const World = ({ config, creatures, creatureSelectedIndex, handleCreatureSelectIndex }) => {
  if (!config || !creatures) return null;

  const { worldSizeY, worldSizeX } = config;
  const data = creatures.map((creature, index) => ({
    x: creature.x,
    y: creature.y,
    creatureIndex: index,
    color: creature.color,
  }));
  // console.log('data for chart', config, data);

  const handleMouseDown = nextState => {
    const { chartX, chartY, xValue, yValue } = nextState || {};
    const clickedCreatureIndex = getClickedCreatureIndex(xValue, yValue, data);
    if (clickedCreatureIndex || clickedCreatureIndex === 0) {
      handleCreatureSelectIndex(clickedCreatureIndex);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <ResponsiveContainer aspect={1} height="100%">
        <ScatterChart
          width={400}
          height={400}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
          onMouseDown={handleMouseDown}
        >
          {/*<CartesianGrid />*/}
          <XAxis type="number" dataKey="x" name="x" domain={[0, worldSizeX]} />
          <YAxis type="number" dataKey="y" name="y" domain={[0, worldSizeY]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="A school" data={data} fill="#8884d8" >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              // <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
};
