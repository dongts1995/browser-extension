import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

export class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.serverUrl = "wss://api.portals.now/";
        this.reconnectInterval = null;
    }

    connect(accessToken, eventId) {
        this.socket = io(this.serverUrl, {
            transports: ["websocket"],
            query: {
                eventId: eventId.toString(),
            },
            auth: {
                token: `Bearer ${accessToken}`,
            },
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        this.socket.on("connect", () => {
            this.isConnected = true;
            console.log("[Socket] Connected");
            clearInterval(this.reconnectInterval);
        });

        this.socket.on("disconnect", (data) => {
            this.isConnected = false;
            console.log("[Socket] Disconnected:", data);
            this.startReconnect();
        });

        this.socket.on("connect_error", (err) => {
            this.isConnected = false;
            console.log("[Socket] Connect error:", err);
            this.startReconnect();
        });

        this.socket.on("error", (err) => {
            this.isConnected = false;
            console.log("[Socket] Error:", err);
            this.startReconnect();
        });

        this.socket.onAny((event, data) => {
            console.log("[Socket] Event:", event, data);
        });
    }

    startReconnect() {
        if (this.reconnectInterval) return;

        this.reconnectInterval = setInterval(() => {
            if (!this.isConnected && this.socket) {
                console.log("[Socket] Reconnecting...");
                this.socket.connect();
            }
        }, 5000);
    }

    sendMessage(event, payload) {
        if (this.isConnected && this.socket) {
            this.socket.emit(event, payload);
            console.log("[Socket] Emit:", event);
        } else {
            console.log("[Socket] Not connected");
            this.startReconnect();
        }
    }
}