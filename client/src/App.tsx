import { Provider } from 'react-redux';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { store } from './store/index';
import { useState, useEffect } from 'react';
import CanvasNew from './components/CanvasNew';
import FileEditor from './components/FileEditor';
import DataLoader from './components/DataLoader';
import ProjectManager from './components/ProjectManager';
import './App.css';

// Project Canvas Component that handles URL parameters
function ProjectCanvas() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProjectManager, setShowProjectManager] = useState<boolean>(false);

  // Redirect to project manager if no projectId
  useEffect(() => {
    if (!projectId) {
      navigate('/');
    }
  }, [projectId, navigate]);

  // Extract folder info from URL path
  const pathParts = location.pathname.split('/');
  const activeFolderId = pathParts.length > 3 && pathParts[2] === 'folder' ? pathParts[3] : null;

  if (!projectId) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <header className="bg-gray-800 text-white px-6 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Visual File System Explorer</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <span>Project:</span>
              <span className="font-medium text-white">{projectId}</span>
              {activeFolderId && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="font-medium text-blue-300">Folder: {activeFolderId}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowProjectManager(!showProjectManager)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              {showProjectManager ? 'Hide Projects' : 'Show Projects'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Project Manager Sidebar */}
        {showProjectManager && (
          <div className="w-80 border-r border-gray-200 bg-white">
            <ProjectManager
              onSelectProject={(newProjectId) => {
                if (newProjectId) {
                  navigate(`/${newProjectId}`);
                  setShowProjectManager(false);
                }
              }}
              selectedProjectId={projectId}
            />
          </div>
        )}

        {/* Canvas Area */}
        <main className="flex-1 relative overflow-hidden">
          <CanvasNew projectId={projectId} />
        </main>
      </div>
    </>
  );
}

// Home Component for project selection
function Home() {
  const navigate = useNavigate();

  return (
    <>
      {/* Header */}
      <header className="bg-gray-800 text-white px-6 py-3 border-b flex items-center justify-between">
        <h1 className="text-xl font-bold">Visual File System Explorer</h1>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Project Manager */}
        <div className="w-80 border-r border-gray-200 bg-white">
          <ProjectManager
            onSelectProject={(projectId) => {
              if (projectId) {
                navigate(`/${projectId}`);
              }
            }}
            selectedProjectId=""
          />
        </div>

        {/* Welcome Area */}
        <main className="flex-1 relative overflow-hidden">
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Visual File System Explorer
              </h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Create and manage your projects visually. Each project contains a canvas
                where you can organize files and folders.
              </p>
              <p className="text-sm text-gray-500">
                Select a project from the sidebar to get started.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <div className="w-screen h-screen flex flex-col">
        {/* Data Loader */}
        <DataLoader />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:projectId" element={<ProjectCanvas />} />
          <Route path="/:projectId/folder/:folderId" element={<ProjectCanvas />} />
        </Routes>

        {/* File Editor Modal */}
        <FileEditor />
      </div>
    </Provider>
  );
}

export default App;
