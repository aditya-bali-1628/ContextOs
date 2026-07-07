import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  // BUG FIX: remove activeWorkspace from deps — it caused an infinite re-render loop
  // because fetchWorkspaces changed whenever activeWorkspace changed, which re-triggered the effect.
  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    const { data } = await api.get('/api/workspaces');
    setWorkspaces(data);
    // Only set active workspace on first load (when none is set yet)
    setActiveWorkspace(prev => prev ?? (data.length > 0 ? data[0] : null));
  }, [user]); // removed activeWorkspace from deps

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const switchWorkspace = async (workspaceId) => {
    await api.put(`/api/workspaces/switch/${workspaceId}`);
    const newActive = workspaces.find(w => w._id === workspaceId);
    setActiveWorkspace(newActive);
  };

  const createWorkspace = async (name) => {
    try {
      const { data } = await api.post('/api/workspaces', { name });
      setWorkspaces(prev => [...prev, data]);
      setActiveWorkspace(data);
    } catch (error) {
      console.error('Create workspace error:', error.response?.data || error.message);
      throw error;
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces, activeWorkspace, switchWorkspace, createWorkspace, fetchWorkspaces
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
