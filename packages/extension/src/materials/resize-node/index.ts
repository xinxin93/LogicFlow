import { ResizeCircleNode, ResizeCircleNodeModel } from './circle';

const ResizeNode = {
  name: 'resize-node',
  install(lf) {
    lf.register({
      type: 'circle',
      view: ResizeCircleNode,
      model: ResizeCircleNodeModel,
    });
  },
};

export default ResizeNode;

export {
  ResizeNode,
};
