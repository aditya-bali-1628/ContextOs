import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import {
  HomeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace } = useWorkspace();

  return (
    <>
      {/* Backdrop — only on mobile/tablet (below md), since on desktop the
          sidebar is permanently docked, not an overlay. */}
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* md:translate-x-0 + md:static forces the sidebar to ALWAYS show on
          laptop/desktop, regardless of isOpen. The collapse toggle (isOpen)
          only applies below md (phone/tablet). This is the critical line —
          without it, isOpen governs every breakpoint. */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 glass-dark flex flex-col p-4 space-y-6 z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
      >
        <div className="flex items-center justify-between pl-10 md:pl-0">
          <div className="text-xl font-bold text-white tracking-tight">ContextOS</div>
          {/* Close button — only needed on phone/tablet; desktop never
              hides the sidebar so there's nothing to close there. */}
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onSwitch={switchWorkspace}
          onCreate={createWorkspace}
        />
        <nav className="flex flex-col space-y-2 flex-1">
          <NavItem to="/" icon={<HomeIcon className="w-5 h-5" />} label="Dashboard" onNavigate={onClose} />
          <NavItem to="/documents" icon={<DocumentTextIcon className="w-5 h-5" />} label="Documents" onNavigate={onClose} />
          <NavItem to="/search" icon={<MagnifyingGlassIcon className="w-5 h-5" />} label="AI Search" onNavigate={onClose} />
          <NavItem to="/chat" icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />} label="Chat" onNavigate={onClose} />
        </nav>
        <button
          onClick={logout}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
};

const NavItem = ({ to, icon, label, onNavigate }) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      `flex items-center space-x-3 p-2 rounded-lg transition ${
        isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default Sidebar;