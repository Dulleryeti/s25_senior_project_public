// utils/socket.js
import { io } from "socket.io-client";


let socket;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, { transports: ["websocket"] });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        console.log("Disconnected from WebSocket");
        socket = null;
    }
};
