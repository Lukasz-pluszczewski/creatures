import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { Button } from 'react-bootstrap';
import { useAnimation } from './useAnimation.hook';

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

const getCreaturesData = (step) => {
  return step.creaturesData.map((creature, index) => ({
    x: creature.x,
    y: creature.y,
    creatureIndex: index,
    color: creature.color || undefined,
  }));
};

const getFoodData = (step) => {
  return step.foodData.map(({ x, y, energy }, index) => (
    energy
      ? {
          x: x,
          y: y,
          foodIndex: index,
          color: '#00ff00',
        }
      : null
  )).filter(food => food);
};

export const World = ({
  config,
  generation,
  step,
  steps,
  handleCreatureSelectIndex,
  isAnimating,
  setIsAnimating,
}) => {
  const [animatingStep, setAnimatingStep] = useState(null);
  useAnimation(e => {
    if ((isAnimating || isAnimating === 0)) {
      if (animatingStep >= steps.length) {
        setAnimatingStep(null);
        setIsAnimating(false);
      } else {
        setAnimatingStep((animatingStep || 0) + 1);
      }
    }
  }, 30);

  if (!config || !generation || !step) return null;

  const shownStep = isAnimating && steps[animatingStep] ? steps[animatingStep] : step;

  const { worldSizeY, worldSizeX } = config;
  const data = getCreaturesData(shownStep);
  const foodData = getFoodData(shownStep);

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
          <Scatter name="Creatures" data={data} fill="#8884d8" isAnimationActive={false} >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              // <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Scatter>
          <Scatter name="Food" data={foodData} fill="#8884d8" shape="cross" isAnimationActive={false} >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#0000FF" />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      {/*<Button disabled={!lastGenerationSteps?.length} onClick={() => setAnimatingStep(1)}>*/}
      {/*  Play last generation*/}
      {/*</Button>*/}
    </div>
  )
};
