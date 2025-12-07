import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameRoom } from './GameRoom';

const app = express();
app.use(cors());
app.use(express.json());

// Simple REST endpoints
app.get('/helloworld', (req, res) => {
    res.send('YEP YEP IT WORKS!');
});

// Discord OAuth token endpoint (keep for Discord integration)
app.post('/token', async (req, res) => {
    try {
        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID || '',
                client_secret: process.env.DISCORD_CLIENT_SECRET || '',
                grant_type: 'authorization_code',
                code: req.body.code,
            }),
        });

        const access_token = await response.json();
        res.send({ access_token });
    } catch (error) {
        res.status(500).send({ error: 'Failed to exchange token' });
    }
});

const server = createServer(app);

// Socket.IO server with CORS configured
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Room management
let currentRoom: GameRoom | null = null;

io.on('connection', (socket) => {
    console.log('New Socket.IO connection:', socket.id);

    // Create new room if none exists or current is full
    if (!currentRoom || !currentRoom.canJoin()) {
        currentRoom = new GameRoom(io);
        console.log('Created new game room');
    }

    // Join the room
    currentRoom.onJoin(socket);

    // Handle player actions
    socket.on('action', (data: { cellIndex: number }) => {
        const room = (socket as any).gameRoom as GameRoom;
        if (room) {
            room.onAction(socket, data.cellIndex);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        const room = (socket as any).gameRoom as GameRoom;
        if (room) {
            room.onLeave(socket);
        }
    });
});

const PORT = process.env.PORT || 2567;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Socket.IO server ready`);
});
