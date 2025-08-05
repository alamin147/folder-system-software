import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { FileSystemNode, FileSystemState } from '../types/index';
import { fileSystemAPI } from '../services/api';

// Async thunks for API calls
export const fetchFileSystemTree = createAsyncThunk(
  'fileSystem/fetchTree',
  async () => {
    const tree = await fileSystemAPI.getTree();
    return tree;
  }
);

export const saveFileContent = createAsyncThunk(
  'fileSystem/saveFile',
  async ({ id, content }: { id: string; content: string }) => {
    await fileSystemAPI.saveFile(id, content);
    return { id, content };
  }
);

export const saveFileSystemTree = createAsyncThunk(
  'fileSystem/saveTree',
  async (nodes: FileSystemNode[]) => {
    await fileSystemAPI.saveTree(nodes);
    return nodes;
  }
);

export const updateNodePositionAPI = createAsyncThunk(
  'fileSystem/updatePosition',
  async ({ id, x, y }: { id: string; x: number; y: number }) => {
    await fileSystemAPI.updateNodePosition(id, x, y);
    return { id, x, y };
  }
);

export const createNodeAPI = createAsyncThunk(
  'fileSystem/createNode',
  async ({ parentId, node }: { parentId: string; node: Omit<FileSystemNode, 'id' | 'parentId'> }) => {
    const newNode = {
      ...node,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      parentId,
      x: (node.x || 0) + Math.random() * 100,
      y: (node.y || 0) + Math.random() * 100,
    };
    await fileSystemAPI.createNode(newNode);
    return { parentId, node: newNode };
  }
);

export const deleteNodeAPI = createAsyncThunk(
  'fileSystem/deleteNode',
  async (nodeId: string) => {
    await fileSystemAPI.deleteNode(nodeId);
    return nodeId;
  }
);

const initialState: FileSystemState = {
  nodes: [],
  selectedNodeId: null,
  isEditorOpen: false,
  editingFile: null,
  loading: false,
  error: null,
};

const fileSystemSlice = createSlice({
  name: 'fileSystem',
  initialState,
  reducers: {
    selectNode: (state, action: PayloadAction<string>) => {
      state.selectedNodeId = action.payload;
    },
    toggleFolder: (state, action: PayloadAction<string>) => {
      const toggleNodeRecursive = (nodes: FileSystemNode[]): void => {
        for (const node of nodes) {
          if (node.id === action.payload && node.type === 'folder') {
            node.expanded = !node.expanded;
            return;
          }
          if (node.children) {
            toggleNodeRecursive(node.children);
          }
        }
      };
      toggleNodeRecursive(state.nodes);
    },
    updateNodePosition: (state, action: PayloadAction<{ id: string; x: number; y: number }>) => {
      const updatePositionRecursive = (nodes: FileSystemNode[]): void => {
        for (const node of nodes) {
          if (node.id === action.payload.id) {
            node.x = action.payload.x;
            node.y = action.payload.y;
            return;
          }
          if (node.children) {
            updatePositionRecursive(node.children);
          }
        }
      };
      updatePositionRecursive(state.nodes);
    },
    updateFileContent: (state, action: PayloadAction<{ id: string; content: string }>) => {
      const updateContentRecursive = (nodes: FileSystemNode[]): void => {
        for (const node of nodes) {
          if (node.id === action.payload.id && node.type === 'file') {
            node.content = action.payload.content;
            return;
          }
          if (node.children) {
            updateContentRecursive(node.children);
          }
        }
      };
      updateContentRecursive(state.nodes);
    },
    addNode: (state, action: PayloadAction<{ parentId: string; node: Omit<FileSystemNode, 'parentId'> }>) => {
      const addNodeRecursive = (nodes: FileSystemNode[]): boolean => {
        for (const node of nodes) {
          if (node.id === action.payload.parentId && node.type === 'folder') {
            if (!node.children) node.children = [];
            node.children.push({ ...action.payload.node, parentId: action.payload.parentId });
            return true;
          }
          if (node.children && addNodeRecursive(node.children)) {
            return true;
          }
        }
        return false;
      };
      addNodeRecursive(state.nodes);
    },
    deleteNode: (state, action: PayloadAction<string>) => {
      const deleteNodeRecursive = (nodes: FileSystemNode[]): FileSystemNode[] => {
        return nodes.filter(node => {
          if (node.id === action.payload) {
            return false;
          }
          if (node.children) {
            node.children = deleteNodeRecursive(node.children);
          }
          return true;
        });
      };
      state.nodes = deleteNodeRecursive(state.nodes);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tree
      .addCase(fetchFileSystemTree.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFileSystemTree.fulfilled, (state, action) => {
        state.loading = false;
        state.nodes = action.payload;
      })
      .addCase(fetchFileSystemTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch file system tree';
      })
      // Save file
      .addCase(saveFileContent.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveFileContent.fulfilled, (state, action) => {
        state.loading = false;
        // Update local state
        const updateContentRecursive = (nodes: FileSystemNode[]): void => {
          for (const node of nodes) {
            if (node.id === action.payload.id && node.type === 'file') {
              node.content = action.payload.content;
              return;
            }
            if (node.children) {
              updateContentRecursive(node.children);
            }
          }
        };
        updateContentRecursive(state.nodes);
      })
      .addCase(saveFileContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save file';
      })
      // Update position
      .addCase(updateNodePositionAPI.fulfilled, (state, action) => {
        const updatePositionRecursive = (nodes: FileSystemNode[]): void => {
          for (const node of nodes) {
            if (node.id === action.payload.id) {
              node.x = action.payload.x;
              node.y = action.payload.y;
              return;
            }
            if (node.children) {
              updatePositionRecursive(node.children);
            }
          }
        };
        updatePositionRecursive(state.nodes);
      })
      // Create node
      .addCase(createNodeAPI.fulfilled, (state, action) => {
        const addNodeRecursive = (nodes: FileSystemNode[]): boolean => {
          for (const node of nodes) {
            if (node.id === action.payload.parentId && node.type === 'folder') {
              if (!node.children) node.children = [];
              node.children.push({ ...action.payload.node, parentId: action.payload.parentId });
              return true;
            }
            if (node.children && addNodeRecursive(node.children)) {
              return true;
            }
          }
          return false;
        };
        addNodeRecursive(state.nodes);
      })
      // Delete node
      .addCase(deleteNodeAPI.fulfilled, (state, action) => {
        const deleteNodeRecursive = (nodes: FileSystemNode[]): void => {
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.id === action.payload) {
              nodes.splice(i, 1);
              return;
            }
            if (node.children) {
              deleteNodeRecursive(node.children);
            }
          }
        };
        deleteNodeRecursive(state.nodes);
      });
  },
});

export const { selectNode, toggleFolder, updateNodePosition, updateFileContent, addNode, deleteNode, clearError } = fileSystemSlice.actions;
export default fileSystemSlice.reducer;
