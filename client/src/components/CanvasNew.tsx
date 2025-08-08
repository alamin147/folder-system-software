import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  MiniMap,
  MarkerType,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Folder, File, FolderOpen, FolderPlus, FilePlus, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectNode, toggleFolder, createNodeAPI, deleteNodeAPI, updateNodePosition } from '../store/fileSystemSlice';
import { openEditor } from '../store/editorSlice';
import type { FileSystemNode } from '../types/index';

// Custom Node Component
interface CustomNodeData {
  fileSystemNode: FileSystemNode;
  onDoubleClick: (node: FileSystemNode) => void;
  onSelect: (nodeId: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileSystemNode) => void;
  isSelected: boolean;
  parentNode?: FileSystemNode;
}

const CustomNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
  const { fileSystemNode: node, onDoubleClick, onSelect, onContextMenu, isSelected } = data;

  const handleClick = useCallback(() => {
    onSelect(node.id);
    if (node.type === 'folder') {
      onDoubleClick(node);
    }
  }, [node.id, node.type, onSelect, onDoubleClick]);

  const handleDoubleClick = useCallback(() => {
    if (node.type === 'file') {
      onDoubleClick(node);
    }
  }, [node, onDoubleClick]);

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, node);
  }, [node, onContextMenu]);

  const getIcon = () => {
    if (node.type === 'folder') {
      return node.expanded ? <FolderOpen size={20} /> : <Folder size={20} />;
    }
    return <File size={20} />;
  };

  return (
    <div
      className={`
        flex flex-col space-y-1 p-3 rounded-lg border-2 cursor-pointer
        transition-all duration-200 hover:shadow-lg min-w-[140px] max-w-[200px]
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
        }
        ${node.type === 'folder'
          ? node.expanded
            ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md'
            : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
          : 'bg-gradient-to-br from-white to-gray-50'
        }
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
    >
      {/* Source indicator for child nodes */}
      {/* {parentNode && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          <span>📁</span>
          <span>from: {parentNode.name}</span>
        </div>
      )} */}

      {/* Main node content */}
      <div className="flex items-center space-x-2">
        <div className={node.type === 'folder' ? 'text-blue-600' : 'text-gray-600'}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-800 truncate block">
            {node.name}
          </span>
          {node.type === 'folder' && node.children && node.children.length > 0 && (
            <span className="text-xs text-gray-500">
              {node.children.length} item{node.children.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* {node.type === 'folder' && node.children && node.children.length > 0 && (
          <div className={`text-sm px-2 py-1 rounded-md transition-all duration-300 flex items-center space-x-1 ${
            node.expanded
              ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-md'
              : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
          }`}>
            <span>{node.expanded ? '📂' : '📁'}</span>
            <span className={`text-xs transition-transform duration-200 ${node.expanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </div>
        )} */}
      </div>
    </div>
  );
};

