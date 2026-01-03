import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

export class SocketService {
    private static instance: SocketService;
    private io: Server | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public init(httpServer: HttpServer): void {
        const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ["http://localhost:3000"];

        this.io = new Server(httpServer, {
            cors: {
                origin: origins,
                methods: ["GET", "POST"],
                credentials: true,
            },
        });

        this.io.on("connection", (socket: Socket) => {
            console.log("Client connected:", socket.id);

            // User authentication/joining room
            socket.on("join", (userId: string) => {
                if (userId) {
                    console.log(`User ${userId} joined room user:${userId}`);
                    socket.join(`user:${userId}`);
                }
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected:", socket.id);
            });
        });

        // Optional: Socket.io Admin UI
        instrument(this.io, {
            auth: false,
            mode: "development",
        });

        console.log("Socket.io initialized");
    }

    public emitNotification(userId: string, notification: any): void {
        if (this.io) {
            this.io.to(`user:${userId}`).emit("notification", notification);
        } else {
            console.warn("Socket.io not initialized, cannot emit notification");
        }
    }

    public emitToUser(userId: string, event: string, data: any): void {
        if (this.io) {
            this.io.to(`user:${userId}`).emit(event, data);
        } else {
            console.warn("Socket.io not initialized, cannot emit to user");
        }
    }
}
