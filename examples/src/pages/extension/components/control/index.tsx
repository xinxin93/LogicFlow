import React, { useEffect } from 'react';
import LogicFlow from '@logicflow/core';
import { Control } from '@logicflow/extension';
import '@logicflow/extension/lib/style/index.css';
import ExampleHeader from '../../../../components/example-header';

const config = {
  stopScrollGraph: true,
  stopZoomGraph: true,
}

export default function ControlExample() {
  useEffect(() => {
    LogicFlow.use(Control);
    const lf = new LogicFlow({
      ...config,
      grid: {
        size: 10,
        type: 'dot'
      },
      container: document.querySelector('#graph') as HTMLElement
    });
    lf.render();
  }, []);

  return (
    <>
      <ExampleHeader githubPath="/extension/components/control/index.tsx" />
      <div id="graph" className="viewport" />
    </>
  )
}
