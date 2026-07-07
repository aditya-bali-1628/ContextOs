import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import api from '../services/api';
import SearchResult from '../components/search/SearchResult';
import { MagnifyingGlassIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';

const Search = () => {
  const { activeWorkspace } = useWorkspace();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = useCallback(() => {
    if (!activeWorkspace) return;
    api.get(`/api/search/history?workspaceId=${activeWorkspace._id}`)
      .then(res => setHistory(res.data))
      .catch(err => console.error('Failed to load search history:', err));
  }, [activeWorkspace]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || !activeWorkspace) return;
    setLoading(true);
    try {
      const { data } = await api.post('/api/search', {
        query,
        workspaceId: activeWorkspace._id,
      });
      setResult(data);
      fetchHistory(); // refresh the list so this search shows up right away
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    const confirmed = window.confirm('Clear all search history? This can\'t be undone.');
    if (!confirmed) return;
    try {
      await api.delete(`/api/search/history?workspaceId=${activeWorkspace._id}`);
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const openPastSearch = (entry) => {
    setQuery(entry.query);
    setResult({ answer: entry.answer, sources: entry.sources });
    setShowHistory(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">AI Search</h2>
        <button
          onClick={() => setShowHistory(prev => !prev)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ClockIcon className="w-4 h-4" />
          {showHistory ? 'Hide History' : 'Search History'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything across your workspace..."
            className="w-full pl-10 pr-4 py-3 rounded-lg glass text-white placeholder-slate-400 focus:outline-none"
          />
        </div>
        <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold disabled:opacity-50" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {showHistory && (
        <div className="glass p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">Past Searches</h3>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition"
              >
                <TrashIcon className="w-4 h-4" />
                Clear History
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-slate-500 text-sm">No past searches yet.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {history.map((entry) => (
                <button
                  key={entry._id}
                  onClick={() => openPastSearch(entry)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition text-sm text-slate-300"
                >
                  <p className="truncate">{entry.query}</p>
                  <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {result && (
        <div>
          <div className="glass p-6 mb-4">
            <p className="text-slate-300 whitespace-pre-wrap">{result.answer}</p>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Sources</h3>
          <div className="space-y-2">
            {result.sources.map((src, i) => (
              <SearchResult key={i} source={src} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;