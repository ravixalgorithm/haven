'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/auth';
import { toast } from 'sonner';
import { API_URL, SOCKET_URL } from '@/lib/config';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = getToken();
        let socketInstance: Socket | null = null;

        // Only connect if we have a token (or maybe purely public connection is fine, but we need auth for specific notifications)
        // Actually, we want to join the user room. The server doesn't auth handshake automatically unless we send token.
        // But my server implementation listens to 'join' event with userId.
        // I need the user ID. I can decode token or fetch 'me'.
        // For now, let's just connect and if we have a token, we emit 'join'.

        if (typeof window !== "undefined") {
            const socketUrl = SOCKET_URL;
            socketInstance = io(socketUrl, {
                withCredentials: true,
                autoConnect: false, // Wait until we are ready
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected:', socketInstance?.id);
                setIsConnected(true);
            });

            socketInstance.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            socketInstance.on('notification', (data: any) => {
                console.log('New notification:', data);
                // Trigger toast
                toast(data.message, {
                    description: `${data.actor.username} ${data.message}`,
                    action: {
                        label: 'View',
                        onClick: () => window.location.href = '/notifications' // Or specific link
                    },
                    // Custom component or styling can be added here
                });
            });

            // The socket is now configured to autoConnect: true, so no explicit connect() call is needed here.
            setSocket(socketInstance);
        }

        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, []);

    // Effect to join user room once we know the user ID
    // We need a way to get current user ID here.
    // Ideally we would have a UserContext or AuthContext.
    // For now, I'll cheat and fetch /me or decode token if possible, OR
    // I relies on the layout to pass user, but this is a provider.
    // Let's assume we can fetch 'me' or just payload from token.
    // Actually, the previous code `NotificationDropdown` fetches unread count.

    // Better approach: When the user logs in, or we have a confirmed session, we emit 'join'.
    // Since I don't have a global AuthContext available right now (didn't check), 
    // I can fetch /me inside here if token exists.

    useEffect(() => {
        const joinRoom = async () => {
            const token = getToken();
            if (token && socket && isConnected) {
                try {
                    // We need the user ID.
                    // Decode token or fetch me. Fetch me is safer.
                    const res = await fetch(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        socket.emit('join', data.data.id);
                    }
                } catch (e) {
                    console.error("Failed to join socket room", e);
                }
            }
        };

        joinRoom();
    }, [socket, isConnected]);


    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
