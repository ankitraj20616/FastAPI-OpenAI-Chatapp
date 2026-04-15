import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
}) {
  const { user, logout } = useAuth();
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleRenameStart = (e, conv) => {
    e.stopPropagation();
    setRenameId(conv.id);
    setRenameValue(conv.title);
  };

  const handleRenameSubmit = async () => {
    if (!renameValue.trim()) return;
    try {
      await api.patch(`/conversations/${renameId}`, { title: renameValue.trim() });
      onRename(renameId, renameValue.trim());
    } catch (err) {
      console.error('Rename failed', err);
    } finally {
      setRenameId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/conversations/${deleteId}`);
      onDelete(deleteId);
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleteId(null);
    }
  };

  const initials = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      <aside className="sidebar" id="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">✦</div>
            <span className="sidebar-logo-text">AI Chat</span>
          </div>
        </div>

        {/* New Chat Button */}
        <button id="new-chat-btn" className="new-chat-btn" onClick={onNewChat}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New conversation
        </button>

        {/* Search */}
        <div className="sidebar-search">
          <svg className="sidebar-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="sidebar-search"
            type="text"
            className="sidebar-search-input"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Conversation List */}
        <div className="sidebar-conversations">
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0.5rem' }}>
              {search ? 'No matches found' : 'No conversations yet'}
            </p>
          ) : (
            <>
              <div className="conv-section-label">Recent</div>
              {filtered.map((conv) => (
                <div
                  key={conv.id}
                  className={`conv-item${activeId === conv.id ? ' active' : ''}`}
                  onClick={() => onSelect(conv.id)}
                  id={`conv-${conv.id}`}
                  title={conv.title}
                >
                  <svg className="conv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="conv-title">{conv.title}</span>
                  <div className="conv-actions">
                    <button
                      className="conv-action-btn"
                      onClick={(e) => handleRenameStart(e, conv)}
                      title="Rename"
                      aria-label="Rename conversation"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="conv-action-btn danger"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(conv.id); }}
                      title="Delete"
                      aria-label="Delete conversation"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer / User info */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-email">{user?.email}</div>
            </div>
            <button
              id="logout-btn"
              className="logout-btn"
              onClick={logout}
              title="Logout"
              aria-label="Logout"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Rename Modal */}
      {renameId && (
        <div className="modal-overlay" onClick={() => setRenameId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Rename conversation</h2>
            <input
              id="rename-input"
              type="text"
              className="form-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRenameId(null)}>Cancel</button>
              <button id="rename-confirm-btn" className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.2rem', margin: 0 }} onClick={handleRenameSubmit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete conversation?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button id="delete-confirm-btn" className="btn-danger" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
