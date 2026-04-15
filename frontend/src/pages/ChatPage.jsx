import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import api from '../api/axios';
import { useStreamChat } from '../hooks/useStreamChat';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [loadingConv, setLoadingConv] = useState(false);

  const { sendMessage } = useStreamChat();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Load conversations failed', err);
    }
  };

  const handleSelectConversation = async (convId) => {
    if (convId === activeConvId) return;
    setActiveConvId(convId);
    setMessages([]);
    setLoadingConv(true);
    try {
      const res = await api.get(`/conversations/${convId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Load conversation failed', err);
    } finally {
      setLoadingConv(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await api.post('/conversations', { title: 'New Conversation' });
      const newConv = res.data;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error('New conversation failed', err);
    }
  };

  const handleSend = useCallback(async (content) => {
    if (!activeConvId) {
      // Auto-create conversation if none selected
      try {
        const res = await api.post('/conversations', { title: 'New Conversation' });
        const newConv = res.data;
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setTimeout(() => doSend(newConv.id, content), 100);
      } catch (err) {
        console.error('Auto-create conversation failed', err);
      }
      return;
    }
    doSend(activeConvId, content);
  }, [activeConvId]);

  const doSend = async (convId, content) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      conversation_id: convId,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent('');

    await sendMessage({
      convId,
      content,
      onToken: (token) => {
        setStreamingContent((prev) => prev + token);
      },
      onDone: (title) => {
        setIsStreaming(false);
        const assistantMsg = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: streamingContentRef.current,
          created_at: new Date().toISOString(),
          conversation_id: convId,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent('');

        // Update conversation title in sidebar
        if (title) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId ? { ...c, title, updated_at: new Date().toISOString() } : c
            )
          );
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        console.error('Stream error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ Error: ${err}`,
            created_at: new Date().toISOString(),
            conversation_id: convId,
          },
        ]);
        setStreamingContent('');
      },
    });
  };

  // Ref to capture latest streamingContent inside onDone closure
  const streamingContentRef = useRef('');
  useEffect(() => {
    streamingContentRef.current = streamingContent;
  }, [streamingContent]);

  const handleDelete = (convId) => {
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const handleRename = (convId, newTitle) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
    );
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="chat-layout">
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDelete}
        onRename={handleRename}
      />

      <main className="chat-main">
        {/* Header */}
        <div className="chat-header">
          {activeConv ? (
            <h1 className="chat-header-title">{activeConv.title}</h1>
          ) : (
            <h1 className="chat-header-title" style={{ color: 'var(--text-muted)' }}>
              Select or create a conversation
            </h1>
          )}
          <span className="chat-header-model">gpt-4o-mini</span>
        </div>

        {/* Messages */}
        {loadingConv ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : activeConv ? (
          <>
            <ChatWindow
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              onSuggestion={(text) => handleSend(text)}
            />
            <MessageInput
              onSend={handleSend}
              disabled={loadingConv}
              isStreaming={isStreaming}
            />
          </>
        ) : (
          <div className="no-conv-selected">
            <div className="no-conv-icon">💬</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Select a conversation
            </h2>
            <p style={{ fontSize: '0.85rem' }}>
              Choose from the sidebar or create a new conversation to get started.
            </p>
            <button id="start-chat-btn" className="btn-primary" style={{ width: 'auto', padding: '0.7rem 1.5rem', marginTop: '0.5rem' }} onClick={handleNewChat}>
              Start new chat
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
