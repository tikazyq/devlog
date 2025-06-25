import { useState, useEffect } from 'react';
import { DevlogEntry, DevlogId } from '@devlog/types';

export function useDevlogs() {
  const [devlogs, setDevlogs] = useState<DevlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    
    await fetchDevlogs();
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
    
    await fetchDevlogs();
  };

  const deleteDevlog = async (id: DevlogId) => {
    const response = await fetch(`/api/devlogs/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete devlog');
    }
    
    await fetchDevlogs();
  };

  useEffect(() => {
    fetchDevlogs();
  }, []);

  return {
    devlogs,
    loading,
    error,
    refetch: fetchDevlogs,
    createDevlog,
    updateDevlog,
    deleteDevlog,
  };
}
