import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

const PORT = process.env.PORT || 5000;

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(compression());
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected successfully');

      // Initialize with default data if empty
      const nodeCount = await FileSystemNode.countDocuments();
      if (nodeCount === 0) {
        console.log('📁 Initializing database with default file system...');
        await initializeDefaultFileSystem();
      }
    } else {
      console.log('⚠️  MongoDB URI not provided, running with mock data');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('🔄 Continuing with mock data...');
  }
};

// Enhanced Project Schema
const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  owner: { type: String, default: 'default' }, // For future user management
  isActive: { type: Boolean, default: true },
  settings: {
    theme: { type: String, default: 'light' },
    layout: { type: String, default: 'canvas' },
    autoSave: { type: Boolean, default: true }
  }
});

const Project = mongoose.model('Project', projectSchema);

// Enhanced File System Node Schema with project reference
const fileSystemNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  projectId: { type: String, required: true }, // Reference to project
  type: { type: String, enum: ['file', 'folder'], required: true },
  name: { type: String, required: true },
  content: { type: String, default: '' }, // Only for files
  parentId: { type: String, default: null },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  expanded: { type: Boolean, default: false }, // Only for folders
  size: { type: Number, default: 0 }, // File size in bytes
  lastModified: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  metadata: {
    language: { type: String, default: '' },
    encoding: { type: String, default: 'utf-8' },
    lineCount: { type: Number, default: 0 },
    permissions: { type: String, default: 'rw-r--r--' }
  }
});

// Add compound indexes for better performance
fileSystemNodeSchema.index({ projectId: 1, parentId: 1 });
fileSystemNodeSchema.index({ projectId: 1, type: 1 });
fileSystemNodeSchema.index({ projectId: 1, name: 1, parentId: 1 });
fileSystemNodeSchema.index({ id: 1, projectId: 1 }, { unique: true });

const FileSystemNode = mongoose.model('FileSystemNode', fileSystemNodeSchema);

