# Visual File System Explorer

A modern, interactive project management and file system visualization tool built with React, Node.js, and MongoDB. This application allows you to create multiple projects, each with its own visual canvas where you can organize files and folders in an intuitive drag-and-drop interface.

## 🌟 Features

### Project Management
- **Multi-Project Support**: Create, edit, and manage multiple isolated projects
- **Project Dashboard**: Grid and list view modes for project organization
- **Real-time Updates**: Live synchronization across multiple sessions
- **Project Search**: Quick search functionality to find projects

### Visual File System Canvas
- **Interactive Canvas**: Drag-and-drop file and folder nodes on a visual canvas
- **Hierarchical Structure**: Visual representation of file system relationships
- **Smart Positioning**: Automatic node positioning with manual override capability
- **Expandable Folders**: Click to expand/collapse folder contents
- **Connection Visualization**: Animated connections showing parent-child relationships

### File & Folder Operations
- **CRUD Operations**: Create, read, update, and delete files and folders
- **In-line Editing**: Built-in Monaco code editor with syntax highlighting
- **File Type Detection**: Automatic language detection and appropriate icons
- **Context Menus**: Right-click context menus for quick actions
- **Real-time Persistence**: All changes automatically saved to MongoDB

### Technical Features
- **MongoDB Integration**: Full database persistence with transaction support
- **RESTful API**: Comprehensive REST API for all operations
- **Socket.IO**: Real-time updates and live collaboration
- **Responsive Design**: Works on desktop and mobile devices
- **TypeScript**: Full type safety throughout the application

## 🏗️ Architecture

```
folder-project/
├── client/                 # React Frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── CanvasNew.tsx      # Main canvas component
│   │   │   ├── ProjectManager.tsx  # Project management UI
│   │   │   ├── FileEditor.tsx     # Code editor modal
│   │   │   └── DataLoader.tsx     # Loading states
│   │   ├── store/         # Redux state management
│   │   │   ├── fileSystemSlice.ts
│   │   │   ├── editorSlice.ts
│   │   │   └── index.ts
│   │   ├── services/      # API communication
│   │   │   └── api.ts
│   │   └── types/         # TypeScript definitions
│   │       └── index.ts
│   └── package.json
├── server/                # Node.js Backend
│   ├── index.js          # Express server with MongoDB
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd folder-project
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**

   Create a `.env` file in the server directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/file-system-explorer
   PORT=5000
   ```

   For MongoDB Atlas:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/file-system-explorer
   PORT=5000
   ```

### Running the Application

1. **Start the server**
   ```bash
   cd server
   npm start
   ```
   Server runs on http://localhost:5000

2. **Start the client** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```
   Client runs on http://localhost:5173

## 📚 API Documentation

### Project Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create new project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### File System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:projectId/nodes` | Get file system for project |
| POST | `/api/projects/:projectId/node` | Create node in project |
| POST | `/api/projects/:projectId/tree` | Save entire tree for project |

### Node Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/file/:id` | Get file content |
| POST | `/api/file/:id` | Save file content |
| PATCH | `/api/node/:id/position` | Update node position |
| DELETE | `/api/node/:id` | Delete node and children |

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/search` | Search nodes |
| GET | `/api/stats` | Get statistics |

## 🎯 Usage Guide

### Creating a Project
1. Click "New Project" in the project dashboard
2. Enter project name and description
3. Click "Create Project"
4. The project canvas will open automatically

### Working with Files and Folders
1. **Create**: Right-click on canvas or folder → "New File/Folder"
2. **Edit**: Double-click on files to open the code editor
3. **Move**: Drag nodes to reposition them on canvas
4. **Delete**: Right-click → "Delete" or use the delete button
5. **Organize**: Expand/collapse folders by clicking on them

### Canvas Navigation
- **Zoom**: Use mouse wheel or canvas controls
- **Pan**: Click and drag on empty canvas space
- **Fit View**: Use the fit view control to see all nodes
- **Mini Map**: Use the mini map for navigation in large projects

## 🔧 Technology Stack

### Frontend
- **React 18**: Modern React with hooks and context
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Redux Toolkit**: State management
- **React Flow**: Canvas and node visualization
- **Monaco Editor**: Code editor component
- **Tailwind CSS**: Utility-first CSS framework
- **React Icons**: Icon library
- **Lucide React**: Modern icon system

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Socket.IO**: Real-time communication
- **CORS**: Cross-origin resource sharing

## 🗄️ Database Schema

### Projects Collection
```javascript
{
  id: String,
  name: String,
  description: String,
  createdAt: Date,
  updatedAt: Date,
  owner: String,
  isActive: Boolean,
  settings: {
    theme: String,
    layout: String,
    autoSave: Boolean
  }
}
```

### FileSystemNodes Collection
```javascript
{
  id: String,
  projectId: String,
  type: String, // 'file' | 'folder'
  name: String,
  content: String, // for files only
  parentId: String,
  x: Number,
  y: Number,
  expanded: Boolean, // for folders only
  size: Number,
  lastModified: Date,
  createdAt: Date,
  updatedAt: Date,
  metadata: {
    language: String,
    encoding: String,
    lineCount: Number,
    permissions: String
  }
}
```

## 🔄 Real-time Features

The application supports real-time collaboration through Socket.IO:

- **Live Updates**: Changes are broadcast to all connected clients
- **Node Position Sync**: Real-time position updates when dragging nodes
- **File Content Sync**: Live updates when editing files
- **Project Events**: Real-time notifications for project operations

## 🚀 Deployment

### Server Deployment
1. Set up MongoDB Atlas or self-hosted MongoDB
2. Configure environment variables
3. Deploy to platforms like Heroku, Vercel, or DigitalOcean
4. Update CORS settings for production domain

### Client Deployment
1. Build the client: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, GitHub Pages)
3. Update API base URL in production build

## 🔒 Security Features

- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configurable cross-origin policies
- **Error Handling**: Comprehensive error handling and logging
- **Transaction Support**: Database transactions for data integrity

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in environment variables
   - Verify network connectivity

2. **CORS Errors**
   - Check client and server URLs
   - Verify CORS configuration in server
   - Ensure proper headers are set

3. **File Editor Not Opening**
   - Check file content API endpoints
   - Verify file permissions
   - Check browser console for errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React Flow team for the excellent canvas library
- Monaco Editor team for the code editor
- Tailwind CSS for the styling framework
- The open-source community for various libraries and tools
