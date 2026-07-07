import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '../context/WorkspaceContext';
import api from '../services/api';

const TITLES = {
  documents: 'Documents',
  uploads: 'Upload History',
  chats: 'Chat History',
  searches: 'Search History',
  activities: 'All Activity',
};

const History = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace || !type) return;
    setLoading(true);
    api.get(`/api/analytics/history?workspaceId=${activeWorkspace._id}&type=${type}`)
      .then(res => setItems(res.data.items))
      .catch(err => console.error('Failed to load history:', err))
      .finally(() => setLoading(false));
  }, [activeWorkspace, type]);

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Dashboard
      </button>

      <h2 className="text-2xl font-bold mb-6">{TITLES[type] || 'History'}</h2>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500">No records yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="glass p-4 flex justify-between items-center">
              <div>
                <p className="text-slate-200">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-slate-500 mt-1">{item.subtitle}</p>
                )}
              </div>
              <span className="text-xs text-slate-400 shrink-0 ml-4">
                {new Date(item.date).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;