// Initialize default projects and file system
const initializeDefaultFileSystem = async () => {
  try {
    // Create default project
    const defaultProject = await Project.findOneAndUpdate(
      { id: 'default-project' },
      {
        id: 'default-project',
        name: 'My First Project',
        description: 'Welcome to your first project! Start building your file hierarchy here.',
        owner: 'default',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Create demo project
    const demoProject = await Project.findOneAndUpdate(
      { id: 'demo-project' },
      {
        id: 'demo-project',
        name: 'Demo Project',
        description: 'A sample project showcasing the file system capabilities.',
        owner: 'default',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Create default nodes for default project
    const defaultNodes = [
      {
        id: 'root-default',
        projectId: 'default-project',
        type: 'folder',
        name: 'Project Root',
        parentId: null,
        x: 100,
        y: 100,
        expanded: true
      }
    ];

    // Create demo nodes for demo project
    const demoNodes = [
      {
        id: 'root-demo',
        projectId: 'demo-project',
        type: 'folder',
        name: 'Demo Root',
        parentId: null,
        x: 100,
        y: 100,
        expanded: true
      },
      {
        id: 'src-folder',
        projectId: 'demo-project',
        type: 'folder',
        name: 'src',
        parentId: 'root-demo',
        x: 100,
        y: 220,
        expanded: false
      },
      {
        id: 'components-folder',
        projectId: 'demo-project',
        type: 'folder',
        name: 'components',
        parentId: 'src-folder',
        x: 100,
        y: 340,
        expanded: false
      },
      {
        id: 'app-js',
        projectId: 'demo-project',
        type: 'file',
        name: 'App.js',
        content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to File System Explorer!</h1>
        <p>Build and organize your projects visually.</p>
      </header>
    </div>
  );
}

export default App;`,
        parentId: 'src-folder',
        x: 300,
        y: 260,
        size: 285,
        metadata: {
          language: 'javascript',
          lineCount: 14
        }
      },
      {
        id: 'readme-md',
        projectId: 'demo-project',
        type: 'file',
        name: 'README.md',
        content: `# Demo Project

This is a demonstration project showing the capabilities of our Visual File System Explorer.

## Features

- 🎨 **Visual Canvas**: Interactive drag-and-drop interface
- 📝 **Code Editor**: Built-in Monaco Editor with syntax highlighting
- 🗂️ **File Management**: Create, edit, delete files and folders
- 🔄 **Real-time Sync**: Changes saved automatically
- 📱 **Multi-Project**: Manage multiple projects seamlessly

## Getting Started

1. Explore the existing files and folders
2. Right-click to create new items
3. Double-click files to edit them
4. Drag nodes to reorganize your structure

Happy coding! 🚀`,
        parentId: 'root-demo',
        x: 300,
        y: 140,
        size: 512,
        metadata: {
          language: 'markdown',
          lineCount: 19
        }
      }
    ];

    // Insert nodes for both projects
    for (const nodeData of [...defaultNodes, ...demoNodes]) {
      await FileSystemNode.findOneAndUpdate(
        { id: nodeData.id, projectId: nodeData.projectId },
        { ...nodeData, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Default projects and file systems initialized');
  } catch (error) {
    console.error('❌ Error initializing default file system:', error);
  }
};

// Project API Routes

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    if (process.env.MONGODB_URI) {
      const projects = await Project.find({ isActive: true }).sort({ updatedAt: -1 });
      res.json(projects);
    } else {
      // Mock data for projects
      const mockProjects = [
        {
          id: 'default-project',
          name: 'My First Project',
          description: 'Welcome to your first project! Start building your file hierarchy here.',
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: 'default',
          isActive: true,
          settings: { theme: 'light', layout: 'canvas', autoSave: true }
        },
        {
          id: 'demo-project',
          name: 'Demo Project',
          description: 'A sample project showcasing the file system capabilities.',
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: 'default',
          isActive: true,
          settings: { theme: 'light', layout: 'canvas', autoSave: true }
        }
      ];
      res.json(mockProjects);
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create new project
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description } = req.body;
    const projectId = `project-${Date.now()}`;

    if (process.env.MONGODB_URI) {
      const project = new Project({
        id: projectId,
        name,
        description,
        owner: 'default'
      });
      await project.save();

      // Create root folder for the project
      const rootNode = new FileSystemNode({
        id: `root-${projectId}`,
        projectId: projectId,
        type: 'folder',
        name: 'Project Root',
        parentId: null,
        x: 100,
        y: 100,
        expanded: true
      });
      await rootNode.save();

      res.status(201).json(project);
    } else {
      // Mock response
      const project = {
        id: projectId,
        name,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: 'default',
        isActive: true,
        settings: { theme: 'light', layout: 'canvas', autoSave: true }
      };
      res.status(201).json(project);
    }
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
app.put('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    if (process.env.MONGODB_URI) {
      const project = await Project.findOneAndUpdate(
        { id: projectId },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } else {
      res.json({ id: projectId, ...updateData, updatedAt: new Date() });
    }
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
app.delete('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    if (process.env.MONGODB_URI) {
      // Mark project as inactive instead of deleting
      await Project.findOneAndUpdate(
        { id: projectId },
        { isActive: false, updatedAt: new Date() }
      );

      // Optionally also delete all nodes in the project
      await FileSystemNode.deleteMany({ projectId });

      res.json({ message: 'Project deleted successfully' });
    } else {
      res.json({ message: 'Project deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Enhanced File System API Routes (with project support)

// Get file system nodes for a specific project
app.get('/api/projects/:projectId/nodes', async (req, res) => {
  try {
    const { projectId } = req.params;

    if (process.env.MONGODB_URI) {
      const nodes = await FileSystemNode.find({ projectId }).sort({ createdAt: 1 });
      console.log('🔍 Raw nodes from DB:', nodes.map(n => ({ id: n.id, name: n.name, expanded: n.expanded, type: n.type })));
      const transformedNodes = buildHierarchy(nodes);
      console.log('🔍 Transformed nodes:', JSON.stringify(transformedNodes.map(n => ({ id: n.id, name: n.name, expanded: n.expanded, type: n.type })), null, 2));
      res.json(transformedNodes);
    } else {
      console.log('🔍 Using mock mode for project:', projectId);
      // Mock data for demo project
      if (projectId === 'demo-project') {
        const mockNodes = [
          {
            id: 'root-demo',
            projectId: 'demo-project',
            type: 'folder',
            name: 'Demo Root',
            x: 100,
            y: 100,
            expanded: true,
            children: [
              {
                id: 'src-folder',
                projectId: 'demo-project',
                type: 'folder',
                name: 'src',
                parentId: 'root-demo',
                x: 100,
                y: 220,
                expanded: false,
                children: [
                  {
                    id: 'app-js',
                    projectId: 'demo-project',
                    type: 'file',
                    name: 'App.js',
                    content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to File System Explorer!</h1>
        <p>Build and organize your projects visually.</p>
      </header>
    </div>
  );
}

export default App;`,
                    parentId: 'src-folder',
                    x: 300,
                    y: 260,
                    size: 285,
                    lastModified: new Date().toISOString()
                  }
                ]
              },
              {
                id: 'readme-md',
                projectId: 'demo-project',
                type: 'file',
                name: 'README.md',
                content: `# Demo Project

This is a demonstration project showing the capabilities of our Visual File System Explorer.

## Features

- 🎨 **Visual Canvas**: Interactive drag-and-drop interface
- 📝 **Code Editor**: Built-in Monaco Editor with syntax highlighting
- 🗂️ **File Management**: Create, edit, delete files and folders
- 🔄 **Real-time Sync**: Changes saved automatically
- 📱 **Multi-Project**: Manage multiple projects seamlessly

## Getting Started

1. Explore the existing files and folders
2. Right-click to create new items
3. Double-click files to edit them
4. Drag nodes to reorganize your structure

Happy coding! 🚀`,
                parentId: 'root-demo',
                x: 300,
                y: 140,
                size: 512,
                lastModified: new Date().toISOString()
              }
            ]
          }
        ];
        res.json(mockNodes);
      } else {
        // Default project - empty root
        res.json([{
          id: `root-${projectId}`,
          projectId: projectId,
          type: 'folder',
          name: 'Project Root',
          x: 100,
          y: 100,
          expanded: true,
          children: []
        }]);
      }
    }
  } catch (error) {
    console.error('Error fetching file system nodes:', error);
    res.status(500).json({ error: 'Failed to fetch file system nodes' });
  }
});

