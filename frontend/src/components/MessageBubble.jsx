import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';

export default function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === 'user';
  const avatar = isUser
    ? '👤'
    : '✦';

  return (
    <div className={`message-row ${message.role}`}>
      <div className={`message-avatar ${message.role}`}>
        {avatar}
      </div>
      <div style={{ maxWidth: '70%' }}>
        <div className={`message-bubble ${message.role}`}>
          {isUser ? (
            <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  return inline ? (
                    <code className={className} {...props}>{children}</code>
                  ) : (
                    <pre>
                      <code className={className} {...props}>{children}</code>
                    </pre>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {isStreaming && (
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '1em',
                background: 'var(--accent-primary)',
                marginLeft: '2px',
                verticalAlign: 'text-bottom',
                animation: 'cursorBlink 0.8s ease-in-out infinite',
              }}
            />
          )}
        </div>
        {message.created_at && !isStreaming && (
          <div className="message-time">
            {format(new Date(message.created_at), 'h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
}
