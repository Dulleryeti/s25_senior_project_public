// utils/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = "wss://utdesignday.onrender.com";

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