// Create node for a specific project
app.post('/api/projects/:projectId/node', async (req, res) => {
  try {
    const { projectId } = req.params;
    const nodeData = req.body;

    if (process.env.MONGODB_URI) {
      // Add project reference and timestamps
      const newNode = new FileSystemNode({
        ...nodeData,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newNode.save();
      res.status(201).json(newNode);
    } else {
      // Mock response for development
      const mockNode = {
        ...nodeData,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      res.status(201).json(mockNode);
    }
  } catch (error) {
    console.error('Error creating project node:', error);
    res.status(500).json({ error: 'Failed to create node' });
  }
});

// Save tree structure for a specific project
app.post('/api/projects/:projectId/tree', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { nodes } = req.body;

    if (!Array.isArray(nodes)) {
      return res.status(400).json({ error: 'Nodes must be an array' });
    }

    if (process.env.MONGODB_URI) {
      // Start transaction for data integrity
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Clear existing nodes for this project and save new ones
        await FileSystemNode.deleteMany({ projectId }, { session });

        const flatNodes = [];
        const flattenTree = (treeNodes, parentId = null) => {
          treeNodes.forEach(node => {
            const { children, ...nodeData } = node;

            // Calculate metadata for files
            if (nodeData.type === 'file') {
              nodeData.size = calculateFileSize(nodeData.content || '');
              nodeData.metadata = {
                ...nodeData.metadata,
                lineCount: countLines(nodeData.content || ''),
                language: getLanguageFromExtension(nodeData.name)
              };
            }

            flatNodes.push({
              ...nodeData,
              parentId,
              projectId,
              lastModified: new Date(),
              updatedAt: new Date()
            });

            if (children && children.length > 0) {
              flattenTree(children, node.id);
            }
          });
        };

        flattenTree(nodes);
        await FileSystemNode.insertMany(flatNodes, { session });

        await session.commitTransaction();

        // Emit real-time update
        io.emit('tree-updated', { projectId, nodeCount: flatNodes.length });

        res.json({
          message: 'Project tree saved successfully',
          projectId,
          stats: {
            totalNodes: flatNodes.length,
            totalFiles: flatNodes.filter(n => n.type === 'file').length,
            totalFolders: flatNodes.filter(n => n.type === 'folder').length
          }
        });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      res.json({
        message: 'Project tree saved successfully (mock mode)',
        projectId,
        nodeCount: nodes.length
      });
    }
  } catch (error) {
    console.error('❌ Error saving project tree:', error);
    res.status(500).json({
      error: 'Failed to save project tree',
      details: error.message
    });
  }
});

// Update node position
app.patch('/api/node/:id/position', async (req, res) => {
  try {
    const { id } = req.params;
    const { x, y } = req.body;

    if (process.env.MONGODB_URI) {
      const updatedNode = await FileSystemNode.findOneAndUpdate(
        { id },
        { x, y, updatedAt: new Date() },
        { new: true }
      );

      if (!updatedNode) {
        return res.status(404).json({ error: 'Node not found' });
      }

      // Emit real-time update
      io.emit('node-position-updated', { id, x, y });

      res.json({
        message: 'Node position updated successfully',
        node: updatedNode
      });
    } else {
      res.json({
        message: 'Node position updated successfully (mock mode)',
        id, x, y
      });
    }
  } catch (error) {
    console.error('Error updating node position:', error);
    res.status(500).json({ error: 'Failed to update node position' });
  }
});

// Update folder expanded state
app.patch('/api/node/:id/expanded', async (req, res) => {
  try {
    const { id } = req.params;
    const { expanded } = req.body;

    if (process.env.MONGODB_URI) {
      const updatedNode = await FileSystemNode.findOneAndUpdate(
        { id, type: 'folder' },
        { expanded, updatedAt: new Date() },
        { new: true }
      );

      if (!updatedNode) {
        return res.status(404).json({ error: 'Folder not found' });
      }

      // Emit real-time update
      io.emit('folder-expanded-updated', { id, expanded });

      res.json({
        message: 'Folder expanded state updated successfully',
        node: updatedNode
      });
    } else {
      res.json({
        message: 'Folder expanded state updated successfully (mock mode)',
        id, expanded
      });
    }
  } catch (error) {
    console.error('Error updating folder expanded state:', error);
    res.status(500).json({ error: 'Failed to update folder expanded state' });
  }
});

// Delete node
app.delete('/api/node/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (process.env.MONGODB_URI) {
      // Find the node first to get its children
      const nodeToDelete = await FileSystemNode.findOne({ id });

      if (!nodeToDelete) {
        return res.status(404).json({ error: 'Node not found' });
      }

      // Recursively delete node and all its children
      const deleteNodeAndChildren = async (nodeId) => {
        const children = await FileSystemNode.find({ parentId: nodeId });

        // Delete all children first
        for (const child of children) {
          await deleteNodeAndChildren(child.id);
        }

        // Delete the node itself
        await FileSystemNode.deleteOne({ id: nodeId });
      };

      await deleteNodeAndChildren(id);

      // Emit real-time update
      io.emit('node-deleted', { id, projectId: nodeToDelete.projectId });

      res.json({
        message: 'Node and its children deleted successfully',
        deletedNodeId: id
      });
    } else {
      res.json({
        message: 'Node deleted successfully (mock mode)',
        deletedNodeId: id
      });
    }
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({ error: 'Failed to delete node' });
  }
});

