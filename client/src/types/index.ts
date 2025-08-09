export interface FileSystemNode {
  id: string;
  projectId?: string; // Add project reference
  type: 'file' | 'folder';
  name: string;
  content?: string; // Only for files
  children?: FileSystemNode[]; // Only for folders
  parentId?: string;
  x?: number; // Canvas position
  y?: number; // Canvas position
  expanded?: boolean; // Only for folders
}

export interface FileSystemState {
  nodes: FileSystemNode[];
  selectedNodeId: string | null;
  currentProjectId: string | null; // Add current project tracking
  isEditorOpen: boolean;
  editingFile: FileSystemNode | null;
  loading: boolean;
  error: string | null;
}

export interface EditorState {
  isOpen: boolean;
  file: FileSystemNode | null;
  content: string;
  isDirty: boolean;
}
