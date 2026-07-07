import React, { useEffect, useState, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import UploadZone from '../components/documents/UploadZone';
import DocumentList from '../components/documents/DocumentList';
import api from '../services/api';

const Documents = () => {
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState([]);

  const fetchDocs = useCallback(async () => {
    if (!activeWorkspace) return;
    const { data } = await api.get(`/api/documents?workspaceId=${activeWorkspace._id}`);
    setDocuments(data);
  }, [activeWorkspace]);

  const handleDelete = async (docId, docName) => {
    const confirmed = window.confirm(`Delete "${docName}"? This can't be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d._id !== docId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Documents</h2>

      {!activeWorkspace && (
        <p className="mb-4 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
          Please create or select a workspace before uploading documents.
        </p>
      )}

      <UploadZone
        onUploadComplete={fetchDocs}
        workspaceId={activeWorkspace?._id}
        disabled={!activeWorkspace}
      />

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Uploaded Files</h3>
        <DocumentList documents={documents} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default Documents;