// Get file content
app.get('/api/file/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (process.env.MONGODB_URI) {
      const node = await FileSystemNode.findOne({ id, type: 'file' });

      if (!node) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.json(node);
    } else {
      // Mock file content
      res.json({
        id,
        type: 'file',
        name: 'mock-file.txt',
        content: 'Mock file content for development',
        projectId: 'mock-project'
      });
    }
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Save file content
app.post('/api/file/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (process.env.MONGODB_URI) {
      const updatedNode = await FileSystemNode.findOneAndUpdate(
        { id, type: 'file' },
        {
          content,
          size: calculateFileSize(content),
          'metadata.lineCount': countLines(content),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedNode) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Emit real-time update
      io.emit('file-content-updated', { id, content });

      res.json({
        message: 'File content saved successfully',
        file: updatedNode
      });
    } else {
      res.json({
        message: 'File content saved successfully (mock mode)',
        id, content
      });
    }
  } catch (error) {
    console.error('Error saving file content:', error);
    res.status(500).json({ error: 'Failed to save file content' });
  }
});

// Helper function to build hierarchical structure from flat array
const buildHierarchy = (nodes) => {
  const nodeMap = {};
  const rootNodes = [];

  // Create a map of all nodes
  nodes.forEach(node => {
    nodeMap[node.id] = { ...node.toObject(), children: [] };
  });

  // Build the hierarchy
  nodes.forEach(node => {
    const nodeObj = nodeMap[node.id];
    if (node.parentId && nodeMap[node.parentId]) {
      nodeMap[node.parentId].children.push(nodeObj);
    } else {
      rootNodes.push(nodeObj);
    }
  });

  return rootNodes;
};

// Helper functions
const calculateFileSize = (content) => {
  return Buffer.byteLength(content, 'utf8');
};

const countLines = (content) => {
  return content.split('\n').length;
};

const getLanguageFromExtension = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'md': 'markdown',
    'css': 'css',
    'html': 'html',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'xml': 'xml',
    'sql': 'sql',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'sh': 'shell',
    'yml': 'yaml',
    'yaml': 'yaml'
  };
  return languageMap[ext] || 'plaintext';
};

