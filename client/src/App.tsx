import { Provider } from 'react-redux';
import { store } from './store/index';
import { useState } from 'react';
import CanvasNew from './components/CanvasNew';
import FileEditor from './components/FileEditor';
import DataLoader from './components/DataLoader';
import ProjectManager from './components/ProjectManager';
import './App.css';

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showProjectManager, setShowProjectManager] = useState<boolean>(true);

  return (
    <Provider store={store}>
      <div className="w-screen h-screen flex flex-col">
        {/* Data Loader */}
        <DataLoader />

        {/* Header */}
        <header className="bg-gray-800 text-white px-6 py-3 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold">Visual File System Explorer</h1>
          <div className="flex items-center space-x-4">
            {selectedProjectId && (
              <button
                onClick={() => setShowProjectManager(!showProjectManager)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              >
                {showProjectManager ? 'Hide Projects' : 'Show Projects'}
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Project Manager Sidebar */}
          {showProjectManager && (
            <div className="w-80 border-r border-gray-200 bg-white">
              <ProjectManager
                onSelectProject={(projectId) => {
                  setSelectedProjectId(projectId);
                  if (projectId) {
                    setShowProjectManager(false);
                  }
                }}
                selectedProjectId={selectedProjectId}
              />
            </div>
          )}

          {/* Canvas Area */}
          <main className="flex-1 relative overflow-hidden">
            {selectedProjectId ? (
              <CanvasNew projectId={selectedProjectId} />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Welcome to Visual File System Explorer
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-md">
                    Create and manage your projects visually. Each project contains a canvas
                    where you can organize files and folders.
                  </p>
                  <button
                    onClick={() => setShowProjectManager(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose a Project
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* File Editor Modal */}
        <FileEditor />
      </div>
    </Provider>
  );
}

export default App;
