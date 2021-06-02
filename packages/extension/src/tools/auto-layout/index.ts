/**
 * 自动布局插件
 * 依赖flowpath插件
 * 未完善
 */

import LogicFlow from '@logicflow/core';

const POSITION_TYPE = {
  LEFT_TOP: -1,
  LEFT: 0,
  LEFT_BOTTOM: 1,
};

class AutoLayout {
  lf: LogicFlow;
  levelHeight: any[];
  newNodeMap: Map<string, any>;
  constructor({ lf }) {
    this.lf = lf;
    // 给lf添加方法
    lf.layout = (startNodeType) => {
      const data = this.lf.getGraphRawData();
      this.lf.setStartNodeType(startNodeType);
      const path = this.lf.getPathes();
      this.levelHeight = [];
      this.newNodeMap = new Map();
      return this.layout(data, path);
    };
  }
  // 1) 将所有节点和连线的坐标删除。节点上的文本改成偏移量。
  // 2) 找到长度最长的路径，作为基准路径。
  // 3) 依次计算
  // 拿到最长的路径。
  // nodes: [], edges: [],
  layout(data, path) {
    let trunk = [];
    path.forEach(p => {
      if (p.elements.length > trunk.length) {
        trunk = p.elements;
      }
    });
    const nodeMap = this.formatData(data);
    const newGraphData = {
      nodes: [],
      edges: [],
    };
    // 从后向前布局
    for (let i = trunk.length - 1; i >= 0; i--) {
      this.setNodePosition(trunk[i], nodeMap, newGraphData, i, 1);
    }
    this.lf.graphModel.graphDataToModel(newGraphData);
  }
  // 1) 需要知道下一层级已占高度。
  // 2) 基于自己的高度，判断下一个层级的高度
  private setNodePosition(nodeId, nodeMap, newGraphData, xLevel, yLevel) {
    const n = nodeMap[nodeId];
    const { text, type, next, properties } = n;
    const x = xLevel * 160 + 40;
    const y = yLevel * 120;
    const nodeData = {
      id: nodeId,
      x,
      text,
      y,
      type,
      properties,
    };
    if (text && typeof text === 'object') {
      nodeData.text = {
        ...text,
        x: x + text.x,
        y: y + text.y,
      };
    }
    this.newNodeMap.set(nodeData.id, {
      x: nodeData.x,
      y: nodeData.y,
      type,
    });
    newGraphData.nodes.push(nodeData);
    n.isFixed = true;
    this.addLevelHeight(xLevel, 1);
    if (next && next.length > 0) {
      next.forEach((nextInfo) => {
        // 如果下一个节点还没有被定位，那么设置其定位
        const n1 = nodeMap[nextInfo.nodeId];
        if (!n1.isFixed) {
          const nextYLevel = this.getLevelHeight(xLevel + 1);
          this.addLevelHeight(xLevel, 1);
          this.setNodePosition(nextInfo.nodeId, nodeMap, newGraphData, xLevel + 1, nextYLevel + 1);
        } else {
          // todo: 如果下一个节点是已经定位的，则需要考虑连线的规避
        }
        // 设置连接到下一个节点的连线
        // 1) 起始位置为source节点的下方，结束位置为target节点左边。
        // 2) 计算折线
        newGraphData.edges.push({
          id: nextInfo.edgeId,
          type: nextInfo.edgeType,
          sourceNodeId: nodeId,
          targetNodeId: nextInfo.nodeId,
          properties: nextInfo.properties,
          text: nextInfo.text,
          ...this.getEdgeDataPoints(nodeId, nextInfo.nodeId),
        });
      });
    }
    return nodeData;
  }
  /**
   * 1. 处理连线上的文本
   * 2. 主干节点之间直接的连线
   * 3. 一个节点被多个连接作为目标节点，合理分配锚点位置。
   */
  private getEdgeDataPoints(sourceNodeId, targetNodeId) {
    const source = this.newNodeMap.get(sourceNodeId);
    const target = this.newNodeMap.get(targetNodeId);
    const { width, height } = this.getShape(sourceNodeId);
    const { width: targetWidth, height: targetHeight } = this.getShape(targetNodeId);
    const postionType = this.getRelativePosition(source, target);
    const startPoint = {
      x: source.x,
      y: source.y,
    };
    const endPoint = {
      x: target.x,
      y: target.y,
    };
    switch (postionType) {
      case POSITION_TYPE.LEFT:
        startPoint.x = source.x + width / 2;
        endPoint.x = target.x - targetWidth / 2;
        break;
      case POSITION_TYPE.LEFT_TOP:
        startPoint.y = source.y + height / 2;
        endPoint.x = target.x - targetWidth / 2;
        break;
      case POSITION_TYPE.LEFT_BOTTOM:
        startPoint.x = source.x + width / 2;
        endPoint.y = target.y + targetHeight / 2;
        break;
      default:
        break;
    }
    return {
      startPoint,
      endPoint,
    };
  }
  /**
   * 获取连线的连接节点相对位置。
   * source一定在target左边。
   * 1. 如果source和target在同一x, y坐标内容。
   * 2. 如果source在target左上方。
   * 3. 如果souce在target左下方。
   */
  private getRelativePosition(source, target) {
    const { y } = source;
    const { y: y1 } = target;
    let postionType;
    if (y < y1) {
      postionType = -1;
    } else if (y === y1) {
      postionType = 0;
    } else {
      postionType = 1;
    }
    return postionType;
  }
  /**
   * 获取连线节点图形的宽高。
   */
  private getShape(nodeId) {
    const nodeModel = this.lf.getNodeModel(nodeId);
    return {
      height: nodeModel.height,
      width: nodeModel.width,
    };
  }
  private formatData(data) {
    const nodeMap = data.nodes.reduce((nMap, node) => {
      const { type, properties, text, x, y } = node;
      if (text && typeof text === 'object') { // 坐标转换为偏移量
        text.x = text.x - x;
        text.y = text.y - y;
      }
      nMap[node.id] = {
        type,
        properties,
        text,
        prev: [],
        next: [],
      };
      return nMap;
    }, {});

    data.edges.forEach((edge) => {
      const { sourceNodeId, targetNodeId, id, properties, text } = edge;
      let newText = text;
      if (typeof text === 'object') {
        newText = text.value;
      }
      nodeMap[sourceNodeId].next.push({
        edgeId: id,
        nodeId: targetNodeId,
        edgeType: edge.type,
        properties,
        text: newText,
      });
      nodeMap[targetNodeId].prev.push({
        edgeId: id,
        nodeId: sourceNodeId,
        properties,
        text: newText,
      });
    });
    return nodeMap;
  }
  addLevelHeight(level, height = 1, isNegative = false) {
    let l = this.levelHeight[level];
    if (!l) {
      l = {
        positiveHeight: 0,
        negativeHeight: 0,
      };
      this.levelHeight[level] = l;
    }
    isNegative ? (l.negativeHeight -= height) : (l.positiveHeight += height);
  }
  getLevelHeight(level, isNegative = false) {
    const val = this.levelHeight[level];
    if (!val) {
      return 0;
    }
    return isNegative ? val.negativeHeight : val.positiveHeight;
  }
}

export {
  AutoLayout,
};