// Helper function to build tree structure from flat array
const buildTree = (nodes) => {
  const nodeMap = new Map();
  const roots = [];

  // Create map of all nodes
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node.toObject(), children: [] });
  });

  // Build tree structure
  nodes.forEach(node => {
    const nodeObj = nodeMap.get(node.id);
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId).children.push(nodeObj);
    } else {
      roots.push(nodeObj);
    }
  });

  return roots;
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  socket.on('join-workspace', (workspaceId) => {
    socket.join(workspaceId);
    console.log(`📁 User ${socket.id} joined workspace: ${workspaceId}`);
  });

  socket.on('file-edit-start', (data) => {
    socket.to(data.workspaceId).emit('user-editing', {
      fileId: data.fileId,
      userId: socket.id,
      userName: data.userName || 'Anonymous'
    });
  });

  socket.on('file-edit-end', (data) => {
    socket.to(data.workspaceId).emit('user-stopped-editing', {
      fileId: data.fileId,
      userId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

// Middleware for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Enhanced Routes

// Get file system tree with statistics
app.get('/api/tree', asyncHandler(async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const nodes = await FileSystemNode.find().sort({ createdAt: 1 });
      if (nodes.length === 0) {
        return res.json([mockFileSystemData]);
      }

      const tree = buildTree(nodes);

      // Add statistics
      const stats = {
        totalNodes: nodes.length,
        totalFiles: nodes.filter(n => n.type === 'file').length,
        totalFolders: nodes.filter(n => n.type === 'folder').length,
        totalSize: nodes.filter(n => n.type === 'file').reduce((sum, n) => sum + (n.size || 0), 0),
        lastModified: nodes.reduce((latest, n) =>
          n.lastModified > latest ? n.lastModified : latest, new Date(0)
        )
      };

      res.json(tree);
    } else {
      const stats = {
        totalNodes: 4,
        totalFiles: 3,
        totalFolders: 1,
        totalSize: 1497,
        lastModified: new Date()
      };
      res.json([mockFileSystemData]);
    }
  } catch (error) {
    console.error('❌ Error fetching tree:', error);
    res.status(500).json({
      error: 'Failed to fetch file system tree',
      message: error.message
    });
  }
}));

// Get specific file content with metadata
app.get('/api/file/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const file = await FileSystemNode.findOne({ id, type: 'file' });
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Update metadata
      file.metadata.lineCount = countLines(file.content || '');
      file.metadata.language = getLanguageFromExtension(file.name);
      file.size = calculateFileSize(file.content || '');

      res.json(file);
    } else {
      // Search in mock data
      const findFile = (nodes, targetId) => {
        for (const node of nodes) {
          if (node.id === targetId && node.type === 'file') {
            return {
              ...node,
              metadata: {
                lineCount: countLines(node.content || ''),
                language: getLanguageFromExtension(node.name),
                encoding: 'utf-8'
              },
              size: calculateFileSize(node.content || '')
            };
          }
          if (node.children) {
            const found = findFile(node.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const file = findFile([mockFileSystemData], id);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      res.json(file);
    }
  } catch (error) {
    console.error('❌ Error fetching file:', error);
    res.status(500).json({
      error: 'Failed to fetch file',
      message: error.message
    });
  }
}));

// Save file content with enhanced metadata
app.post('/api/file/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content && content !== '') {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (mongoose.connection.readyState === 1) {
      const file = await FileSystemNode.findOne({ id, type: 'file' });
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Update file with enhanced metadata
      file.content = content;
      file.size = calculateFileSize(content);
      file.lastModified = new Date();
      file.updatedAt = new Date();
      file.metadata.lineCount = countLines(content);
      file.metadata.language = getLanguageFromExtension(file.name);

      await file.save();

      // Emit real-time update
      io.emit('file-updated', {
        fileId: id,
        size: file.size,
        lastModified: file.lastModified,
        lineCount: file.metadata.lineCount
      });

      res.json({
        message: 'File saved successfully',
        file: {
          id: file.id,
          size: file.size,
          lastModified: file.lastModified,
          metadata: file.metadata
        }
      });
    } else {
      // For mock data, just return success with metadata
      const metadata = {
        size: calculateFileSize(content),
        lineCount: countLines(content),
        language: getLanguageFromExtension('temp.txt'),
        lastModified: new Date()
      };

      res.json({
        message: 'File saved successfully (mock mode)',
        file: { id, ...metadata }
      });
    }
  } catch (error) {
    console.error('❌ Error saving file:', error);
    res.status(500).json({
      error: 'Failed to save file',
      message: error.message
    });
  }
}));

