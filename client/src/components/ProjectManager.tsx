import React, { useState, useEffect } from 'react';
import {
  Plus,
  FolderOpen,
  Calendar,
  Trash2,
  Edit3,
  Search,
} from 'lucide-react';
import { projectAPI } from '../services/api';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  isActive: boolean;
  settings: {
    theme: string;
    layout: string;
    autoSave: boolean;
  };
}

interface ProjectManagerProps {
  onSelectProject: (projectId: string) => void;
  selectedProjectId?: string;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  onSelectProject,
  selectedProjectId
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, ] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectAPI.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      const project = await projectAPI.createProject(newProject);
      setProjects(prev => [project, ...prev]);
      setNewProject({ name: '', description: '' });
      setShowCreateModal(false);
      // Automatically select the new project
      onSelectProject(project.id);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await projectAPI.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      // If deleted project was selected, clear selection
      if (selectedProjectId === projectId) {
        onSelectProject('');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FolderOpen size={24} className="text-white" />
            </div>
           
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-semibold"
          >
            <Plus size={18} className="mr-2" />
            New Project
          </button>
        </div>

        {/* Search and View Controls */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 font-medium hover:bg-gray-50 focus:bg-white focus:shadow-lg"
            />
          </div>

        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-auto p-6">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <FolderOpen size={40} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No projects match "${searchQuery}". Try adjusting your search terms.`
                : 'Create your first project to start building your visual file system explorer'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl group relative ${
                  selectedProjectId === project.id
                    ? 'border-blue-500 shadow-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 transform scale-[1.02]'
                    : 'border-gray-200/60 hover:border-blue-300 hover:bg-white/90'
                } ${viewMode === 'list' ? 'flex items-stretch p-4' : 'p-4'}`}
                onClick={() => onSelectProject(project.id)}
              >
                <div className={`${viewMode === 'list' ? 'flex-1 flex flex-col justify-center' : 'w-full'}`}>
                  {/* Header with title and buttons */}
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-xl shadow-md transition-all duration-300 flex-shrink-0 ${
                        selectedProjectId === project.id
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:text-blue-600'
                      }`}>
                        <FolderOpen size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate mb-1">
                          {project.name}
                        </h3>
                        {selectedProjectId === project.id && (
                          <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            Active Project
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons - positioned absolutely to prevent overflow */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Edit project:', project.id);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Edit project"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided'}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center text-xs text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-lg">
                      <Calendar size={12} className="mr-1.5 text-gray-400" />
                      <span className="font-medium">Updated {formatDate(project.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-0 w-full max-w-lg mx-4 transform transition-all">
            {/* Header */}
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative px-6 py-5 flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
                  <Plus size={24} className="text-white drop-shadow-sm" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white drop-shadow-sm">Create New Project</h2>
                  <p className="text-white/80 text-sm font-medium">Build your visual file system</p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., My Web App, Portfolio Site..."
                    className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 font-medium hover:bg-gray-50 focus:bg-white focus:shadow-lg"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this project is about..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 font-medium hover:bg-gray-50 focus:bg-white focus:shadow-lg resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProject({ name: '', description: '' });
                  }}
                  className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold hover:shadow-md focus:ring-2 focus:ring-gray-300/50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={!newProject.name.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-300/50 focus:outline-none hover:shadow-lg transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  <span className="flex items-center space-x-2">
                    <Plus size={16} />
                    <span>Create Project</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
