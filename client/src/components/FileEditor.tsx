import React, { useCallback, useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { X, Save, Download, Copy, RotateCcw, Maximize, Minimize } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { closeEditor, updateContent } from '../store/editorSlice';
import { saveFileToAPI } from '../store/editorSlice';

const FileEditor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, file, content, isDirty }:any = useAppSelector((state) => state.editor);
  const [isMaximized, setIsMaximized] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && file) {
      const autoSaveTimer = setTimeout(() => {
        dispatch(saveFileToAPI({ id: file.id, content }));
      }, 30000); // Auto-save after 30 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [content, isDirty, file, dispatch]);

  const handleContentChange = useCallback((value: string | undefined) => {
    dispatch(updateContent(value || ''));
  }, [dispatch]);

  const handleSave = useCallback(() => {
    if (file) {
      dispatch(saveFileToAPI({ id: file.id, content }));
    }
  }, [dispatch, file, content]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmClose = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    dispatch(closeEditor());
  }, [dispatch, isDirty]);

  const handleDownload = useCallback(() => {
    if (file) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [file, content]);

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      // You could add a toast notification here
      alert('Content copied to clipboard!');
    });
  }, [content]);

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset to the original content?')) {
      dispatch(updateContent(file?.content || ''));
    }
  }, [dispatch, file]);

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c':
        return 'cpp';
      case 'xml':
        return 'xml';
      case 'sql':
        return 'sql';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      case 'sh':
        return 'shell';
      case 'yml':
      case 'yaml':
        return 'yaml';
      default:
        return 'plaintext';
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconClass = "w-4 h-4";

    switch (ext) {
      case 'js':
      case 'jsx':
        return <span className={`${iconClass} bg-yellow-500 rounded text-white font-bold text-xs flex items-center justify-center`}>JS</span>;
      case 'ts':
      case 'tsx':
        return <span className={`${iconClass} bg-blue-500 rounded text-white font-bold text-xs flex items-center justify-center`}>TS</span>;
      case 'json':
        return <span className={`${iconClass} bg-orange-500 rounded text-white font-bold text-xs flex items-center justify-center`}>{ }</span>;
      case 'md':
        return <span className={`${iconClass} bg-green-500 rounded text-white font-bold text-xs flex items-center justify-center`}>MD</span>;
      case 'css':
        return <span className={`${iconClass} bg-purple-500 rounded text-white font-bold text-xs flex items-center justify-center`}>CSS</span>;
      case 'html':
        return <span className={`${iconClass} bg-red-500 rounded text-white font-bold text-xs flex items-center justify-center`}>HTML</span>;
      case 'py':
        return <span className={`${iconClass} bg-green-600 rounded text-white font-bold text-xs flex items-center justify-center`}>PY</span>;
      default:
        return <span className={`${iconClass} bg-gray-500 rounded text-white font-bold text-xs flex items-center justify-center`}>📄</span>;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'w':
            e.preventDefault();
            handleClose();
            break;
          case '=':
            e.preventDefault();
            setFontSize(prev => Math.min(prev + 2, 24));
            break;
          case '-':
            e.preventDefault();
            setFontSize(prev => Math.max(prev - 2, 10));
            break;
        }
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleSave, handleClose]);

  if (!isOpen || !file) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isMaximized ? '' : 'p-4'}`}>
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col ${isMaximized ? 'w-full h-full' : 'w-[90%] h-[80%] max-w-6xl'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            {getFileIcon(file.name)}
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {file.name}
              </h2>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{getLanguage(file.name).toUpperCase()}</span>
                <span>•</span>
                <span>{content.length} characters</span>
                <span>•</span>
                <span>{content.split('\n').length} lines</span>
              </div>
            </div>
            {isDirty && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                ● Unsaved
              </span>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center space-x-2">
            {/* Font Size Controls */}
            <div className="flex items-center space-x-1 border rounded px-2 py-1">
              <button
                onClick={() => setFontSize(prev => Math.max(prev - 2, 10))}
                className="text-sm hover:bg-gray-100 px-1 rounded"
                title="Decrease font size (Ctrl+-)"
              >
                A-
              </button>
              <span className="text-xs text-gray-500 px-1">{fontSize}px</span>
              <button
                onClick={() => setFontSize(prev => Math.min(prev + 2, 24))}
                className="text-sm hover:bg-gray-100 px-1 rounded"
                title="Increase font size (Ctrl+=)"
              >
                A+
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark')}
              className="flex items-center space-x-1 px-2 py-1 rounded text-sm hover:bg-gray-100"
              title="Toggle theme"
            >
              {theme === 'vs-dark' ? '🌙' : '☀️'}
            </button>

            {/* Action Buttons */}
            <button
              onClick={handleReset}
              disabled={!isDirty}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium ${
                isDirty
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="Reset to original"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={handleCopyToClipboard}
              className="flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              title="Copy to clipboard"
            >
              <Copy size={14} />
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              title="Download file"
            >
              <Download size={14} />
            </button>

            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium ${
                isDirty
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              title="Save file (Ctrl+S)"
            >
              <Save size={14} />
              <span>Save</span>
            </button>

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>

            <button
              onClick={handleClose}
              className="flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600"
              title="Close editor (Ctrl+W or Esc)"
            >
              <X size={14} />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={getLanguage(file.name)}
            value={content}
            onChange={handleContentChange}
            theme={theme}
            options={{
              minimap: { enabled: true },
              fontSize,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalHasArrows: true,
                horizontalHasArrows: true,
              },
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              bracketPairColorization: {
                enabled: true,
              },
              guides: {
                indentation: true,
                bracketPairs: true,
              },
            }}
          />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t text-xs text-gray-600 rounded-b-lg">
          <div className="flex items-center space-x-4">
            <span>Language: {getLanguage(file.name)}</span>
            <span>Size: {(new Blob([content]).size / 1024).toFixed(2)} KB</span>
            <span>Encoding: UTF-8</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Auto-save: {isDirty ? 'Pending' : 'Saved'}</span>
            <span>Ctrl+S to save • Ctrl+W to close • Esc to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileEditor;
