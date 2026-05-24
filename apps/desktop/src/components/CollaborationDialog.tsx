import { useState } from 'react';

export interface CollabSession {
  wsUrl: string;
  roomId: string;
  role: 'host' | 'join';
}

interface CollaborationDialogProps {
  open: boolean;
  session: CollabSession | null;
  onStartHost: (roomId: string) => Promise<void>;
  onJoin: (wsUrl: string, roomId: string) => void;
  onStop: () => void;
  onClose: () => void;
}

export function CollaborationDialog({
  open,
  session,
  onStartHost,
  onJoin,
  onStop,
  onClose,
}: CollaborationDialogProps) {
  const [roomId, setRoomId] = useState('dansword-room');
  const [joinUrl, setJoinUrl] = useState('ws://127.0.0.1');
  const [joinRoom, setJoinRoom] = useState('dansword-room');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="dialog panel-card" onClick={(e) => e.stopPropagation()}>
        <h2>Collaboration</h2>
        <p className="dialog-hint">
          Host a LAN session or join an existing room. Document changes sync over local WebSocket (no cloud).
        </p>

        {session ? (
          <div className="collab-active">
            <p>
              <strong>{session.role === 'host' ? 'Hosting' : 'Joined'}</strong> room <code>{session.roomId}</code>
            </p>
            <p className="dialog-hint">URL: {session.wsUrl}</p>
            <div className="dialog-actions">
              <button
                className="icon-btn"
                onClick={() => {
                  void navigator.clipboard.writeText(`${session.wsUrl}/${session.roomId}`);
                }}
              >
                Copy invite link
              </button>
              <button
                className="icon-btn primary"
                onClick={() => {
                  onStop();
                }}
              >
                Stop session
              </button>
              <button className="icon-btn" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <>
            <fieldset>
              <legend>Host session</legend>
              <label>
                Room name
                <input value={roomId} onChange={(e) => setRoomId(e.target.value)} />
              </label>
              <button
                className="icon-btn primary"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void onStartHost(roomId.trim() || 'dansword-room').finally(() => setBusy(false));
                }}
              >
                Start hosting
              </button>
            </fieldset>
            <fieldset>
              <legend>Join session</legend>
              <label>
                Server URL
                <input value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="ws://192.168.1.10:PORT" />
              </label>
              <label>
                Room name
                <input value={joinRoom} onChange={(e) => setJoinRoom(e.target.value)} />
              </label>
              <button
                className="icon-btn primary"
                onClick={() => onJoin(joinUrl.trim(), joinRoom.trim() || 'dansword-room')}
              >
                Join
              </button>
            </fieldset>
            <div className="dialog-actions">
              <button className="icon-btn" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
