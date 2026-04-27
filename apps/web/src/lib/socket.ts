'use client';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    });
  }
  return socket;
}
