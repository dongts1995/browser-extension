import io from 'socket.io-client';

export type SocketEventMessage = {
    event: string;
    data: any;
};

export type SocketConnectionListener = (connected: boolean) => void;
export type SocketMessageListener = (message: SocketEventMessage) => void;

export class SocketService {
    private _socket: any = null;
    private _isConnected = false;
    private _reconnectTimer: number | null = null;

    private readonly _serverUrl = 'wss://api.portals.now/';

    private _connectionListeners = new Set<SocketConnectionListener>();
    private _messageListeners = new Set<SocketMessageListener>();

    get isConnected(): boolean {
        return this._isConnected;
    }

    addConnectionListener(listener: SocketConnectionListener): void {
        this._connectionListeners.add(listener);
    }

    removeConnectionListener(listener: SocketConnectionListener): void {
        this._connectionListeners.delete(listener);
    }

    addMessageListener(listener: SocketMessageListener): void {
        this._messageListeners.add(listener);
    }

    removeMessageListener(listener: SocketMessageListener): void {
        this._messageListeners.delete(listener);
    }

    private _emitConnection(connected: boolean): void {
        this._connectionListeners.forEach((l) => l(connected));
    }

    private _emitMessage(message: SocketEventMessage): void {
        this._messageListeners.forEach((l) => l(message));
    }

    private _initSocket(accessToken: string, eventId: number): void {
        this._socket = io(this._serverUrl, {
            transports: ['websocket'],
            query: { eventId: eventId.toString() },
            auth: { token: `Bearer ${accessToken}` },
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        this._socket.on('connect', () => {
            this._isConnected = true;
            this._emitConnection(true);
            if (this._reconnectTimer) {
                clearInterval(this._reconnectTimer);
                this._reconnectTimer = null;
            }
            console.log(`[Socket] Connected to server for event ${eventId}`);
        });

        this._socket.on('disconnect', (data: any) => {
            this._isConnected = false;
            this._emitConnection(false);
            console.log(`[Socket] Disconnected for event ${eventId}:`, data);
            this._startReconnect();
        });

        this._socket.on('connect_error', (error: any) => {
            this._isConnected = false;
            this._emitConnection(false);
            console.log(`[Socket] Connect error for event ${eventId}:`, error);
            this._startReconnect();
        });

        this._socket.on('error', (error: any) => {
            this._isConnected = false;
            this._emitConnection(false);
            console.log(`[Socket] General error for event ${eventId}:`, error);
            this._startReconnect();
        });

        this._socket.on('exception', (data: any) => {
            this._emitMessage({ event: 'exception', data: data || {} });
            console.log('[Socket] Exception:', data);
        });

        this._socket.onAny((event: string, data: any) => {
            this._emitMessage({ event, data: data || {} });
            console.log('[Socket] Event:', event);
        });
    }

    async connect(accessToken: string, eventId: number): Promise<boolean> {
        await this.disconnect();

        this._initSocket(accessToken, eventId);
        this._socket!.connect();
        console.log(`[Socket] Attempting connection for event ${eventId}`);

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(false);
            }, 10000);

            const onConnected = (connected: boolean) => {
                if (connected) {
                    clearTimeout(timeout);
                    this.removeConnectionListener(onConnected);
                    resolve(true);
                }
            };

            this.addConnectionListener(onConnected);
        });
    }

    async disconnect(): Promise<void> {
        if (this._socket && this._isConnected) {
            this._socket.disconnect();
            this._isConnected = false;
            this._emitConnection(false);
            console.log('[Socket] Disconnected manually');
        }
        if (this._reconnectTimer) {
            clearInterval(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        this._socket = null;
    }

    private _startReconnect(): void {
        if (this._reconnectTimer) return;

        this._reconnectTimer = setInterval(() => {
            if (!this._isConnected && this._socket) {
                console.log('[Socket] Attempting to reconnect...');
                this._socket.connect();
            }
        }, 5000);
    }

    sendMessage(event: string, data: Record<string, any>): void {
        if (this._isConnected && this._socket) {
            this._socket.emit(event, data);
            console.log('[Socket] Emitted event:', event);
        } else {
            console.log('[Socket] Not connected. Event not sent:', event);
            this._startReconnect();
        }
    }

    dispose(): void {
        if (this._reconnectTimer) {
            clearInterval(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        if (this._socket) {
            this._socket.disconnect();
            this._socket = null;
        }
        this._connectionListeners.clear();
        this._messageListeners.clear();
        console.log('[Socket] Disposed');
    }
}