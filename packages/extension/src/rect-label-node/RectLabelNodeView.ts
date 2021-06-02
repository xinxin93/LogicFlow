import { RectNode, h } from '@logicflow/core';

export class RectLabelNodeView extends RectNode {
  getLabelShape() {
    const attributes = this.getAttributes();
    const properties = this.getProperties();
    const { x, y, width, height } = attributes;
    return h(
      'text',
      {
        x: x - width / 2 + 5,
        y: y - height / 2 + 16,
        fontSize: 12,
        fill: 'blue',
      },
      properties.moreText,
    );
  }
  getShape() {
    const attributes = this.getAttributes();
    const { x, y, width, height } = attributes;
    // todo: 将basic-shape对外暴露，在这里可以直接用。现在纯手写有点麻烦。
    return h('g', {}, [
      h('rect', {
        ...attributes,
        fill: '#FFFFFF',
        x: x - width / 2,
        y: y - height / 2,
      }),
      this.getLabelShape(),
    ]);
  }
}
