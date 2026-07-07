import { TrashIcon } from '@heroicons/react/24/outline';

const DocumentList = ({ documents, onDelete }) => {
  if (!documents.length) return <p className="text-slate-500">No documents uploaded yet.</p>;
  return (
    <div className="space-y-2">
      {documents.map(doc => (
        <div key={doc._id} className="glass p-3 flex justify-between items-center">
          <span>{doc.originalName}</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
            <button
              onClick={() => onDelete(doc._id, doc.originalName)}
              className="text-slate-400 hover:text-red-400 transition"
              title="Delete document"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
export default DocumentList;