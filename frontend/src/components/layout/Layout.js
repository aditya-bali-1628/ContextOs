import { useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
  // Only phone/tablet need this state. Desktop (md+) always shows the
  // sidebar and has nothing to toggle, so it doesn't touch this state at all.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* md:hidden = this button DISAPPEARS at tablet-landscape/laptop/desktop
          widths and up. It only ever renders on phone + portrait tablet. */}
      <button
        onClick={() => setSidebarOpen(prev => !prev)}
        className="md:hidden fixed top-16 left-4 z-50 p-2 rounded-lg glass-dark text-slate-300 hover:text-white transition"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* No more ternary on sidebarOpen. Content ALWAYS reserves md:ml-64
          on desktop, because the sidebar is always there on desktop —
          full stop, not dependent on any toggle state. */}
      <div className="flex-1 md:ml-64 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-900 to-slate-800">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;