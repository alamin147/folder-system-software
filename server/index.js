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

// Enhanced File System Node Schema
const fileSystemNodeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
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

// Add indexes for better performance
fileSystemNodeSchema.index({ parentId: 1 });
fileSystemNodeSchema.index({ type: 1 });
fileSystemNodeSchema.index({ name: 1, parentId: 1 });

const FileSystemNode = mongoose.model('FileSystemNode', fileSystemNodeSchema);

// Initialize default file system
const initializeDefaultFileSystem = async () => {
  const defaultNodes = [
    {
      id: 'root',
      type: 'folder',
      name: 'Home',
      parentId: null,
      x: 100,
      y: 100,
      expanded: true
    },
    {
      id: 'folder1',
      type: 'folder',
      name: 'Project A',
      parentId: 'root',
      x: 400,
      y: 200,
      expanded: false
    },
    {
      id: 'file1',
      type: 'file',
      name: 'index.js',
      content: `// Welcome to the Visual File System Explorer!
console.log('Hello World!');

// This is a sample JavaScript file
function greet(name) {
  return \`Hello, \${name}! Welcome to our file system.\`;
}

const message = greet('Developer');
console.log(message);

// You can edit this file and save changes
// Try adding your own code here!`,
      parentId: 'folder1',
      x: 700,
      y: 300,
      size: 285,
      metadata: {
        language: 'javascript',
        lineCount: 12
      }
    },
    {
      id: 'file2',
      type: 'file',
      name: 'README.md',
      content: `# Project A

Welcome to **Project A**! This is a demonstration of our Visual File System Explorer.

## Features

- 🎨 **Visual Canvas**: Drag and drop files and folders on an interactive canvas
- 📝 **Code Editor**: Built-in Monaco Editor with syntax highlighting
- 🗂️ **File Management**: Create, edit, delete files and folders
- 💾 **Persistence**: Save your changes to MongoDB or use mock data
- 🎯 **Real-time**: Live updates across the application

## Getting Started

1. Double-click any file to open it in the editor
2. Right-click folders to create new files or folders
3. Drag nodes around to organize your workspace
4. Use Ctrl+S to save your changes

## Supported File Types

- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Markdown (.md)
- JSON (.json)
- CSS (.css)
- HTML (.html)
- Python (.py)
- And many more!

Enjoy exploring! 🚀`,
      parentId: 'folder1',
      x: 700,
      y: 450,
      size: 756,
      metadata: {
        language: 'markdown',
        lineCount: 29
      }
    },
    {
      id: 'file3',
      type: 'file',
      name: 'config.json',
      content: `{
  "name": "visual-file-system-explorer",
  "version": "1.0.0",
  "description": "A beautiful canvas-based file system explorer",
  "features": [
    "Visual Canvas",
    "Monaco Editor",
    "File Management",
    "Real-time Updates",
    "Drag & Drop"
  ],
  "settings": {
    "theme": "dark",
    "autoSave": true,
    "autoSaveInterval": 30000,
    "showMinimap": true,
    "fontSize": 14
  },
  "supportedLanguages": [
    "javascript",
    "typescript",
    "markdown",
    "json",
    "css",
    "html",
    "python"
  ]
}`,
      parentId: 'root',
      x: 400,
      y: 350,
      size: 456,
      metadata: {
        language: 'json',
        lineCount: 23
      }
    }
  ];

  try {
    await FileSystemNode.insertMany(defaultNodes);
    console.log('✅ Default file system initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing default file system:', error.message);
  }
};

// Enhanced mock data for when database is not available
const mockFileSystemData = {
  "id": "root",
  "type": "folder",
  "name": "Home",
  "x": 100,
  "y": 100,
  "expanded": true,
  "children": [
    {
      "id": "folder1",
      "type": "folder",
      "name": "Project A",
      "parentId": "root",
      "x": 400,
      "y": 200,
      "expanded": false,
      "children": [
        {
          "id": "file1",
          "type": "file",
          "name": "index.js",
          "content": `// Welcome to the Visual File System Explorer!
console.log('Hello World!');

// This is a sample JavaScript file
function greet(name) {
  return \`Hello, \${name}! Welcome to our file system.\`;
}

const message = greet('Developer');
console.log(message);

// You can edit this file and save changes
// Try adding your own code here!`,
          "parentId": "folder1",
          "x": 700,
          "y": 300,
          "size": 285,
          "lastModified": new Date().toISOString()
        },
        {
          "id": "file2",
          "type": "file",
          "name": "README.md",
          "content": `# Project A

Welcome to **Project A**! This is a demonstration of our Visual File System Explorer.

## Features

- 🎨 **Visual Canvas**: Drag and drop files and folders on an interactive canvas
- 📝 **Code Editor**: Built-in Monaco Editor with syntax highlighting
- 🗂️ **File Management**: Create, edit, delete files and folders
- 💾 **Persistence**: Save your changes to MongoDB or use mock data
- 🎯 **Real-time**: Live updates across the application

## Getting Started

1. Double-click any file to open it in the editor
2. Right-click folders to create new files or folders
3. Drag nodes around to organize your workspace
4. Use Ctrl+S to save your changes

## Supported File Types

- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Markdown (.md)
- JSON (.json)
- CSS (.css)
- HTML (.html)
- Python (.py)
- And many more!

Enjoy exploring! 🚀`,
          "parentId": "folder1",
          "x": 700,
          "y": 450,
          "size": 756,
          "lastModified": new Date().toISOString()
        }
      ]
    },
    {
      "id": "file3",
      "type": "file",
      "name": "config.json",
      "content": `{
  "name": "visual-file-system-explorer",
  "version": "1.0.0",
  "description": "A beautiful canvas-based file system explorer",
  "features": [
    "Visual Canvas",
    "Monaco Editor",
    "File Management",
    "Real-time Updates",
    "Drag & Drop"
  ],
  "settings": {
    "theme": "dark",
    "autoSave": true,
    "autoSaveInterval": 30000,
    "showMinimap": true,
    "fontSize": 14
  },
  "supportedLanguages": [
    "javascript",
    "typescript",
    "markdown",
    "json",
    "css",
    "html",
    "python"
  ]
}`,
      "parentId": "root",
      "x": 400,
      "y": 350,
      "size": 456,
      "lastModified": new Date().toISOString()
    }
  ]
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
    console.log('\n🚀 Visual File System Explorer Server');
    console.log('=====================================');
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Statistics: http://localhost:${PORT}/api/stats`);
    console.log(`🔍 Search: http://localhost:${PORT}/api/search?q=<query>`);
    console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⚠️  Mock Mode'}`);
    console.log(`🔄 Real-time: ✅ Socket.IO enabled`);
    console.log('\n📚 API Endpoints:');
    console.log('  GET    /api/tree                 - Get file system tree');
    console.log('  GET    /api/file/:id             - Get file content');
    console.log('  POST   /api/file/:id             - Save file content');
    console.log('  POST   /api/tree                 - Save entire tree');
    console.log('  POST   /api/node                 - Create new node');
    console.log('  DELETE /api/node/:id             - Delete node');
    console.log('  PATCH  /api/node/:id/position    - Update node position');
    console.log('  GET    /api/search               - Search nodes');
    console.log('  GET    /api/stats                - Get statistics');
    console.log('  GET    /api/health               - Health check');
    console.log('\n💡 Tips:');
    console.log('  - Set MONGODB_URI to enable database persistence');
    console.log('  - Use the frontend at http://localhost:5173');
    console.log('  - Check logs for real-time updates');
    console.log('=====================================\n');
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