// Get file system tree (legacy endpoint - returns all nodes from all projects)
app.get('/api/tree', asyncHandler(async (req, res) => {
  try {
    if (process.env.MONGODB_URI) {
      const nodes = await FileSystemNode.find({}).sort({ createdAt: 1 });
      const tree = buildHierarchy(nodes);
      res.json(tree);
    } else {
      // Return empty tree for legacy compatibility
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching tree:', error);
    res.status(500).json({ error: 'Failed to fetch tree' });
  }
}));

// Save entire tree structure with validation
app.post('/api/tree', asyncHandler(async (req, res) => {
  try {
    const { nodes } = req.body;

    if (!Array.isArray(nodes)) {
      return res.status(400).json({ error: 'Nodes must be an array' });
    }

    if (mongoose.connection.readyState === 1) {
      // Start transaction for data integrity
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Clear existing nodes and save new ones
        await FileSystemNode.deleteMany({}, { session });

        const flatNodes = [];
        const flattenTree = (treeNodes, parentId = null) => {
          treeNodes.forEach(node => {
            const { children, ...nodeData } = node;

            // Calculate metadata for files
            if (nodeData.type === 'file') {
              nodeData.size = calculateFileSize(nodeData.content || '');
              nodeData.metadata = {
                ...nodeData.metadata,
                lineCount: countLines(nodeData.content || ''),
                language: getLanguageFromExtension(nodeData.name)
              };
            }

            flatNodes.push({
              ...nodeData,
              parentId,
              lastModified: new Date(),
              updatedAt: new Date()
            });

            if (children && children.length > 0) {
              flattenTree(children, node.id);
            }
          });
        };

        flattenTree(nodes);
        await FileSystemNode.insertMany(flatNodes, { session });

        await session.commitTransaction();

        // Emit real-time update
        io.emit('tree-updated', { nodeCount: flatNodes.length });

        res.json({
          message: 'Tree saved successfully',
          stats: {
            totalNodes: flatNodes.length,
            totalFiles: flatNodes.filter(n => n.type === 'file').length,
            totalFolders: flatNodes.filter(n => n.type === 'folder').length
          }
        });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      res.json({ message: 'Tree saved successfully (mock mode)' });
    }
  } catch (error) {
    console.error('❌ Error saving tree:', error);
    res.status(500).json({
      error: 'Failed to save tree',
      message: error.message
    });
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: process.env.MONGODB_URI ?
      (mongoose.connection.readyState === 1 ? 'connected' : 'disconnected') :
      'mock',
    version: '1.0.0'
  });
});

// Search nodes endpoint
app.get('/api/search', asyncHandler(async (req, res) => {
  try {
    const { q: query, projectId } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    if (process.env.MONGODB_URI) {
      const searchFilter = {
        $or: [
          { name: new RegExp(query, 'i') },
          { content: new RegExp(query, 'i') }
        ]
      };

      // Add project filter if specified
      if (projectId) {
        searchFilter.projectId = projectId;
      }

      const results = await FileSystemNode.find(searchFilter).limit(50);
      res.json(results);
    } else {
      // Mock search results
      res.json([]);
    }
  } catch (error) {
    console.error('Error searching nodes:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}));

// Statistics endpoint
app.get('/api/stats', asyncHandler(async (req, res) => {
  try {
    if (process.env.MONGODB_URI) {
      const totalProjects = await Project.countDocuments({ isActive: true });
      const totalNodes = await FileSystemNode.countDocuments();
      const totalFiles = await FileSystemNode.countDocuments({ type: 'file' });
      const totalFolders = await FileSystemNode.countDocuments({ type: 'folder' });

      res.json({
        projects: totalProjects,
        nodes: {
          total: totalNodes,
          files: totalFiles,
          folders: totalFolders
        },
        database: {
          connected: mongoose.connection.readyState === 1,
          name: mongoose.connection.name
        }
      });
    } else {
      res.json({
        projects: 2,
        nodes: { total: 0, files: 0, folders: 0 },
        database: { connected: false, name: 'mock' }
      });
    }
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}));

// Update node position with optimistic updates
app.patch('/api/node/:id/position', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { x, y } = req.body;

    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ error: 'Position coordinates must be numbers' });
    }

    if (mongoose.connection.readyState === 1) {
      const node = await FileSystemNode.findOneAndUpdate(
        { id },
        { x, y, updatedAt: new Date() },
        { new: true }
      );

      if (!node) {
        return res.status(404).json({ error: 'Node not found' });
      }

      // Emit real-time position update
      io.emit('node-moved', { id, x, y });

      res.json({
        message: 'Position updated successfully',
        node: { id: node.id, x: node.x, y: node.y }
      });
    } else {
      res.json({ message: 'Position updated successfully (mock mode)' });
    }
  } catch (error) {
    console.error('❌ Error updating position:', error);
    res.status(500).json({
      error: 'Failed to update position',
      message: error.message
    });
  }
}));

// Create new file or folder with validation
app.post('/api/node', asyncHandler(async (req, res) => {
  try {
    const { id, type, name, parentId, x, y, content } = req.body;

    // Validation
    if (!id || !type || !name) {
      return res.status(400).json({ error: 'ID, type, and name are required' });
    }

    if (!['file', 'folder'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "file" or "folder"' });
    }

    // Check for name conflicts
    if (mongoose.connection.readyState === 1) {
      const existingNode = await FileSystemNode.findOne({ name, parentId });
      if (existingNode) {
        return res.status(409).json({ error: 'A node with this name already exists in the parent folder' });
      }

      const nodeData = {
        id,
        type,
        name,
        parentId,
        x: x || 0,
        y: y || 0,
        content: type === 'file' ? (content || '') : undefined,
        expanded: type === 'folder' ? false : undefined,
        size: type === 'file' ? calculateFileSize(content || '') : undefined,
        metadata: type === 'file' ? {
          language: getLanguageFromExtension(name),
          encoding: 'utf-8',
          lineCount: countLines(content || ''),
          permissions: 'rw-r--r--'
        } : undefined
      };

      const newNode = new FileSystemNode(nodeData);
      await newNode.save();

      // Emit real-time update
      io.emit('node-created', {
        node: newNode,
        parentId
      });

      res.status(201).json({
        message: 'Node created successfully',
        node: newNode
      });
    } else {
      res.status(201).json({
        message: 'Node created successfully (mock mode)',
        node: { id, type, name, parentId }
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ error: 'Node with this ID already exists' });
    } else {
      console.error('❌ Error creating node:', error);
      res.status(500).json({
        error: 'Failed to create node',
        message: error.message
      });
    }
  }
}));

// Delete node with cascade deletion
app.delete('/api/node/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Node ID is required' });
    }

    // Prevent deletion of root node
    if (id === 'root') {
      return res.status(403).json({ error: 'Cannot delete root node' });
    }

    if (mongoose.connection.readyState === 1) {
      // Start transaction for cascade deletion
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Get the node to be deleted
        const nodeToDelete = await FileSystemNode.findOne({ id }, null, { session });
        if (!nodeToDelete) {
          await session.abortTransaction();
          return res.status(404).json({ error: 'Node not found' });
        }

        // Function to recursively collect all descendant IDs
        const collectDescendants = async (nodeId) => {
          const descendants = [];
          const children = await FileSystemNode.find({ parentId: nodeId }, null, { session });

          for (const child of children) {
            descendants.push(child.id);
            const childDescendants = await collectDescendants(child.id);
            descendants.push(...childDescendants);
          }

          return descendants;
        };

        // Collect all nodes to be deleted (including descendants)
        const allNodesToDelete = [id];
        const descendants = await collectDescendants(id);
        allNodesToDelete.push(...descendants);

        // Delete all nodes
        const deleteResult = await FileSystemNode.deleteMany(
          { id: { $in: allNodesToDelete } },
          { session }
        );

        await session.commitTransaction();

        // Emit real-time update
        io.emit('node-deleted', {
          deletedNodeId: id,
          deletedCount: deleteResult.deletedCount,
          descendantIds: descendants
        });

        res.json({
          message: 'Node deleted successfully',
          deletedCount: deleteResult.deletedCount,
          deletedNodes: allNodesToDelete
        });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      res.json({
        message: 'Node deleted successfully (mock mode)',
        deletedNodeId: id
      });
    }
  } catch (error) {
    console.error('❌ Error deleting node:', error);
    res.status(500).json({
      error: 'Failed to delete node',
      message: error.message
    });
  }
}));

