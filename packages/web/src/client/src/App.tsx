import React, { useState, useEffect } from 'react';
import { DevlogEntry, DevlogStats } from '@devlog/types';
import { Dashboard } from './components/Dashboard';
import { DevlogList } from './components/DevlogList';
import { DevlogForm } from './components/DevlogForm';
import { DevlogDetails } from './components/DevlogDetails';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { useDevlogs } from './hooks/useDevlogs';
import { useWebSocket } from './hooks/useWebSocket';

type View = 'dashboard' | 'list' | 'create' | 'details';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDevlog, setSelectedDevlog] = useState<DevlogEntry | null>(null);
  const [stats, setStats] = useState<DevlogStats | null>(null);
  
  const { devlogs, loading, error, refetch, createDevlog, updateDevlog, deleteDevlog } = useDevlogs();
  const { connected } = useWebSocket();

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/devlogs/stats/overview');
        if (response.ok) {
          const statsData = await response.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [devlogs]);

  const handleViewChange = (view: View, devlog?: DevlogEntry) => {
    setCurrentView(view);
    setSelectedDevlog(devlog || null);
  };

  const handleDevlogCreate = async (data: any) => {
    try {
      await createDevlog(data);
      setCurrentView('list');
    } catch (error) {
      console.error('Failed to create devlog:', error);
    }
  };

  const handleDevlogUpdate = async (data: any) => {
    try {
      await updateDevlog(data);
      if (selectedDevlog) {
        // Refresh the selected devlog
        const updated = devlogs.find(d => d.id === selectedDevlog.id);
        setSelectedDevlog(updated || null);
      }
    } catch (error) {
      console.error('Failed to update devlog:', error);
    }
  };

  const handleDevlogDelete = async (id: string) => {
    try {
      await deleteDevlog(id);
      if (selectedDevlog?.id === id) {
        setCurrentView('list');
        setSelectedDevlog(null);
      }
    } catch (error) {
      console.error('Failed to delete devlog:', error);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={stats}
            recentDevlogs={devlogs.slice(0, 5)}
            onViewDevlog={(devlog) => handleViewChange('details', devlog)}
          />
        );
      case 'list':
        return (
          <DevlogList 
            devlogs={devlogs}
            loading={loading}
            onViewDevlog={(devlog) => handleViewChange('details', devlog)}
            onDeleteDevlog={handleDevlogDelete}
          />
        );
      case 'create':
        return (
          <DevlogForm 
            onSubmit={handleDevlogCreate}
            onCancel={() => setCurrentView('list')}
          />
        );
      case 'details':
        return selectedDevlog ? (
          <DevlogDetails 
            devlog={selectedDevlog}
            onUpdate={handleDevlogUpdate}
            onDelete={() => handleDevlogDelete(selectedDevlog.id)}
            onBack={() => setCurrentView('list')}
          />
        ) : (
          <div>Devlog not found</div>
        );
      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentView={currentView}
        onViewChange={handleViewChange}
        stats={stats}
      />
      <div className="flex-1 flex flex-col">
        <Header 
          connected={connected}
          onRefresh={refetch}
        />
        <main className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

export default App;
