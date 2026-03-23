import io from "socket.io-client";
import { compressAndEncodeImage } from "./image.js";

type SocketType = ReturnType<typeof io>;

export class SocketService {
    private socket: SocketType | null = null;
    private _isConnected = false;
    private serverUrl = "wss://api.portals.now/";
    private reconnectInterval: number | null = null;
    private nextSlideHandler: () => void;
    private prevSlideHandler: () => void;

    constructor(nextHandler: () => void, prevHandler: () => void) {
        this.nextSlideHandler = nextHandler;
        this.prevSlideHandler = prevHandler;
    }

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
            switch (event) {
                case 'slide.move.next.desktop':
                    this.nextSlideHandler();
                    break;
                case 'slide.move.prev.desktop':
                    this.prevSlideHandler();
                    break;
            }
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

    async emitSlideMovedNext(currentNotes: string, nextNotes: string, slideImageUrl: string, isDefault: boolean = false): Promise<void> {
        let nextPreview = "data:image/jpeg;base64,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";

        if (!isDefault) {
            nextPreview = await compressAndEncodeImage(slideImageUrl);
        }

        const payload = {
            currentNotes,
            nextNotes,
            nextPreview,
        };


        console.log("[Emit] slide.move.next.desktop", payload);
        this.sendMessage("slide.move.next.desktop", payload);
    }
}

