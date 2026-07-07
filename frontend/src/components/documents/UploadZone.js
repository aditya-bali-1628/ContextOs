import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const UploadZone = ({ onUploadComplete, workspaceId }) => {
  const onDrop = useCallback(async (acceptedFiles) => {
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    formData.append('workspaceId', workspaceId);
    try {
      await api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploadComplete();
    } catch (err) {
      console.error(err);
    }
  }, [workspaceId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  return (
    <div
      {...getRootProps()}
      className={`glass p-8 border-dashed border-2 ${
        isDragActive ? 'border-cyan-400' : 'border-white/20'
      } text-center cursor-pointer transition`}
    >
      <input {...getInputProps()} />
      <CloudArrowUpIcon className="w-10 h-10 mx-auto mb-2 text-slate-400" />
      <p className="text-slate-300">Drag & drop a file, or click to browse</p>
      <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, TXT</p>
    </div>
  );
};

export default UploadZone;