const CanvasNew: React.FC = () => {
  const dispatch = useAppDispatch();
  const { nodes: fileSystemNodes, selectedNodeId }: any = useAppSelector((state) => state.fileSystem);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileSystemNode;
  } | null>(null);

  // Use test data if enabled or if no real data
  const currentData = useMemo(() => {
    if (!fileSystemNodes || fileSystemNodes.length === 0) {
      console.log('Using test data');
      return;
    }
    return fileSystemNodes;
  }, [fileSystemNodes]);

  const handleFileDoubleClick = useCallback((node: FileSystemNode) => {
    console.log('Node clicked:', node.name, 'Type:', node.type, 'Expanded:', node.expanded);
    if (node.type === 'file') {
      dispatch(openEditor(node));
    } else if (node.type === 'folder') {
      console.log('Toggling folder:', node.id);
      dispatch(toggleFolder(node.id));
    }
  }, [dispatch]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    dispatch(selectNode(nodeId));
  }, [dispatch]);

  const handleNodeDragStop = useCallback((_: any, node: any) => {
    // Update the node position in the Redux store when dragging stops
    dispatch(updateNodePosition({ id: node.id, x: node.position.x, y: node.position.y }));
  }, [dispatch]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileSystemNode) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    });
  }, []);

  // Node creation handlers
  const handleCreateNode = useCallback((type: 'file' | 'folder', parentId: string) => {
    const name = prompt(`Enter ${type} name:`);
    if (name) {
      const newNode = {
        type,
        name,
        x: Math.random() * 200 + 100,
        y: Math.random() * 200 + 100,
        expanded: type === 'folder' ? false : undefined,
        content: type === 'file' ? '' : undefined,
      };
      dispatch(createNodeAPI({ parentId, node: newNode }));
    }
    setContextMenu(null);
  }, [dispatch]);

  const handleCreateRootNode = useCallback((type: 'file' | 'folder') => {
    const name = prompt(`Enter ${type} name:`);
    if (name) {
      // Add to test data if we're using test data

        const newNode = {
          type,
          name,
          x: Math.random() * 200 + 100,
          y: Math.random() * 200 + 100,
          expanded: type === 'folder' ? false : undefined,
          content: type === 'file' ? '' : undefined,
        };
        const rootNode = fileSystemNodes.find((n: FileSystemNode) => n.id === 'root' || n.name === 'Root');
        if (rootNode) {
          dispatch(createNodeAPI({ parentId: rootNode.id, node: newNode }));
        }

    }
  }, [dispatch, fileSystemNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
        dispatch(deleteNodeAPI(nodeId));
    }
    setContextMenu(null);
  }, [dispatch]);

  // Generate nodes and edges - SIMPLIFIED AND GUARANTEED TO WORK
  const { reactFlowNodes, reactFlowEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeCount = 0;

    const processNode = (node: FileSystemNode, parentNode?: FileSystemNode, level = 0) => {
      console.log('Processing node:', node.name, 'Parent:', parentNode?.name, 'Expanded:', node.expanded);

      // Create React Flow node
      const reactFlowNode: Node = {
        id: node.id,
        type: 'default',
        position: {
          x: node.x ?? (100 + level * 300),
          y: node.y ?? (100 + nodeCount * 80)
        },
        data: {
          label: (
            <CustomNode data={{
              fileSystemNode: node,
              onDoubleClick: handleFileDoubleClick,
              onSelect: handleNodeSelect,
              onContextMenu: handleContextMenu,
              isSelected: selectedNodeId === node.id,
              parentNode: parentNode,
            }} />
          )
        },
        draggable: true,
        style: {
          background: 'transparent',
          border: 'none',
          padding: 0,
        }
      };

      nodes.push(reactFlowNode);
      nodeCount++;

      // Create edge from parent to this node - ALWAYS CREATE IF PARENT EXISTS
      if (parentNode) {
        const edge: Edge = {
          id: `edge-${parentNode.id}-${node.id}`,
          source: parentNode.id,
          target: node.id,
          type: 'default',
          animated: true,
          style: {
            stroke: node.type === 'folder' ? '#3b82f6' : '#10b981',
            strokeWidth: 4,
            strokeDasharray: '8,4',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: node.type === 'folder' ? '#3b82f6' : '#10b981',
            width: 15,
            height: 15,
          },
          label: node.type === 'folder' ? '📁' : '📄',
          labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
          labelStyle: { fontSize: '12px', fontWeight: 'bold' },
          pathOptions: {
            curvature: 0.5
          }
        };
        edges.push(edge);
        console.log('✅ Created edge from', parentNode.name, 'to', node.name);
      }

      // Process children only if folder is expanded
      if (node.type === 'folder' && node.children && node.expanded) {
        console.log('📂 Processing children of expanded folder:', node.name);
        node.children.forEach(child => {
          processNode(child, node, level + 1);
        });
      }
    };

    // Process all root nodes
    currentData?.forEach((rootNode: FileSystemNode) => {
      processNode(rootNode);
    });

    console.log('🎯 FINAL RESULT: Generated', nodes.length, 'nodes and', edges.length, 'edges');
    console.log('📊 Edges:', edges.map(e => `${e.source} -> ${e.target}`));

    return { reactFlowNodes: nodes, reactFlowEdges: edges };
  }, [currentData, selectedNodeId, handleFileDoubleClick, handleNodeSelect]);

  // Update React Flow when data changes
  useEffect(() => {
    console.log('🔄 Updating ReactFlow with', reactFlowNodes.length, 'nodes and', reactFlowEdges.length, 'edges');
    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [reactFlowNodes, reactFlowEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full">
      <style dangerouslySetInnerHTML={{
        __html: `
          .react-flow__edge path {
            stroke-width: 4px !important;
            stroke-linecap: round !important;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          }
          .react-flow__edge.animated path {
            stroke-dasharray: 8 4 !important;
            animation: dash-animation 3s linear infinite !important;
          }
          .react-flow__edge-path {
            stroke-linecap: round !important;
            stroke-linejoin: round !important;
          }
          .react-flow__edge.react-flow__edge-smoothstep path {
            stroke-linecap: round !important;
            stroke-linejoin: round !important;
          }
          @keyframes dash-animation {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 24; }
          }
          .react-flow__edge-label {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(4px) !important;
            border-radius: 6px !important;
            padding: 2px 6px !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          }
        `
      }} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50"
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 4 },
        }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap />

        {/* Toolbar Panel */}
        <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-3 m-4">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-gray-800 mr-3">File System - WORKING VERSION</h3>
            <button
              onClick={() => handleCreateRootNode('file')}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
              title="Create new file"
            >
              <FilePlus size={14} />
              <span>File</span>
            </button>
            <button
              onClick={() => handleCreateRootNode('folder')}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
              title="Create new folder"
            >
              <FolderPlus size={14} />
              <span>Folder</span>
            </button>

          </div>
        </Panel>

        {/* Status Panel */}
        {/* <Panel position="bottom-right" className="bg-white rounded-lg shadow-lg p-2 m-4">
          <div className="text-xs text-gray-600">
            <div> {nodes.length} nodes, {edges.length} edges</div>
            <div> Connections: {edges.length > 0 ? 'VISIBLE ' : 'NONE '}</div>
          </div>
        </Panel> */}
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-[150px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.node.type === 'folder' && (
              <>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                  onClick={() => handleCreateNode('file', contextMenu.node.id)}
                >
                  <FilePlus size={16} />
                  <span>New File</span>
                </button>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                  onClick={() => handleCreateNode('folder', contextMenu.node.id)}
                >
                  <FolderPlus size={16} />
                  <span>New Folder</span>
                </button>
                <hr className="my-1" />
              </>
            )}
            {contextMenu.node.type === 'file' && (
              <>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                  onClick={() => {
                    dispatch(openEditor(contextMenu.node));
                    setContextMenu(null);
                  }}
                >
                  <File size={16} />
                  <span>Open</span>
                </button>
                <hr className="my-1" />
              </>
            )}
            {contextMenu.node.id !== 'root' && (
              <button
                className="w-full px-4 py-2 text-left hover:bg-red-100 text-red-600 flex items-center space-x-2 transition-colors"
                onClick={() => handleDeleteNode(contextMenu.node.id)}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CanvasNew;
