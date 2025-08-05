import { configureStore } from '@reduxjs/toolkit';
import fileSystemReducer from './fileSystemSlice.js';
import editorReducer from './editorSlice.js';

export const store = configureStore({
  reducer: {
    fileSystem: fileSystemReducer,
    editor: editorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
