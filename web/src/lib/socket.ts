import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket():Socket {
  if(!socket) {
    const token = localStorage.getItem('accessToken');
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: {token},
      transports: ['websocket', 'polling'],
    });
  };
  return socket;
};

export function disconnectSocket() {
  if(socket) {
    socket.disconnect();
    socket = null;
  };
};