// Enhanced health check with system information
app.get('/api/health', asyncHandler(async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let dbStats = null;

  if (mongoose.connection.readyState === 1) {
    try {
      const nodeCount = await FileSystemNode.countDocuments();
      const fileCount = await FileSystemNode.countDocuments({ type: 'file' });
      const folderCount = await FileSystemNode.countDocuments({ type: 'folder' });
      const totalSize = await FileSystemNode.aggregate([
        { $match: { type: 'file' } },
        { $group: { _id: null, total: { $sum: '$size' } } }
      ]);

      dbStats = {
        totalNodes: nodeCount,
        totalFiles: fileCount,
        totalFolders: folderCount,
        totalSize: totalSize[0]?.total || 0
      };
    } catch (error) {
      console.error('Error fetching database stats:', error);
    }
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: {
      status: dbStatus,
      uri: process.env.MONGODB_URI ? '***hidden***' : 'not configured',
      stats: dbStats
    },
    server: {
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    },
    features: {
      realTimeUpdates: true,
      fileEditor: true,
      dragAndDrop: true,
      autoSave: true
    }
  });
}));

// Search nodes by name or content
app.get('/api/search', asyncHandler(async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchQuery = q.trim();
    const searchRegex = new RegExp(searchQuery, 'i');

    if (mongoose.connection.readyState === 1) {
      let query = {
        $or: [
          { name: searchRegex },
          { content: searchRegex }
        ]
      };

      if (type && ['file', 'folder'].includes(type)) {
        query.type = type;
      }

      const results = await FileSystemNode.find(query)
        .select('id type name parentId x y size lastModified metadata')
        .limit(50)
        .sort({ lastModified: -1 });

      res.json({
        query: searchQuery,
        results: results,
        count: results.length
      });
    } else {
      // Mock search in static data
      const searchInMock = (nodes, query) => {
        const results = [];

        const search = (nodeList) => {
          nodeList.forEach(node => {
            if (node.name.toLowerCase().includes(query.toLowerCase()) ||
                (node.content && node.content.toLowerCase().includes(query.toLowerCase()))) {
              results.push({
                id: node.id,
                type: node.type,
                name: node.name,
                parentId: node.parentId,
                x: node.x,
                y: node.y
              });
            }

            if (node.children) {
              search(node.children);
            }
          });
        };

        search(nodes);
        return results;
      };

      const results = searchInMock([mockFileSystemData], searchQuery);
      res.json({
        query: searchQuery,
        results: results.slice(0, 50),
        count: results.length
      });
    }
  } catch (error) {
    console.error('❌ Error in search:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
}));

