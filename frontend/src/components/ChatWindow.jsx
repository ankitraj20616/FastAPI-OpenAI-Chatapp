import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const SUGGESTIONS = [
  '✍️ Write me a poem about space',
  '🐍 Explain Python decorators',
  '📊 How does machine learning work?',
  '🌍 Best travel tips for Japan',
];

export default function ChatWindow({ messages, isStreaming, streamingContent, onSuggestion }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="messages-container" id="messages-container">
      {isEmpty ? (
        <div className="empty-state">
          <div className="empty-state-icon">AI</div>
          <h2>How can I help you today?</h2>
          <p>Ask me anything — I can help with writing, coding, analysis, creative tasks, and much more.</p>
          <div className="suggestion-chips">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => onSuggestion?.(s.slice(2).trim())}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isStreaming={false} />
          ))}

          {isStreaming && (
            <MessageBubble
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent || '',
                created_at: null,
              }}
              isStreaming={true}
            />
          )}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
