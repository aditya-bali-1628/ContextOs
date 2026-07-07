import { useRef, useState, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const useStreamChat = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef(null);

  const startStream = useCallback((query, workspaceId, onToken, onClose) => {
    return new Promise((resolve, reject) => {
      setIsStreaming(true);

      // BUG FIX: EventSource does not support custom headers.
      // Pass JWT as a query param instead — backend auth middleware now reads req.query.token.
      const token = localStorage.getItem('token');

      // BUG FIX: EventSource resolves relative URLs against the page's own origin
      // (e.g. http://localhost:3000 in dev), NOT against the axios baseURL.
      // Must build an absolute URL pointing at the actual backend, same as api.js.
      const url = `${API_BASE}/api/chat/stream?query=${encodeURIComponent(query)}&workspaceId=${workspaceId}&token=${encodeURIComponent(token || '')}`;

      const eventSource = new EventSource(url);

      eventSource.onmessage = (e) => {
        if (e.data === '[DONE]') {
          eventSource.close();
          setIsStreaming(false);
          onClose();
          resolve();
        } else {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed.error) {
              eventSource.close();
              setIsStreaming(false);
              reject(parsed.error);
            } else {
              onToken(parsed.token || '');
            }
          } catch {
            onToken(e.data);
          }
        }
      };

      eventSource.onerror = (err) => {
        eventSource.close();
        setIsStreaming(false);
        reject(err);
      };

      eventSourceRef.current = eventSource;
    });
  }, []);

  return { startStream, isStreaming };
};

export default useStreamChat;