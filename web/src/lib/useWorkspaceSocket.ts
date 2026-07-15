'use client';

import { useEffect, useState } from 'react';
import { getSocket } from './socket';
import type { Socket } from 'socket.io-client';

export function useWorkspaceSocket(workspaceId: string | undefined) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const s = getSocket();
    setSocket(s);

    function joinWorkspace() {
      s.emit('workspace:join', workspaceId);
    }

    if (s.connected) {
      joinWorkspace();
    } else {
      s.on('connect', joinWorkspace);
    }

    return () => {
      s.emit('workspace:leave', workspaceId);
      s.off('connect', joinWorkspace);
    };
  }, [workspaceId]);

  return socket;
}