import io from 'socket.io-client';
export class SocketService {
    constructor() {
        this._socket = null;
        this._isConnected = false;
        this._reconnectTimer = null;
        this._serverUrl = 'wss://api.portals.now/';
        this._connectionListeners = new Set();
        this._messageListeners = new Set();
    }
    get isConnected() {
        return this._isConnected;
    }
    addConnectionListener(listener) {
        this._connectionListeners.add(listener);
    }
    removeConnectionListener(listener) {
        this._connectionListeners.delete(listener);
    }
    addMessageListener(listener) {
        this._messageListeners.add(listener);
    }
    removeMessageListener(listener) {
        this._messageListeners.delete(listener);
    }
    _emitConnection(connected) {
        this._connectionListeners.forEach((l) => l(connected));
    }
    _emitMessage(message) {
        this._messageListeners.forEach((l) => l(message));
    }
    _initSocket(accessToken, eventId) {
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
        this._socket.on('disconnect', (data) => {
            this._isConnected = false;
            this._emitConnection(false);
            console.log(`[Socket] Disconnected for event ${eventId}:`, data);
            this._startReconnect();
        });
        this._socket.on('connect_error', (error) => {
            this._isConnected = false;
            this._emitConnection(false);
            console.log(`[Socket] Connect error for event ${eventId}:`, error);
            this._startReconnect();
        });
        this._socket.on('error', (error) => {
            this._isConnected = false;
            this._emitConnection(false);
            console.log(`[Socket] General error for event ${eventId}:`, error);
            this._startReconnect();
        });
        this._socket.on('exception', (data) => {
            this._emitMessage({ event: 'exception', data: data || {} });
            console.log('[Socket] Exception:', data);
        });
        this._socket.onAny((event, data) => {
            this._emitMessage({ event, data: data || {} });
            console.log('[Socket] Event:', event);
        });
    }
    async connect(accessToken, eventId) {
        await this.disconnect();
        this._initSocket(accessToken, eventId);
        this._socket.connect();
        console.log(`[Socket] Attempting connection for event ${eventId}`);
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(false);
            }, 10000);
            const onConnected = (connected) => {
                if (connected) {
                    clearTimeout(timeout);
                    this.removeConnectionListener(onConnected);
                    resolve(true);
                }
            };
            this.addConnectionListener(onConnected);
        });
    }
    async disconnect() {
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
    _startReconnect() {
        if (this._reconnectTimer)
            return;
        this._reconnectTimer = setInterval(() => {
            if (!this._isConnected && this._socket) {
                console.log('[Socket] Attempting to reconnect...');
                this._socket.connect();
            }
        }, 5000);
    }
    sendMessage(event, data) {
        if (this._isConnected && this._socket) {
            this._socket.emit(event, data);
            console.log('[Socket] Emitted event:', event);
        }
        else {
            console.log('[Socket] Not connected. Event not sent:', event);
            this._startReconnect();
        }
    }
    dispose() {
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
