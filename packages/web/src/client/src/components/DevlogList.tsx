import React from 'react';

interface DevlogEntry {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface DevlogListProps {
  devlogs: DevlogEntry[];
  loading: boolean;
  onViewDevlog: (devlog: DevlogEntry) => void;
  onDeleteDevlog: (id: string) => void;
}

export function DevlogList({ devlogs, loading, onViewDevlog, onDeleteDevlog }: DevlogListProps) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading devlogs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Devlogs</h1>
          <p className="text-gray-600">{devlogs.length} total entries</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {devlogs.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No devlogs found</p>
            </div>
          ) : (
            devlogs.map((devlog) => (
              <div key={devlog.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => onViewDevlog(devlog)}>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">{devlog.title}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {devlog.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{devlog.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(devlog.status)}`}>
                        {devlog.status}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(devlog.priority)}`}>
                        {devlog.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        Updated {new Date(devlog.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDevlog(devlog)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onDeleteDevlog(devlog.id)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
