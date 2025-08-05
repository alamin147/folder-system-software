import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  MiniMap,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { Folder, File, FolderOpen, FolderPlus, FilePlus, Trash2, Save, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectNode, toggleFolder, createNodeAPI, deleteNodeAPI, updateNodePositionAPI, saveFileSystemTree } from '../store/fileSystemSlice';
import { openEditor } from '../store/editorSlice';
import type { FileSystemNode } from '../types/index';

// Custom Node Component
interface CustomNodeData {
  fileSystemNode: FileSystemNode;
  onDoubleClick: (node: FileSystemNode) => void;
  onSelect: (nodeId: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileSystemNode) => void;
  isSelected: boolean;
}

const CustomNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
  const { fileSystemNode: node, onDoubleClick, onSelect, onContextMenu, isSelected } = data;

  const handleClick = useCallback(() => {
    onSelect(node.id);
  }, [node.id, onSelect]);

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

  const getFileTypeColor = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'text-yellow-600';
      case 'ts':
      case 'tsx':
        return 'text-blue-600';
      case 'md':
        return 'text-green-600';
      case 'json':
        return 'text-orange-600';
      case 'css':
        return 'text-purple-600';
      case 'html':
        return 'text-red-600';
      case 'py':
        return 'text-green-700';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div
      className={`
        flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer
        transition-all duration-200 hover:shadow-lg min-w-[140px] max-w-[200px]
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
        }
        ${node.type === 'folder' ? 'bg-gradient-to-br from-blue-50 to-blue-100' : 'bg-gradient-to-br from-white to-gray-50'}
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
    >
      <div className={node.type === 'folder' ? 'text-blue-600' : getFileTypeColor(node.name)}>
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
      {node.type === 'file' && (
        <div className="text-xs text-gray-500 ml-auto">
          {node.name.split('.').pop()?.toUpperCase()}
        </div>
      )}
      {node.type === 'folder' && node.children && node.children.length > 0 && (
        <div className={`text-xs px-1.5 py-0.5 rounded-full ${
          node.expanded ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {node.expanded ? '−' : '+'}
        </div>
      )}
    </div>
  );
};

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onDelete?: () => void;
  node?: FileSystemNode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onCreateFile, onCreateFolder, onDelete, node }) => {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-[150px]"
        style={{ left: x, top: y }}
      >
        {node?.type === 'folder' && (
          <>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
              onClick={onCreateFile}
            >
              <FilePlus size={16} />
              <span>New File</span>
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
              onClick={onCreateFolder}
            >
              <FolderPlus size={16} />
              <span>New Folder</span>
            </button>
            <hr className="my-1" />
          </>
        )}
        {/* Show file operations for files */}
        {node?.type === 'file' && (
          <>
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
              onClick={() => {
                // Open the file in editor
                window.dispatchEvent(new CustomEvent('open-file', { detail: node }));
                onClose();
              }}
            >
              <File size={16} />
              <span>Open</span>
            </button>
            <hr className="my-1" />
          </>
        )}
        {node && node.id !== 'root' && onDelete && (
          <button
            className="w-full px-4 py-2 text-left hover:bg-red-100 text-red-600 flex items-center space-x-2 transition-colors"
            onClick={onDelete}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        )}
      </div>
    </>
  );
};

