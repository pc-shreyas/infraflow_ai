// client/src/components/WorkflowCanvas/Canvas.jsx
import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  GitHubNode,
  DockerNode,
  AWSNode,
  PostgresNode,
  NginxNode,
} from './CustomNodes';

const nodeTypes = {
  githubRepo: GitHubNode,
  dockerBuild: DockerNode,
  awsEC2: AWSNode,
  postgresDB: PostgresNode,
  nginxProxy: NginxNode,
};

const Canvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDrop,
  onNodeClick,
}) => {
  const reactFlowWrapper = useRef(null);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      // Calculate position relative to container
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      onDrop(type, position);
    },
    [onDrop]
  );

  return (
    <div
      ref={reactFlowWrapper}
      style={{ flex: 1, height: '100%', position: 'relative', background: 'var(--bg-void)' }}
      onDragOver={onDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        style={{ width: '100%', height: '100%' }}
      >
        <Background color="#30363d" gap={16} size={1} />
        <Controls
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 6,
            buttonColor: 'var(--text-primary)',
          }}
        />
        <MiniMap
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 6,
          }}
          nodeColor={(n) => {
            switch (n.type) {
              case 'githubRepo': return '#2ea44f';
              case 'dockerBuild': return '#099cec';
              case 'awsEC2': return '#ff9900';
              case 'postgresDB': return '#336791';
              case 'nginxProxy': return '#009639';
              default: return '#ffffff';
            }
          }}
          maskColor="rgba(6, 10, 15, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
