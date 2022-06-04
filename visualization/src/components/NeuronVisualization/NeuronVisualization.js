import React, { useEffect } from 'react';
import * as vis from 'vis-network/standalone/esm';

export const NeuronVisualization = ({ genome, neurons, config }) => {
  // console.log('genome', genome);
  // console.log('neurons', neurons);
  // console.log('config', config);
  useEffect(() => {
    const container = document.getElementById("neuron-visualization");
    const { weightMultiplier } = config;
    const { inputNeurons, internalNeurons, outputNeurons } = neurons;

    const nodes = new vis.DataSet([
      ...(inputNeurons.map(neuron => ({
        id: neuron.id,
        label: neuron.label,
        color: '#9ad942',
      }))),
      ...(internalNeurons.map(neuron => ({
        id: neuron.id,
        label: neuron.label,
        color: '#6b6b6b',
      }))),
      ...(outputNeurons.map(neuron => ({
        id: neuron.id,
        label: neuron.label,
        color: '#2b94e9',
      })))
    ]);

    const edges = new vis.DataSet(genome.map(gene => {
      const { sourceId, targetId, weight: rawWeight } = gene;
      const weight = rawWeight * weightMultiplier;
      return {
        from: sourceId,
        to: targetId,
        width: Math.abs(weight),
        label: `${weight.toFixed(2)}`,
        color: weight > 0 ? '#00FF00' : '#FF0000',
      };
    }));

    // create a network
    const networkData = {
      nodes: nodes,
      edges: edges,
    };
    const options = {
      edges: {
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 1,
            type: "arrow"
          },
        }
      },
      layout: {
        randomSeed: undefined,
        improvedLayout: true,
        clusterThreshold: 150,
        hierarchical: {
          enabled: true,
          levelSeparation: 150,
          nodeSpacing: 100,
          treeSpacing: 200,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
          direction: 'UD',        // UD, DU, LR, RL
          sortMethod: 'directed',  // hubsize, directed
          shakeTowards: 'roots'  // roots, leaves
        }
      },
      physics:{
        enabled: false,
      }
    };
    const network = new vis.Network(container, networkData, options);

    return () => network.destroy();
  }, [genome, neurons, config]);

  return (
    <div>
      <div id="neuron-visualization" style={{ height: '300px' }}/>
    </div>
  );
};
