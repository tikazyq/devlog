import React, { useState } from 'react';

interface DevlogEntry {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  description: string;
  businessContext?: string;
  technicalContext?: string;
  createdAt: string;
  updatedAt: string;
  notes?: Array<{
    id: string;
    note: string;
    category: string;
    timestamp: string;
  }>;
}

interface DevlogDetailsProps {
  devlog: DevlogEntry;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onBack: () => void;
}

export function DevlogDetails({ devlog, onUpdate, onDelete, onBack }: DevlogDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: devlog.title,
    type: devlog.type,
    status: devlog.status,
    priority: devlog.priority,
    description: devlog.description,
    businessContext: devlog.businessContext || '',
    technicalContext: devlog.technicalContext || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ id: devlog.id, ...formData });
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
        >
          <span>←</span>
          <span>Back to List</span>
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="feature">Feature</option>
                  <option value="bugfix">Bug Fix</option>
                  <option value="task">Task</option>
                  <option value="refactor">Refactor</option>
                  <option value="docs">Documentation</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="review">Review</option>
                  <option value="testing">Testing</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{devlog.title}</h1>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(devlog.status)}`}>
                    {devlog.status}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(devlog.priority)}`}>
                    {devlog.priority}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {devlog.type}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                Created: {new Date(devlog.createdAt).toLocaleString()} • 
                Updated: {new Date(devlog.updatedAt).toLocaleString()}
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700">{devlog.description}</p>
              </div>
            </div>

            {devlog.businessContext && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Business Context</h3>
                <p className="text-gray-700">{devlog.businessContext}</p>
              </div>
            )}

            {devlog.technicalContext && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Technical Context</h3>
                <p className="text-gray-700">{devlog.technicalContext}</p>
              </div>
            )}

            {devlog.notes && devlog.notes.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
                <div className="space-y-2">
                  {devlog.notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-700">{note.note}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {note.category} • {new Date(note.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
