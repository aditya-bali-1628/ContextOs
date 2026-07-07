import { useWorkspace } from '../context/WorkspaceContext';
import GlassCard from '../components/ui/GlassCard';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const { activeWorkspace } = useWorkspace();
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeWorkspace) return;
    api.get(`/api/analytics/stats?workspaceId=${activeWorkspace._id}`)
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to load stats:', err));
  }, [activeWorkspace]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Dashboard {activeWorkspace && `— ${activeWorkspace.name}`}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div onClick={() => navigate('/history/documents')} className="cursor-pointer hover:opacity-80 transition">
          <GlassCard>
            <h3 className="text-lg text-slate-300">Documents</h3>
            <p className="text-3xl font-bold">{stats?.summary?.totalDocuments ?? 0}</p>
          </GlassCard>
        </div>
        <div onClick={() => navigate('/history/activities')} className="cursor-pointer hover:opacity-80 transition">
          <GlassCard>
            <h3 className="text-lg text-slate-300">Total Activities</h3>
            <p className="text-3xl font-bold">{stats?.summary?.totalActivities ?? 0}</p>
          </GlassCard>
        </div>
        <div onClick={() => navigate('/history/chats')} className="cursor-pointer hover:opacity-80 transition">
          <GlassCard>
            <h3 className="text-lg text-slate-300">Chats</h3>
            <p className="text-3xl font-bold">{stats?.summary?.totalChats ?? 0}</p>
          </GlassCard>
        </div>
        <div onClick={() => navigate('/history/searches')} className="cursor-pointer hover:opacity-80 transition">
          <GlassCard>
            <h3 className="text-lg text-slate-300">Searches</h3>
            <p className="text-3xl font-bold">{stats?.summary?.totalSearches ?? 0}</p>
          </GlassCard>
        </div>
        <div onClick={() => navigate('/history/uploads')} className="cursor-pointer hover:opacity-80 transition">
          <GlassCard>
            <h3 className="text-lg text-slate-300">Uploads</h3>
            <p className="text-3xl font-bold">{stats?.summary?.totalUploads ?? 0}</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;