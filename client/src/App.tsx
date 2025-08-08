import { Provider } from 'react-redux';
import { store } from './store/index';
import CanvasNew from './components/CanvasNew';
import FileEditor from './components/FileEditor';
import DataLoader from './components/DataLoader';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <div className="w-screen h-screen flex flex-col">
        {/* Data Loader */}
        <DataLoader />

        {/* Header */}
        <header className="bg-gray-800 text-white px-6 py-3 border-b">
          <h1 className="text-xl font-bold">Visual File System Explorer - WORKING VERSION</h1>
        </header>

        {/* Main Canvas Area */}
        <main className="flex-1 relative overflow-hidden">
          <CanvasNew />
        </main>

        {/* File Editor Modal */}
        <FileEditor />
      </div>
    </Provider>
  );
}

export default App;