const Canvas: React.FC = () => {
  const dispatch = useAppDispatch();
  const { nodes: fileSystemNodes, selectedNodeId, loading }: any = useAppSelector((state) => state.fileSystem);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileSystemNode;
  } | null>(null);

  // Define callback functions first
  const handleNodeSelect = useCallback((nodeId: string) => {
    dispatch(selectNode(nodeId));
  }, [dispatch]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileSystemNode) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    });
  }, []);

  const handleFileDoubleClick = useCallback((node: FileSystemNode) => {
    if (node.type === 'file') {
      dispatch(openEditor(node));
    } else if (node.type === 'folder') {
      // Toggle folder expansion for visual feedback
      dispatch(toggleFolder(node.id));
    }
  }, [dispatch]);

  // Memoize nodeTypes to prevent React Flow warnings
  const nodeTypes = useMemo(() => ({
    fileSystemNode: CustomNode,
  }), []);

  // Convert file system nodes to React Flow nodes and edges
  const { reactFlowNodes, reactFlowEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const flattenAllNodes = (nodeList: FileSystemNode[], level = 0): void => {
      for (const node of nodeList) {
        // Create a React Flow node for each file system node
        const reactFlowNode: Node = {
          id: node.id,
          type: 'fileSystemNode',
          position: {
            x: node.x ?? (100 + level * 300),
            y: node.y ?? (100 + nodes.length * 120)
          },
          data: {
            fileSystemNode: node,
            onDoubleClick: handleFileDoubleClick,
            onSelect: handleNodeSelect,
            onContextMenu: handleContextMenu,
            isSelected: selectedNodeId === node.id,
          },
          draggable: true,
        };

        nodes.push(reactFlowNode);

        // Always add children regardless of expansion state
        // This ensures nested files/folders are always accessible
        if (node.type === 'folder' && node.children && node.children.length > 0) {
          // Create edges from parent to children
          for (const child of node.children) {
            edges.push({
              id: `edge-${node.id}-${child.id}`,
              source: node.id,
              target: child.id,
              style: {
                stroke: '#cbd5e1',
                strokeWidth: 2,
                strokeDasharray: node.expanded ? '0' : '5,5'
              },
              type: 'smoothstep',
              animated: false,
            });
          }

          flattenAllNodes(node.children, level + 1);
        }
      }
    };

    flattenAllNodes(fileSystemNodes);
    return { reactFlowNodes: nodes, reactFlowEdges: edges };
  }, [fileSystemNodes, selectedNodeId, handleFileDoubleClick, handleNodeSelect, handleContextMenu]);

  // Listen for custom file open events from context menu
  useEffect(() => {
    const handleOpenFile = (event: CustomEvent) => {
      const file = event.detail;
      if (file && file.type === 'file') {
        dispatch(openEditor(file));
      }
    };

    window.addEventListener('open-file', handleOpenFile as EventListener);
    return () => {
      window.removeEventListener('open-file', handleOpenFile as EventListener);
    };
  }, [dispatch]);

  // Update React Flow nodes and edges when file system nodes change
  useEffect(() => {
    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [reactFlowNodes, reactFlowEdges, setNodes, setEdges]);

  const handleCreateNode = useCallback((type: 'file' | 'folder', parentId: string) => {
    const name = prompt(`Enter ${type} name:`);
    if (name) {
      // Find the parent node to position the new node relative to it
      const findParentNode = (nodes: FileSystemNode[], targetId: string): FileSystemNode | null => {
        for (const node of nodes) {
          if (node.id === targetId) {
            return node;
          }
          if (node.children) {
            const found = findParentNode(node.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const parentNode = findParentNode(fileSystemNodes, parentId);
      const baseX = parentNode?.x ?? 100;
      const baseY = parentNode?.y ?? 100;

      const newNode = {
        type,
        name,
        // Position new nodes slightly offset from parent
        x: baseX + 300 + Math.random() * 100,
        y: baseY + 50 + Math.random() * 100,
        expanded: type === 'folder' ? false : undefined,
        content: type === 'file' ? '' : undefined,
      };
      dispatch(createNodeAPI({ parentId, node: newNode }));
    }
    setContextMenu(null);
  }, [dispatch, fileSystemNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      dispatch(deleteNodeAPI(nodeId));
    }
    setContextMenu(null);
  }, [dispatch]);

  const handleCreateRootNode = useCallback((type: 'file' | 'folder') => {
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
      const rootNode = fileSystemNodes.find((n: FileSystemNode) => n.id === 'root' || n.name === 'Home');
      if (rootNode) {
        dispatch(createNodeAPI({ parentId: rootNode.id, node: newNode }));
      }
    }
  }, [dispatch, fileSystemNodes]);

  const handleNodeDragStop = useCallback((_event: any, node: Node) => {
    // Update position in the store
    dispatch(updateNodePositionAPI({
      id: node.id,
      x: node.position.x,
      y: node.position.y
    }));
  }, [dispatch]);

  const handleSaveTree = useCallback(() => {
    dispatch(saveFileSystemTree(fileSystemNodes));
  }, [dispatch, fileSystemNodes]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const fsNode = node.data?.fileSystemNode;
            return fsNode?.type === 'folder' ? '#3b82f6' : '#6b7280';
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />

        {/* Toolbar Panel */}
        <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-3 m-4">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-gray-800 mr-3">File System</h3>
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
            <button
              onClick={handleSaveTree}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors"
              title="Save file system"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
          </div>
        </Panel>

        {/* Status Panel */}
        <Panel position="bottom-right" className="bg-white rounded-lg shadow-lg p-2 m-4">
          <div className="text-xs text-gray-600">
            {loading ? (
              <div className="flex items-center space-x-2">
                <RefreshCw size={12} className="animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <span>{nodes.length} nodes</span>
            )}
          </div>
        </Panel>
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
          onCreateFile={() => handleCreateNode('file', contextMenu.node.id)}
          onCreateFolder={() => handleCreateNode('folder', contextMenu.node.id)}
          onDelete={() => handleDeleteNode(contextMenu.node.id)}
        />
      )}
    </div>
  );
};

export default Canvas;
