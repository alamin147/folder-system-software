import React, { useCallback, useState, useMemo, useEffect } from "react";
import {
  SiPython,
  SiJavascript,
  SiTypescript,
  SiReact,
  SiC,
  SiCplusplus,
  SiHtml5,
  SiCss3,
  SiGnubash,
  SiMarkdown,
  SiMysql,
} from "react-icons/si";
import { AiOutlineFileText } from "react-icons/ai";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MiniMap,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import {
  Folder,
  File,
  FolderOpen,
  FolderPlus,
  FilePlus,
  Trash2,
  Code,
  Settings,
  Image,
  Music,
  Video,
  Archive,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  selectNode,
  toggleFolderAPI,
  createNodeAPI,
  deleteNodeAPI,
  updateNodePosition,
  updateNodePositionAPI,
  setCurrentProject,
  fetchFileSystemTree,
} from "../store/fileSystemSlice";
import { openEditor, openEditorAndLoadContent, loadFileContent } from "../store/editorSlice";
import type { FileSystemNode } from "../types/index";
import { FaJava, FaPhp } from "react-icons/fa";

// Custom Node Component
interface CustomNodeData {
  fileSystemNode: FileSystemNode;
  onDoubleClick: (node: FileSystemNode) => void;
  onSelect: (nodeId: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileSystemNode) => void;
  isSelected: boolean;
  parentNode?: FileSystemNode;
}

// Function to get file icon based on extension
const getFileIcon = (fileName: string, size: number = 20) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    // Programming languages
    case "js":
      return <SiJavascript size={size} className="text-yellow-500" />;
    case "jsx":
      return <SiReact size={size} className="text-blue-400" />;
    case "ts":
      return <SiTypescript size={size} className="text-blue-600" />;
    case "tsx":
      return <SiReact size={size} className="text-blue-500" />;
    case "py":
      return <SiPython size={size} className="text-yellow-400" />;
    case "c":
      return <SiC size={size} className="text-blue-600" />;
    case "cpp":
    case "cc":
    case "cxx":
      return <SiCplusplus size={size} className="text-blue-700" />;
    case "java":
      return <FaJava size={size} className="text-red-600" />;
    case "html":
    case "htm":
      return <SiHtml5 size={size} className="text-orange-600" />;
    case "css":
    case "scss":
    case "sass":
    case "less":
      return <SiCss3 size={size} className="text-blue-500" />;
    case "sh":
    case "bash":
    case "zsh":
      return <SiGnubash size={size} className="text-gray-700" />;
    case "md":
    case "markdown":
      return <SiMarkdown size={size} className="text-gray-800" />;
    case "txt":
      return <AiOutlineFileText size={size} className="text-gray-600" />;
    case "db":
    case "sqlite":
    case "sql":
      return <SiMysql size={size} className="text-blue-700" />;

    case "php":
      return <FaPhp size={size} className="text-purple-600" />;
    case "rb":
      return <Code size={size} className="text-red-600" />;
    case "go":
      return <Code size={size} className="text-cyan-600" />;
    case "rs":
      return <Code size={size} className="text-orange-700" />;

    // Images
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "bmp":
    case "webp":
      return <Image size={size} className="text-green-500" />;

    // Audio
    case "mp3":
    case "wav":
    case "flac":
    case "aac":
    case "ogg":
      return <Music size={size} className="text-purple-500" />;

    // Video
    case "mp4":
    case "avi":
    case "mov":
    case "wmv":
    case "flv":
    case "webm":
      return <Video size={size} className="text-red-500" />;

    // Archives
    case "zip":
    case "rar":
    case "tar":
    case "gz":
    case "7z":
      return <Archive size={size} className="text-yellow-500" />;

    // Config files
    case "json":
    case "xml":
    case "yaml":
    case "yml":
    case "toml":
    case "ini":
    case "conf":
      return <Settings size={size} className="text-gray-500" />;

    // Default file icon
    default:
      return <File size={size} className="text-gray-600" />;
  }
};

const CustomNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
  const {
    fileSystemNode: node,
    onDoubleClick,
    onSelect,
    onContextMenu,
    isSelected,
  } = data;

  const handleClick = useCallback(() => {
    onSelect(node.id);
    if (node.type === "folder") {
      onDoubleClick(node);
    }
  }, [node.id, node.type, onSelect, onDoubleClick]);

  const handleDoubleClick = useCallback(() => {
    if (node.type === "file") {
      onDoubleClick(node);
    }
  }, [node, onDoubleClick]);

  const handleRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onContextMenu(e, node);
    },
    [node, onContextMenu]
  );

  const getIcon = () => {
    if (node.type === "folder") {
      return node.expanded ? <FolderOpen size={20} /> : <Folder size={20} />;
    }
    return getFileIcon(node.name, 20);
  };

  // Calculate dynamic width based on text length
  const getNodeWidth = () => {
    const baseWidth = 140;
    const textLength = node.name.length;

    // Only expand if text is longer than 15 characters
    if (textLength <= 6) {
      return baseWidth; // use base width for short/normal names
    }

    // For long names, calculate width based on character count
    const charWidth = 9; // pixels per character
    const calculatedWidth = textLength * charWidth + 90; // +60 for padding and icon
    return Math.min(calculatedWidth, 400); // max width 400px
  };

  return (
    <div
      className={`
        flex flex-col space-y-1 p-3 rounded-lg border-2 cursor-pointer
        transition-all duration-200 hover:shadow-lg
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
            : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-md"
        }
        ${
          node.type === "folder"
            ? node.expanded
              ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md"
              : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
            : "bg-gradient-to-br from-white to-gray-50"
        }
      `}
      style={{ width: `${getNodeWidth()}px` }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
    >
      {/* Connection Handles */}
      {/* Input handles - top for folders, left for files */}
      <Handle
        type="target"
        position={node.type === "folder" ? Position.Top : Position.Left}
        id={node.type === "folder" ? "target-top" : "target-left"}
        style={{
          background: "#555",
          width: 8,
          height: 8,
          border: "2px solid white",
        }}
      />

      {/* Output handles - bottom for folders (to connect to other folders), right for folders (to connect to files) */}
      {node.type === "folder" && (
        <>
          {/* Bottom handle for folder-to-folder connections */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="source-bottom"
            style={{
              background: "#3b82f6",
              width: 8,
              height: 8,
              border: "2px solid white",
              left: "50%",
            }}
          />
          {/* Right handle for folder-to-file connections */}
          <Handle
            type="source"
            position={Position.Right}
            id="source-right"
            style={{
              background: "#10b981",
              width: 8,
              height: 8,
              border: "2px solid white",
            }}
          />
        </>
      )}

      {/* Source indicator for child nodes */}
      {/* {parentNode && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          <span>📁</span>
          <span>from: {parentNode.name}</span>
        </div>
      )} */}

      {/* Main node content */}
      <div className="flex items-center space-x-2">
        <div
          className={node.type === "folder" ? "text-blue-600" : "text-gray-600"}
        >
          {getIcon()}
        </div>
        <div className="flex-1">
          <span
            className="text-sm font-medium text-gray-800 whitespace-nowrap "
            title={node.name}
          >
            {node.name}
          </span>
          {node.type === "folder" &&
            node.children &&
            node.children.length > 0 && (
              <span className="text-xs text-gray-500">
                <br />({node.children.length} item
                {node.children.length !== 1 ? "s" : ""})
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

const CanvasNew: React.FC<{ projectId?: string }> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { nodes: fileSystemNodes, selectedNodeId }: any = useAppSelector(
    (state) => state.fileSystem
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileSystemNode;
  } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createNodeType, setCreateNodeType] = useState<"file" | "folder">("file");
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [createParentName, setCreateParentName] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
  const [deleteNodeName, setDeleteNodeName] = useState<string | null>(null);

  // Load project data when projectId changes
  useEffect(() => {
    if (projectId) {
      dispatch(setCurrentProject(projectId));
      dispatch(fetchFileSystemTree(projectId));
    } else {
      dispatch(setCurrentProject(null));
    }
  }, [projectId, dispatch]);

  // Use test data if enabled or if no real data
  const currentData = useMemo(() => {
    if (!fileSystemNodes || fileSystemNodes.length === 0) {
      console.log("Using test data");
      return;
    }
    console.log("📊 Loaded file system nodes:", fileSystemNodes.map((n: FileSystemNode) => ({
      name: n.name,
      x: n.x,
      y: n.y,
      type: n.type,
      expanded: n.expanded
    })));
    return fileSystemNodes;
  }, [fileSystemNodes]);

  const handleFileDoubleClick = useCallback(
    (node: FileSystemNode) => {
      console.log(
        "Node clicked:",
        node.name,
        "Type:",
        node.type,
        "Expanded:",
        node.expanded
      );
      if (node.type === "file") {
        // Check if file content is already available or needs to be loaded
        if (node.content !== undefined) {
          // Content is already available, open directly
          dispatch(openEditor(node));
        } else {
          // Content needs to be loaded from database
          dispatch(openEditorAndLoadContent(node));
          dispatch(loadFileContent(node.id));
        }
      } else if (node.type === "folder") {
        console.log("🔄 Toggling folder:", node.id, "current expanded:", node.expanded);
        dispatch(toggleFolderAPI(node.id));
      }
    },
    [dispatch]
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      dispatch(selectNode(nodeId));
    },
    [dispatch]
  );

  const handleNodeDragStop = useCallback(
    (_: any, node: any) => {
      console.log(`🔄 Node ${node.id} dragged to position:`, node.position.x, node.position.y);

      // Update the node position in the Redux store (local state)
      dispatch(
        updateNodePosition({
          id: node.id,
          x: node.position.x,
          y: node.position.y,
        })
      );

      // Also save the position to the database
      dispatch(
        updateNodePositionAPI({
          id: node.id,
          x: node.position.x,
          y: node.position.y,
        })
      );
    },
    [dispatch]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: FileSystemNode) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        node,
      });
    },
    []
  );

  // Node creation handlers
  const handleCreateNode = useCallback(
    (type: "file" | "folder", parentId: string) => {
      // Find parent node to get its name
      const findNodeById = (
        nodes: FileSystemNode[],
        id: string
      ): FileSystemNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const parentNode = findNodeById(fileSystemNodes, parentId);

      // Set up modal state
      setCreateNodeType(type);
      setCreateParentId(parentId);
      setCreateParentName(parentNode?.name || "Root");
      setIsCreateModalOpen(true);
      setContextMenu(null);
    },
    [fileSystemNodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      // Find the node to get its name
      const findNodeById = (
        nodes: FileSystemNode[],
        id: string
      ): FileSystemNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const nodeToDelete = findNodeById(fileSystemNodes, nodeId);
      setDeleteNodeId(nodeId);
      setDeleteNodeName(nodeToDelete?.name || "this item");
      setIsDeleteModalOpen(true);
      setContextMenu(null);
    },
    [fileSystemNodes]
  );

  const confirmDelete = useCallback(() => {
    if (deleteNodeId) {
      dispatch(deleteNodeAPI(deleteNodeId));
      setIsDeleteModalOpen(false);
      setDeleteNodeId(null);
      setDeleteNodeName(null);
    }
  }, [dispatch, deleteNodeId]);

  // Generate nodes and edges - SIMPLIFIED AND GUARANTEED TO WORK
  const { reactFlowNodes, reactFlowEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeCount = 0;

    const processNode = (
      node: FileSystemNode,
      parentNode?: FileSystemNode,
      level = 0
    ) => {
      console.log(
        "Processing node:",
        node.name,
        "Parent:",
        parentNode?.name,
        "Expanded:",
        node.expanded,
        "Position:",
        `x=${node.x}, y=${node.y}`
      );

      // Create React Flow node
      const reactFlowNode: Node = {
        id: node.id,
        type: "default",
        position: {
          x: node.x ?? 100 + level * 300,
          y: node.y ?? 100 + nodeCount * 80,
        },
        data: {
          label: (
            <CustomNode
              data={{
                fileSystemNode: node,
                onDoubleClick: handleFileDoubleClick,
                onSelect: handleNodeSelect,
                onContextMenu: handleContextMenu,
                isSelected: selectedNodeId === node.id,
                parentNode: parentNode,
              }}
            />
          ),
        },
        draggable: true,
        style: {
          background: "transparent",
          border: "none",
          padding: 0,
        },
      };

      nodes.push(reactFlowNode);
      nodeCount++;

      // Create edge from parent to this node - ALWAYS CREATE IF PARENT EXISTS
      if (parentNode) {
        // Determine source and target handles based on child type
        const sourceHandle =
          node.type === "folder" ? "source-bottom" : "source-right"; // folder→folder uses bottom, folder→file uses right
        const targetHandle =
          node.type === "folder" ? "target-top" : "target-left"; // folders receive from top, files from left

        const edge: Edge = {
          id: `edge-${parentNode.id}-${node.id}`,
          source: parentNode.id,
          target: node.id,
          sourceHandle: sourceHandle,
          targetHandle: targetHandle,
          type: "default",
          animated: true,
          style: {
            stroke: node.type === "folder" ? "#3b82f6" : "#10b981",
            strokeWidth: 4,
            strokeDasharray: "8,4",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: node.type === "folder" ? "#3b82f6" : "#10b981",
            width: 15,
            height: 15,
          },
          label: node.type === "folder" ? "📁" : "📄",
          labelBgStyle: { fill: "white", fillOpacity: 0.9 },
          labelStyle: { fontSize: "12px", fontWeight: "bold" },
          pathOptions: {
            curvature: 0.5,
          },
        };
        edges.push(edge);
        console.log(
          "✅ Created edge from",
          parentNode.name,
          "to",
          node.name,
          "using",
          sourceHandle,
          "→",
          targetHandle
        );
      }

      // Process children only if folder is expanded
      if (node.type === "folder" && node.children && node.expanded) {
        console.log("📂 Processing children of expanded folder:", node.name);
        node.children.forEach((child) => {
          processNode(child, node, level + 1);
        });
      }
    };

    // Process all root nodes
    currentData?.forEach((rootNode: FileSystemNode) => {
      processNode(rootNode);
    });

    console.log(
      "🎯 FINAL RESULT: Generated",
      nodes.length,
      "nodes and",
      edges.length,
      "edges"
    );
    console.log(
      "📊 Edges:",
      edges.map((e) => `${e.source} -> ${e.target}`)
    );

    return { reactFlowNodes: nodes, reactFlowEdges: edges };
  }, [currentData, selectedNodeId, handleFileDoubleClick, handleNodeSelect]);

  // Update React Flow when data changes
  useEffect(() => {
    console.log(
      "🔄 Updating ReactFlow with",
      reactFlowNodes.length,
      "nodes and",
      reactFlowEdges.length,
      "edges"
    );
    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [reactFlowNodes, reactFlowEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full">
      <style
        dangerouslySetInnerHTML={{
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

          /* Custom Modal Animations */
          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes zoom-in-95 {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @keyframes slide-in-from-bottom-4 {
            from {
              transform: translateY(16px);
            }
            to {
              transform: translateY(0);
            }
          }

          .animate-in {
            animation-duration: 150ms;
            animation-timing-function: ease-out;
            animation-fill-mode: both;
          }

          .fade-in {
            animation-name: fade-in;
          }

          .zoom-in-95 {
            animation-name: zoom-in-95;
          }

          .slide-in-from-bottom-4 {
            animation-name: slide-in-from-bottom-4;
          }

          .duration-200 {
            animation-duration: 200ms !important;
          }

          .duration-300 {
            animation-duration: 300ms !important;
          }
        `,
        }}
      />

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
        <MiniMap
          nodeColor={(node) => {
            const data = node.data?.label?.props?.data;
            if (data?.fileSystemNode?.type === "folder") {
              return data.fileSystemNode.expanded ? "#3b82f6" : "#6b7280";
            }
            return "#10b981";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          pannable={true}
          zoomable={true}
          inversePan={false}
          position="bottom-right"
        />
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-[150px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.node.type === "folder" && (
              <>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                  onClick={() => handleCreateNode("file", contextMenu.node.id)}
                >
                  <FilePlus size={16} />
                  <span>New File</span>
                </button>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                  onClick={() =>
                    handleCreateNode("folder", contextMenu.node.id)
                  }
                >
                  <FolderPlus size={16} />
                  <span>New Folder</span>
                </button>
                <hr className="my-1" />
              </>
            )}
            {contextMenu.node.type === "file" && (
              <>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                  onClick={() => {
                    const node = contextMenu.node;
                    if (node.content !== undefined) {
                      dispatch(openEditor(node));
                    } else {
                      dispatch(openEditorAndLoadContent(node));
                      dispatch(loadFileContent(node.id));
                    }
                    setContextMenu(null);
                  }}
                >
                  <File size={16} />
                  <span>Open</span>
                </button>
                <hr className="my-1" />
              </>
            )}
            {contextMenu.node.id !== "root" && (
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

      {/* Create Node Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md"
            onClick={() => setIsCreateModalOpen(false)}
          />
          {/* Modal */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-0 w-full max-w-lg mx-4 transform transition-all animate-in zoom-in-95 duration-300 slide-in-from-bottom-4">
            {/* Gradient Header */}
            <div className={`relative overflow-hidden rounded-t-2xl ${
              createNodeType === "folder"
                ? "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"
                : "bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600"
            }`}>
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
                    {createNodeType === "folder" ? (
                      <FolderPlus size={24} className="text-white drop-shadow-sm" />
                    ) : (
                      <FilePlus size={24} className="text-white drop-shadow-sm" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white drop-shadow-sm">
                      Create New {createNodeType === "folder" ? "Folder" : "File"}
                    </h3>
                    {createParentName && (
                      <p className="text-white/80 text-sm font-medium mt-1 flex items-center">
                        <Folder size={14} className="mr-1.5" />
                        {createParentName}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group border border-white/20 hover:border-white/40"
                >
                  <X size={20} className="text-white/80 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = (formData.get('name') as string)?.trim();
                  if (name && createParentId && projectId) {
                    // Find parent node to get its position for new node placement
                    const findNodeById = (
                      nodes: FileSystemNode[],
                      id: string
                    ): FileSystemNode | null => {
                      for (const node of nodes) {
                        if (node.id === id) return node;
                        if (node.children) {
                          const found = findNodeById(node.children, id);
                          if (found) return found;
                        }
                      }
                      return null;
                    };

                    const parentNode = findNodeById(fileSystemNodes, createParentId);
                    let newX, newY;

                    if (parentNode) {
                      if (createNodeType === "folder") {
                        // Position folders under the parent with a gap
                        newX = parentNode.x || 100;
                        newY = (parentNode.y || 100) + 120; // 120px below parent
                      } else {
                        // Position files to the bottom-right of parent
                        newX = (parentNode.x || 100) + 200; // 200px to the right
                        newY = (parentNode.y || 100) + 80; // 80px below parent
                      }
                    } else {
                      // Fallback to random position if parent not found
                      newX = Math.random() * 200 + 100;
                      newY = Math.random() * 200 + 100;
                    }

                    dispatch(
                      createNodeAPI({
                        parentId: createParentId,
                        node: {
                          name,
                          type: createNodeType,
                          x: newX,
                          y: newY,
                          expanded: createNodeType === "folder" ? false : undefined,
                          content: createNodeType === "file" ? "" : undefined,
                        },
                        projectId,
                      })
                    );
                    setIsCreateModalOpen(false);
                  }
                }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    {createNodeType === "folder" ? "Folder" : "File"} Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      placeholder={
                        createNodeType === "folder"
                          ? "e.g., components, assets, docs..."
                          : "e.g., app.js, styles.css, README.md..."
                      }
                      className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 font-medium hover:bg-gray-50 focus:bg-white focus:shadow-lg"
                      autoFocus
                      required
                    />
                    <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ${
                      createNodeType === "folder" ? "text-blue-400" : "text-green-400"
                    }`}>
                      {createNodeType === "folder" ? (
                        <Folder size={18} />
                      ) : (
                        <File size={18} />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    {createNodeType === "folder"
                      ? "Choose a descriptive name for your folder. It will help organize your project structure."
                      : "Include the file extension (e.g., .js, .css, .md) to ensure proper syntax highlighting."
                    }
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold hover:shadow-md focus:ring-2 focus:ring-gray-300/50 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2.5 text-white rounded-xl font-semibold transition-all duration-200 focus:ring-2 focus:outline-none hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                      createNodeType === "folder"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-300/50 shadow-blue-200/50"
                        : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:ring-green-300/50 shadow-green-200/50"
                    } shadow-lg`}
                  >
                    <span className="flex items-center space-x-2">
                      {createNodeType === "folder" ? (
                        <FolderPlus size={16} />
                      ) : (
                        <FilePlus size={16} />
                      )}
                      <span>Create {createNodeType === "folder" ? "Folder" : "File"}</span>
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-black/50 to-red-900/40 backdrop-blur-md"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          {/* Modal */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-0 w-full max-w-lg mx-4 transform transition-all animate-in zoom-in-95 duration-300 slide-in-from-bottom-4">
            {/* Gradient Header */}
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-red-500 via-red-600 to-rose-600">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative px-6 py-4 flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
                  <Trash2 size={24} className="text-white drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white drop-shadow-sm">
                    Delete Item
                  </h3>
                  <p className="text-white/80 text-sm font-medium mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6 p-4 bg-red-50/80 border border-red-200/50 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 p-1 bg-red-100 rounded-lg">
                    <Trash2 size={16} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium leading-relaxed">
                      Are you sure you want to delete{" "}
                      <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                        "{deleteNodeName}"
                      </span>
                      ?
                    </p>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      This will permanently remove the item and all its contents from your project. This action cannot be reversed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold hover:shadow-md focus:ring-2 focus:ring-gray-300/50 focus:outline-none"
                >
                  Keep Item
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2.5 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-semibold transition-all duration-200 focus:ring-2 focus:ring-red-300/50 focus:outline-none hover:shadow-lg transform hover:scale-105 active:scale-95 shadow-lg shadow-red-200/50"
                >
                  <span className="flex items-center space-x-2">
                    <Trash2 size={16} />
                    <span>Delete Forever</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasNew;
