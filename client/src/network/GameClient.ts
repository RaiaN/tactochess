// Socket.IO-based game client
import { io, Socket } from 'socket.io-client';
import { Cell } from '../state/Cell';
import { Player } from '../state/Player';
import { GameState, createInitialState } from '../state/State';

// Event callbacks
export interface GameClientCallbacks {
    onPlayerJoined?: (player: Player, totalPlayers: number, isLocalPlayer: boolean) => void;
    onGameStart?: (cells: Cell[], currentTurn: number, myPlayerId: number) => void;
    onCellSelected?: (cellIndex: number, previousCellIndex: number) => void;
    onPieceMoved?: (fromCellIndex: number, toCellIndex: number) => void;
    onPieceAttacked?: (fromCellIndex: number, targetCellIndex: number) => void;
    onTurnChanged?: (playerId: number) => void;
    onGameOver?: (winnerId: number) => void;
    onError?: (message: string) => void;
    onDisconnect?: () => void;
}

export class GameClient {
    private socket: Socket | null = null;
    private state: GameState;
    private socketId: string = '';
    private myPlayerId: number = -1;
    private callbacks: GameClientCallbacks = {};

    constructor() {
        this.state = createInitialState();
    }

    async connect(serverUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                console.log('Connected to server');
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.callbacks.onDisconnect?.();
            });

            // Set up event listeners
            this.setupEventListeners();
        });
    }

    private setupEventListeners(): void {
        if (!this.socket) return;

        this.socket.on('welcome', (data: { socketId: string; playerId: number }) => {
            this.socketId = data.socketId;
            this.myPlayerId = data.playerId;
            console.log('Welcome! Socket ID:', this.socketId, 'Player ID:', this.myPlayerId);
        });

        this.socket.on('playerJoined', (data: { player: Player; totalPlayers: number }) => {
            this.state.players.set(data.player.socketId, data.player);
            const isLocalPlayer = data.player.socketId === this.socketId;
            console.log('Player joined:', data.player, 'IsLocal:', isLocalPlayer);
            this.callbacks.onPlayerJoined?.(data.player, data.totalPlayers, isLocalPlayer);
        });

        this.socket.on('gameStart', (data: { cells: Cell[]; currentTurn: number; yourPlayerId: number }) => {
            this.state.cells = data.cells;
            this.state.currentTurn = data.currentTurn;
            this.myPlayerId = data.yourPlayerId;
            console.log('Game started! My ID:', this.myPlayerId, 'First turn:', data.currentTurn);
            this.callbacks.onGameStart?.(data.cells, data.currentTurn, data.yourPlayerId);
        });

        this.socket.on('cellSelected', (data: { cellIndex: number; previousCellIndex: number }) => {
            this.state.selectedCellIndex = data.cellIndex;
            console.log('Cell selected:', data.cellIndex);
            this.callbacks.onCellSelected?.(data.cellIndex, data.previousCellIndex);
        });

        this.socket.on('pieceMoved', (data: { fromCellIndex: number; toCellIndex: number }) => {
            // Update local state
            if (this.state.cells[data.fromCellIndex]) {
                const occupier = this.state.cells[data.fromCellIndex].occupiedBy;
                this.state.cells[data.fromCellIndex].occupiedBy = -1;
                this.state.cells[data.toCellIndex].occupiedBy = occupier;
            }
            console.log('Piece moved:', data.fromCellIndex, '->', data.toCellIndex);
            this.callbacks.onPieceMoved?.(data.fromCellIndex, data.toCellIndex);
        });

        this.socket.on('pieceAttacked', (data: { fromCellIndex: number; targetCellIndex: number }) => {
            // Update local state - target cell becomes empty
            if (this.state.cells[data.targetCellIndex]) {
                this.state.cells[data.targetCellIndex].occupiedBy = -1;
            }
            console.log('Piece attacked:', data.fromCellIndex, '->', data.targetCellIndex);
            this.callbacks.onPieceAttacked?.(data.fromCellIndex, data.targetCellIndex);
        });

        this.socket.on('turnChanged', (data: { playerId: number }) => {
            this.state.currentTurn = data.playerId;
            console.log('Turn changed to:', data.playerId);
            this.callbacks.onTurnChanged?.(data.playerId);
        });

        this.socket.on('gameOver', (data: { winnerId: number }) => {
            this.state.winner = data.winnerId;
            console.log('Game over! Winner:', data.winnerId);
            this.callbacks.onGameOver?.(data.winnerId);
        });

        this.socket.on('error', (data: { message: string }) => {
            console.error('Server error:', data.message);
            this.callbacks.onError?.(data.message);
        });
    }

    setCallbacks(callbacks: GameClientCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    sendAction(cellIndex: number): void {
        if (this.socket?.connected) {
            this.socket.emit('action', { cellIndex });
        }
    }

    getState(): GameState {
        return this.state;
    }

    getSocketId(): string {
        return this.socketId;
    }

    getMyPlayerId(): number {
        return this.myPlayerId;
    }

    isMyTurn(): boolean {
        return this.state.currentTurn === this.myPlayerId;
    }

    getCellOccupier(cellIndex: number): number {
        return this.state.cells[cellIndex]?.occupiedBy ?? -1;
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}
