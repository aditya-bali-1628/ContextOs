import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import useStreamChat from '../hooks/useStreamChat';
import api from '../services/api';

const Chat = () => {
  const { activeWorkspace } = useWorkspace();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const chatEndRef = useRef(null);
  const { startStream, isStreaming } = useStreamChat();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // Load persisted history whenever the active workspace changes (including
  // on first mount) so messages survive navigating to another page and back.
  useEffect(() => {
    if (!activeWorkspace) return;
    setLoadingHistory(true);
    api.get(`/api/chat/history?workspaceId=${activeWorkspace._id}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error('Failed to load chat history:', err))
      .finally(() => setLoadingHistory(false));
  }, [activeWorkspace]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeWorkspace) return;
    const userMsg = { role: 'user', content: input };
    setInput('');

    // Stream response
    const assistantMsg = {
      role: "assistant",
      content: "",
    };

    setMessages(prev => [
      ...prev,
      userMsg,
      assistantMsg,
    ]);

    const onToken = (token) => {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content += token;
        return updated;
      });
    };

    const onClose = () => {
      // stream finished
    };

    try {
      await startStream(input, activeWorkspace._id, onToken, onClose);
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = typeof err === 'string' ? err : 'Something went wrong. Please try again in a moment.';
        return updated;
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">AI Chat</h2>
        <span className="text-xs text-slate-500">Messages are kept for 30 days</span>
      </div>
      <div className="flex-1 overflow-y-auto glass p-4 mb-4 space-y-4">
        {loadingHistory ? (
          <p className="text-slate-500 text-sm">Loading conversation...</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'glass'
                }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        className="flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your documents..."
          className="flex-1 p-3 rounded-xl glass text-white placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 disabled:opacity-50"
        >
          <PaperAirplaneIcon className="w-5 h-5 rotate-90" />
        </button>
      </form>
    </div>
  );
};

export default Chat;