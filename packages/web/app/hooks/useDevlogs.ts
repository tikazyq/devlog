import { useEffect, useState } from 'react';
import { DevlogEntry, DevlogId } from '@devlog/types';
import { useServerSentEvents } from './useServerSentEvents';

export function useDevlogs() {
  const [devlogs, setDevlogs] = useState<DevlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connected, subscribe, unsubscribe } = useServerSentEvents();

  const fetchDevlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devlogs');
      if (!response.ok) {
        throw new Error('Failed to fetch devlogs');
      }
      const data = await response.json();
      setDevlogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time event listeners
  useEffect(() => {
    const handleDevlogCreated = (newDevlog: DevlogEntry) => {
      setDevlogs(current => [newDevlog, ...current]);
    };

    const handleDevlogUpdated = (updatedDevlog: DevlogEntry) => {
      setDevlogs(current => 
        current.map(devlog => 
          devlog.id === updatedDevlog.id ? updatedDevlog : devlog
        )
      );
    };

    const handleDevlogDeleted = (deletedData: { id: DevlogId }) => {
      setDevlogs(current => 
        current.filter(devlog => devlog.id !== deletedData.id)
      );
    };

    // Subscribe to real-time events
    subscribe('devlog-created', handleDevlogCreated);
    subscribe('devlog-updated', handleDevlogUpdated);
    subscribe('devlog-deleted', handleDevlogDeleted);

    return () => {
      unsubscribe('devlog-created');
      unsubscribe('devlog-updated');
      unsubscribe('devlog-deleted');
    };
  }, [subscribe, unsubscribe]);

  const createDevlog = async (data: Partial<DevlogEntry>) => {
    const response = await fetch('/api/devlogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create devlog');
    }

    // No need to refetch - the SSE will handle the update
    return await response.json();
  };

  const updateDevlog = async (data: Partial<DevlogEntry> & { id: DevlogId }) => {
    const response = await fetch(`/api/devlogs/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update devlog');
    }

    // No need to refetch - the SSE will handle the update
    return await response.json();
  };

  const deleteDevlog = async (id: DevlogId) => {
    const response = await fetch(`/api/devlogs/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete devlog');
    }

    // No need to refetch - the SSE will handle the update
  };

  useEffect(() => {
    fetchDevlogs();
  }, []);

  return {
    devlogs,
    loading,
    error,
    connected,
    refetch: fetchDevlogs,
    createDevlog,
    updateDevlog,
    deleteDevlog,
  };
}
