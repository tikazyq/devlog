import React from 'react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any, devlog?: any) => void;
  stats: any;
}

export function Sidebar({ currentView, onViewChange, stats }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'list', label: 'All Devlogs', icon: '📝' },
    { id: 'create', label: 'New Devlog', icon: '➕' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Devlog</h1>
        <p className="text-sm text-gray-600">Development Tracker</p>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as any)}
            className={`w-full text-left px-6 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
              currentView === item.id ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700' : 'text-gray-700'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {stats && (
        <div className="mt-8 px-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Quick Stats
          </h3>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-sm font-medium">{stats.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="text-sm font-medium">{stats.inProgress || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="text-sm font-medium">{stats.completed || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
