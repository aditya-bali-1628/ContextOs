import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const WorkspaceSwitcher = ({ workspaces, activeWorkspace, onSwitch, onCreate }) => {
  const [open, setOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const handleCreate = async () => {
  const name = newWorkspaceName.trim();
  console.log('handleCreate fired, name:', name, 'onCreate type:', typeof onCreate);
  if (name && onCreate) {
    try {
      await onCreate(name);
      console.log('createWorkspace succeeded');
      setNewWorkspaceName('');
      setOpen(false);
    } catch (err) {
      console.error('createWorkspace failed:', err);
    }
  } else {
    console.log('Skipped - name empty or onCreate missing');
  }
};

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm"
      >
        <span>{activeWorkspace ? activeWorkspace.name : 'Select Workspace'}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 rounded-lg shadow-xl border border-white/10 z-50">
          {workspaces.map((ws) => (
            <button
              key={ws._id}
              onClick={() => {
                onSwitch(ws._id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${
                activeWorkspace?._id === ws._id ? 'bg-white/20' : ''
              }`}
            >
              {ws.name}
            </button>
          ))}
          <div className="border-t border-white/5 p-2">
            <input
              className="w-full bg-transparent border border-white/10 rounded p-1 text-xs placeholder-slate-500"
              placeholder="New workspace..."
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;