import { useCallback, useRef } from 'react';

/**
 * Custom hook for streaming chat responses via SSE.
 * Uses fetch + ReadableStream for EventSource with auth headers.
 */
export function useStreamChat() {
  const abortRef = useRef(null);

  const sendMessage = useCallback(async ({ convId, content, onToken, onDone, onError }) => {
    // Abort any previous stream
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`/chat/stream/${convId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json();
        onError?.(errData.detail || 'Stream failed');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                onError?.(data.error);
                return;
              }
              if (data.done) {
                onDone?.(data.conversation_title);
                return;
              }
              if (data.token) {
                onToken?.(data.token);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError?.(err.message || 'Connection error');
      }
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, abort };
}
