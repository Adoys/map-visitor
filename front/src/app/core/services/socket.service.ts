import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private readonly socketUrl = 'http://localhost:3000';

  // Subject para cada evento importante
  settingsUpdated$ = new Subject<any>();
  connected$ = new Subject<boolean>();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    if (!this.socket) {
      this.socket = io(this.socketUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connected$.next(true);
    });

    this.socket.on('disconnect', () => {
      this.connected$.next(false);
    });

    this.socket.on('settingsUpdated', (data) => {
      this.settingsUpdated$.next(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión Socket.io:', error);
    });
  }

  emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  reconnect() {
    this.initializeSocket();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