// Get node statistics
app.get('/api/stats', asyncHandler(async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const [
        totalNodes,
        totalFiles,
        totalFolders,
        sizeStats,
        recentFiles
      ] = await Promise.all([
        FileSystemNode.countDocuments(),
        FileSystemNode.countDocuments({ type: 'file' }),
        FileSystemNode.countDocuments({ type: 'folder' }),
        FileSystemNode.aggregate([
          { $match: { type: 'file' } },
          { $group: {
            _id: null,
            totalSize: { $sum: '$size' },
            avgSize: { $avg: '$size' },
            maxSize: { $max: '$size' }
          }}
        ]),
        FileSystemNode.find({ type: 'file' })
          .sort({ lastModified: -1 })
          .limit(5)
          .select('id name lastModified size')
      ]);

      const languageStats = await FileSystemNode.aggregate([
        { $match: { type: 'file' } },
        { $group: {
          _id: '$metadata.language',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }},
        { $sort: { count: -1 } }
      ]);

      res.json({
        overview: {
          totalNodes,
          totalFiles,
          totalFolders,
          totalSize: sizeStats[0]?.totalSize || 0,
          averageFileSize: Math.round(sizeStats[0]?.avgSize || 0),
          largestFileSize: sizeStats[0]?.maxSize || 0
        },
        languages: languageStats,
        recentFiles,
        generated: new Date().toISOString()
      });
    } else {
      res.json({
        overview: {
          totalNodes: 4,
          totalFiles: 3,
          totalFolders: 1,
          totalSize: 1497,
          averageFileSize: 499,
          largestFileSize: 756
        },
        languages: [
          { _id: 'javascript', count: 1, totalSize: 285 },
          { _id: 'markdown', count: 1, totalSize: 756 },
          { _id: 'json', count: 1, totalSize: 456 }
        ],
        recentFiles: [],
        generated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
}));

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server with enhanced logging
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    // console.log('\n Visual File System Explorer Server');
    // console.log('=====================================');
    // console.log(` Server running on port ${PORT}`);
    // console.log(` Health check: http://localhost:${PORT}/api/health`);
    // console.log(` Statistics: http://localhost:${PORT}/api/stats`);
    // console.log(` Search: http://localhost:${PORT}/api/search?q=<query>`);
    // console.log(`  Database: ${mongoose.connection.readyState === 1 ? ' Connected' : '  Mock Mode'}`);
    // console.log(` Real-time:  Socket.IO enabled`);
    // console.log('\n API Endpoints:');
    // console.log('  GET    /api/tree                 - Get file system tree');
    // console.log('  GET    /api/file/:id             - Get file content');
    // console.log('  POST   /api/file/:id             - Save file content');
    // console.log('  POST   /api/tree                 - Save entire tree');
    // console.log('  POST   /api/node                 - Create new node');
    // console.log('  DELETE /api/node/:id             - Delete node');
    // console.log('  PATCH  /api/node/:id/position    - Update node position');
    // console.log('  GET    /api/search               - Search nodes');
    // console.log('  GET    /api/stats                - Get statistics');
    // console.log('  GET    /api/health               - Health check');
    // console.log('\n Tips:');
    // console.log('  - Set MONGODB_URI to enable database persistence');
    // console.log('  - Use the frontend at http://localhost:5173');
    // console.log('  - Check logs for real-time updates');
    // console.log('=====================================\n');
    console.log("server running on",PORT);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      mongoose.connection.close();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      mongoose.connection.close();
      process.exit(0);
    });
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
