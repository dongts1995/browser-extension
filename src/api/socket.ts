import io from "socket.io-client";
import { compressAndEncodeImage } from "./image.js";

type SocketType = ReturnType<typeof io>;

export class SocketService {
    private socket: SocketType | null = null;
    private _isConnected = false;
    private serverUrl = "wss://api.portals.now/";
    private reconnectInterval: number | null = null;

    public get isConnected() {
        return this._isConnected;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this._isConnected = false;
        if (this.reconnectInterval !== null) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }

    connect(accessToken: string, eventId: string | number) {
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
            this._isConnected = true;
            console.log("[Socket] Connected");
            if (this.reconnectInterval !== null) {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
            }
        });

        this.socket.on("disconnect", (reason: string) => {
            this._isConnected = false;
            console.log("[Socket] Disconnected:", reason);
            this.startReconnect();
        });

        this.socket.on("connect_error", (err: unknown) => {
            this._isConnected = false;
            console.log("[Socket] Connect error:", err);
            this.startReconnect();
        });

        this.socket.on("error", (err: unknown) => {
            this._isConnected = false;
            console.log("[Socket] Error:", err);
            this.startReconnect();
        });

        // socket.io v4 provides `onAny`, but the bundled types here do not include it.
        // Cast to any to keep runtime behavior while satisfying TypeScript.
        (this.socket as any).onAny((event: string, ...data: unknown[]) => {
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

    sendMessage(event: string, payload: unknown) {
        if (this._isConnected && this.socket) {
            this.socket.emit(event, payload);
            console.log("[Socket] Emit:", event);
        } else {
            console.log("[Socket] Not connected");
            this.startReconnect();
        }
    }

    async emitSlideMovedNext(currentNotes: string, nextNotes: string, slideImageUrl: string): Promise<void> {
        const nextPreview = await compressAndEncodeImage(slideImageUrl);

        const payload = {
            currentNotes,
            nextNotes,
            nextPreview,
        };

        console.log("[Emit] slide.move.next.desktop", payload);
        this.sendMessage("slide.move.next.desktop", payload);
    }
}

