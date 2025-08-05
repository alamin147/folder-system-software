import axios from 'axios';
import type { FileSystemNode } from '../types/index';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fileSystemAPI = {
  // Get the complete file system tree
  getTree: async (): Promise<FileSystemNode[]> => {
    const response = await api.get('/tree');
    return response.data;
  },

  // Get specific file content
  getFile: async (id: string): Promise<FileSystemNode> => {
    const response = await api.get(`/file/${id}`);
    return response.data;
  },

  // Save file content
  saveFile: async (id: string, content: string): Promise<void> => {
    await api.post(`/file/${id}`, { content });
  },

  // Save entire tree structure
  saveTree: async (nodes: FileSystemNode[]): Promise<void> => {
    await api.post('/tree', { nodes });
  },

  // Update node position
  updateNodePosition: async (id: string, x: number, y: number): Promise<void> => {
    await api.patch(`/node/${id}/position`, { x, y });
  },

  // Create new file or folder
  createNode: async (node: Omit<FileSystemNode, 'id'> & { id: string }): Promise<void> => {
    await api.post('/node', node);
  },

  // Delete node
  deleteNode: async (id: string): Promise<void> => {
    await api.delete(`/node/${id}`);
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; database: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};
