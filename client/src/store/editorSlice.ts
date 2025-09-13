import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { EditorState, FileSystemNode } from '../types/index';
import { fileSystemAPI } from '../services/api';

// Async thunk for saving file to API
export const saveFileToAPI = createAsyncThunk(
  'editor/saveFile',
  async ({ id, content }: { id: string; content: string }) => {
    await fileSystemAPI.saveFile(id, content);
    return { id, content };
  }
);

// Async thunk for loading file content from API
export const loadFileContent = createAsyncThunk(
  'editor/loadFile',
  async (fileId: string) => {
    const fileData = await fileSystemAPI.getFile(fileId);
    return fileData;
  }
);

const initialState: EditorState = {
  isOpen: false,
  file: null,
  content: '',
  isDirty: false,
  loading: false,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    openEditor: (state, action: PayloadAction<FileSystemNode>) => {
      state.isOpen = true;
      state.file = action.payload;
      state.content = action.payload.content || '';
      state.isDirty = false;
      state.loading = false;
    },
    openEditorAndLoadContent: (state, action: PayloadAction<FileSystemNode>) => {
      state.isOpen = true;
      state.file = action.payload;
      state.content = ''; // Will be loaded async
      state.isDirty = false;
      state.loading = true;
    },
    closeEditor: (state) => {
      state.isOpen = false;
      state.file = null;
      state.content = '';
      state.isDirty = false;
      state.loading = false;
    },
    updateContent: (state, action: PayloadAction<string>) => {
      state.content = action.payload;
      state.isDirty = state.file?.content !== action.payload;
    },
    saveContent: (state) => {
      if (state.file) {
        state.file.content = state.content;
        state.isDirty = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveFileToAPI.fulfilled, (state) => {
        state.isDirty = false;
        if (state.file) {
          state.file.content = state.content;
        }
      })
      .addCase(loadFileContent.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadFileContent.fulfilled, (state, action) => {
        state.loading = false;
        state.content = action.payload.content || '';
        if (state.file) {
          state.file.content = action.payload.content || '';
        }
        state.isDirty = false;
      })
      .addCase(loadFileContent.rejected, (state) => {
        state.loading = false;
        // Keep existing content if loading fails
      });
  },
});

export const { openEditor, openEditorAndLoadContent, closeEditor, updateContent, saveContent } = editorSlice.actions;
export default editorSlice.reducer;
