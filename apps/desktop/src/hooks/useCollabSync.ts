import { useEffect, useRef } from 'react';
import type { DocumentEnvelope } from '@dansword/core';
import type { CollabSession } from '../components/CollaborationDialog';

const CLIENT_ID = crypto.randomUUID();

interface UseCollabSyncOptions {
  session: CollabSession | null;
  envelope: DocumentEnvelope;
  onRemoteEnvelope: (envelope: DocumentEnvelope) => void;
}

export function useCollabSync({ session, envelope, onRemoteEnvelope }: UseCollabSyncOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const suppressRef = useRef(false);
  const envelopeRef = useRef(envelope);
  envelopeRef.current = envelope;

  useEffect(() => {
    if (!session) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    const ws = new WebSocket(`${session.wsUrl}/${session.roomId}`);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as {
          type: string;
          senderId?: string;
          envelope?: DocumentEnvelope;
        };
        if (msg.type === 'envelope' && msg.senderId !== CLIENT_ID && msg.envelope) {
          suppressRef.current = true;
          onRemoteEnvelope(msg.envelope);
          queueMicrotask(() => {
            suppressRef.current = false;
          });
        }
      } catch {
        /* ignore malformed messages */
      }
    };

    ws.onopen = () => {
      if (session.role === 'host') {
        ws.send(
          JSON.stringify({
            type: 'envelope',
            senderId: CLIENT_ID,
            envelope: envelopeRef.current,
          }),
        );
      }
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [session?.wsUrl, session?.roomId, session?.role, onRemoteEnvelope]);

  useEffect(() => {
    if (!session || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (suppressRef.current) return;

    const timer = window.setTimeout(() => {
      wsRef.current?.send(
        JSON.stringify({
          type: 'envelope',
          senderId: CLIENT_ID,
          envelope,
        }),
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [envelope, session]);
}
