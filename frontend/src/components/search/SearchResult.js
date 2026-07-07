import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SearchResult = ({ source }) => (
  <div className="glass p-3 text-sm flex justify-between items-start gap-3">
    <div className="flex-1">
      <p className="text-cyan-400">{source.source}</p>
      <p className="text-slate-400">{source.excerpt}...</p>
    </div>
    {source.fileName && (
      <a
        href={`${API_BASE}/uploads/${source.fileName}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition text-xs shrink-0 mt-0.5"
        title="Open original file"
      >
        Open
        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
      </a>
    )}
  </div>
);
export default SearchResult;