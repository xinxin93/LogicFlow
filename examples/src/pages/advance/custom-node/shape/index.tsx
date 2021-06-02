import React, { useEffect } from 'react';
import LogicFlow from '@logicflow/core';
import ExampleHeader from '../../../../components/example-header';
import { Square } from '../square';

const config = {
  hideAnchors: true,
  stopScrollGraph: true,
  stopZoomGraph: true,
};

const data = {
  nodes: [
    {
      id: 10,
      type: 'square',
      x: 150,
      y: 90,
      text: '正方形',
      properties: {
        isUser: true
      }
    },
  ]
};

export default function CustomNodeShapeExample() {

  useEffect(() => {
    const lf = new LogicFlow({
      ...config,
      container: document.querySelector('#graph') as HTMLElement
    });
    lf.register(Square);
    lf.render(data);
  }, []);

  return (
    <>
      <ExampleHeader
        content="设置自定义节点的 SVG 元素"
        githubPath="/advance/custom-node/shape/index.tsx"
      />
      <div id="graph" className="viewport" />
    </>
  )
}
