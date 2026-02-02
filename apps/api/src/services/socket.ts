import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '../config';

class SocketService {
    private io: SocketIOServer | null = null;

    public init(server: HTTPServer): SocketIOServer {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: config.corsOrigins || '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            pingTimeout: 60000,
        });

        this.io.on('connection', (socket: Socket) => {
            console.log(`Socket connected: ${socket.id}`);

            // Join a project room
            socket.on('join_project', (projectId: string) => {
                socket.join(`project:${projectId}`);
                console.log(`Socket ${socket.id} joined project room: project:${projectId}`);
            });

            // Leave a project room
            socket.on('leave_project', (projectId: string) => {
                socket.leave(`project:${projectId}`);
                console.log(`Socket ${socket.id} left project room: project:${projectId}`);
            });

            // Join a user room (for My Tasks etc)
            socket.on('join_user', (userId: string) => {
                socket.join(`user:${userId}`);
                console.log(`Socket ${socket.id} joined user room: user:${userId}`);
            });

            // Leave a user room
            socket.on('leave_user', (userId: string) => {
                socket.leave(`user:${userId}`);
                console.log(`Socket ${socket.id} left user room: user:${userId}`);
            });

            socket.on('disconnect', () => {
                console.log(`Socket disconnected: ${socket.id}`);
            });
        });

        return this.io;
    }

    public getIO(): SocketIOServer {
        if (!this.io) {
            throw new Error('Socket.io not initialized. Call init() first.');
        }
        return this.io;
    }

    /**
     * Emit an event to a specific project room
     */
    public emitToProject(projectId: string, event: string, data: any): void {
        if (this.io) {
            this.io.to(`project:${projectId}`).emit(event, data);
        }
    }

    /**
     * Emit an event to a specific user (global)
     */
    public emitToUser(userId: string, event: string, data: any): void {
        if (this.io) {
            // Assuming users are joined to a room named by their userId
            this.io.to(`user:${userId}`).emit(event, data);
        }
    }
}

export const socketService = new SocketService();
