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

const initialState: EditorState = {
  isOpen: false,
  file: null,
  content: '',
  isDirty: false,
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
    },
    closeEditor: (state) => {
      state.isOpen = false;
      state.file = null;
      state.content = '';
      state.isDirty = false;
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
      });
  },
});

export const { openEditor, closeEditor, updateContent, saveContent } = editorSlice.actions;
export default editorSlice.reducer;
