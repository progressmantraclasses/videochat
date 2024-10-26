// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "https://vitalsyncs.web.app/", // Allow all origins for testing
        methods: ["GET", "POST"]
    },
    pingTimeout: 100000,
});

app.use(cors());

const PORT = process.env.PORT || 5000;

// Handle socket connections
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room with username
    socket.on('join-room', ({ roomID, userName }) => {
        socket.join(roomID);
        console.log(`User ${userName || 'Unknown'} with ID: ${socket.id} joined room: ${roomID}`);
        
        // Notify others in the room that a new user joined
        socket.to(roomID).emit('user-joined', { userName: userName || 'Guest', id: socket.id });
    });

     // Handle message sending
     socket.on('send-message', ({ roomID, message }) => {
        console.log(`Message sent to room ${roomID} by ${message.sender}: ${message.text}`);
        io.to(roomID).emit('receive-message', message); // Broadcast message to all clients in the room
    });

    // Handle call offer
    socket.on('offer', ({ roomID, offer }) => {
        console.log(`Offer received in room ${roomID} from ${socket.id}`);
        socket.to(roomID).emit('offer', { offer, sender: socket.id });
    });

    // Handle answer
    socket.on('answer', ({ roomID, answer }) => {
        console.log(`Answer received in room ${roomID} from ${socket.id}`);
        socket.to(roomID).emit('receive-answer', answer);
    });

    // Handle ICE candidates
    socket.on('ice-candidate', ({ roomID, candidate }) => {
        console.log(`ICE candidate received in room ${roomID} from ${socket.id}`);
        socket.to(roomID).emit('new-ice-candidate', candidate);
    });

    // Handle end call
    socket.on('end-call', ({ roomID }) => {
        console.log(`End call signal received in room ${roomID} from ${socket.id}`);
        socket.to(roomID).emit('call-ended');
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
