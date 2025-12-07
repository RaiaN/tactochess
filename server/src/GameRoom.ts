import { Server, Socket } from 'socket.io';

// Game constants
const GAME_CONSTANTS = {
    GRID_SIZE: 8,
    PIECES_PER_PLAYER: 16,
    MOVE_DISTANCE: 3,
    ATTACK_DISTANCE: 4,
};

interface Cell {
    x: number;
    y: number;
    occupiedBy: number; // -1 = empty, 0 = player1, 1 = player2
}

interface Player {
    socketId: string;
    playerId: number; // 0 or 1
}

interface GameState {
    players: Map<string, Player>;
    cells: Cell[];
    currentTurn: number;
    selectedCellIndex: number;
    winner: number;
}

export class GameRoom {
    private io: Server;
    private roomId: string;
    private sockets: Map<string, Socket> = new Map();
    private state: GameState;
    private locked: boolean = false;

    constructor(io: Server) {
        this.io = io;
        this.roomId = 'room_' + Math.random().toString(36).substring(2, 10);
        this.state = this.createInitialState();
    }

    private createInitialState(): GameState {
        return {
            players: new Map(),
            cells: [],
            currentTurn: -1,
            selectedCellIndex: -1,
            winner: -1
        };
    }

    private populateGrid(): void {
        console.log('Populating grid');
        this.state.cells = [];
        
        for (let y = 0; y < GAME_CONSTANTS.GRID_SIZE; ++y) {
            for (let x = 0; x < GAME_CONSTANTS.GRID_SIZE; ++x) {
                this.state.cells.push({ x, y, occupiedBy: -1 });
            }
        }
    }

    private addPlayer(socketId: string): Player {
        const playerId = this.state.players.size;
        const player: Player = { socketId, playerId };
        this.state.players.set(socketId, player);

        // Place pieces for this player
        const cellOffset = playerId === 0 ? 0 : 6 * GAME_CONSTANTS.GRID_SIZE;
        for (let i = 0; i < GAME_CONSTANTS.PIECES_PER_PLAYER; i++) {
            this.state.cells[cellOffset + i].occupiedBy = playerId;
        }

        return player;
    }

    private getCell(index: number): Cell {
        return this.state.cells[index];
    }

    private updateCell(index: number, occupiedBy: number): void {
        this.state.cells[index].occupiedBy = occupiedBy;
    }

    private canMovePiece(fromIndex: number, toIndex: number): boolean {
        const fromCell = this.getCell(fromIndex);
        const toCell = this.getCell(toIndex);
        const distance = Math.abs(fromCell.x - toCell.x) + Math.abs(fromCell.y - toCell.y);
        return distance <= GAME_CONSTANTS.MOVE_DISTANCE;
    }

    private canAttackPiece(fromIndex: number, toIndex: number): boolean {
        const fromCell = this.getCell(fromIndex);
        const toCell = this.getCell(toIndex);
        const distance = Math.abs(fromCell.x - toCell.x) + Math.abs(fromCell.y - toCell.y);
        return distance <= GAME_CONSTANTS.ATTACK_DISTANCE;
    }

    private getWinner(): number {
        let player0Count = 0;
        let player1Count = 0;

        for (const cell of this.state.cells) {
            if (cell.occupiedBy === 0) player0Count++;
            else if (cell.occupiedBy === 1) player1Count++;
        }

        console.log('Player 0 pieces:', player0Count, '| Player 1 pieces:', player1Count);

        if (player0Count === 0) return 1;
        if (player1Count === 0) return 0;
        return -1;
    }

    private pickRandomFirstPlayer(): void {
        const playerIds = Array.from(this.state.players.values()).map(p => p.playerId);
        this.state.currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)];
    }

    private nextTurn(): void {
        const winnerId = this.getWinner();
        
        if (winnerId === -1) {
            this.state.currentTurn = this.state.currentTurn === 0 ? 1 : 0;
            console.log('Next player turn:', this.state.currentTurn);
            
            this.broadcast('turnChanged', { playerId: this.state.currentTurn });
        } else {
            this.state.winner = winnerId;
            console.log('Game over! Winner:', winnerId);
            
            this.broadcast('gameOver', { winnerId });
        }
    }

    private broadcast(event: string, data: any): void {
        for (const socket of this.sockets.values()) {
            socket.emit(event, data);
        }
    }

    // Public API
    canJoin(): boolean {
        return !this.locked && this.sockets.size < 2;
    }

    onJoin(socket: Socket): void {
        // Initialize grid on first player
        if (this.state.players.size === 0) {
            this.populateGrid();
        }

        // Add player to state
        const player = this.addPlayer(socket.id);
        
        // Store socket and associate room
        this.sockets.set(socket.id, socket);
        (socket as any).gameRoom = this;

        // Join Socket.IO room
        socket.join(this.roomId);

        console.log('Player joined:', socket.id, 'PlayerId:', player.playerId);

        // Send welcome with player info
        socket.emit('welcome', { 
            socketId: socket.id,
            playerId: player.playerId
        });

        // Notify all players about the new player
        this.broadcast('playerJoined', {
            player,
            totalPlayers: this.state.players.size
        });

        // Start game when 2 players join
        if (this.state.players.size === 2) {
            this.locked = true;
            this.pickRandomFirstPlayer();
            
            console.log('Game starting! First turn:', this.state.currentTurn);

            // Send game start to each player
            for (const [socketId, sock] of this.sockets) {
                const p = this.state.players.get(socketId)!;
                sock.emit('gameStart', {
                    cells: this.state.cells,
                    currentTurn: this.state.currentTurn,
                    yourPlayerId: p.playerId
                });
            }
        }
    }

    onLeave(socket: Socket): void {
        console.log('Player left:', socket.id);
        
        this.sockets.delete(socket.id);
        this.state.players.delete(socket.id);

        // If game was in progress, the remaining player wins
        if (this.state.winner === -1 && this.sockets.size > 0) {
            const remaining = this.sockets.values().next().value;
            if (remaining) {
                const remainingPlayer = this.state.players.get(remaining.id);
                if (remainingPlayer) {
                    this.state.winner = remainingPlayer.playerId;
                    this.broadcast('gameOver', { winnerId: remainingPlayer.playerId });
                }
            }
        }
    }

    onAction(socket: Socket, cellIndex: number): void {
        const player = this.state.players.get(socket.id);
        if (!player) return;

        console.log('Action from player:', player.playerId, 'Cell:', cellIndex);

        // Ignore if game is over
        if (this.state.winner !== -1) return;

        // Only process if it's this player's turn
        if (this.state.currentTurn !== player.playerId) return;

        this.handlePlayerAction(cellIndex);
    }

    private handlePlayerAction(cellIndex: number): void {
        const cellOccupier = this.getCell(cellIndex).occupiedBy;

        console.log('handlePlayerAction | selected:', this.state.selectedCellIndex, '| target:', cellIndex);

        // Ignore if same cell selected
        if (this.state.selectedCellIndex === cellIndex) {
            console.log('Same cell selected, ignoring');
            return;
        }

        // Phase 1: Select
        if (this.state.selectedCellIndex === -1) {
            // Can only select own pieces
            if (cellOccupier !== this.state.currentTurn) {
                return;
            }

            this.state.selectedCellIndex = cellIndex;
            console.log('Cell selected:', cellIndex);

            this.broadcast('cellSelected', {
                cellIndex,
                previousCellIndex: -1
            });

        // Phase 2: Move or Attack
        } else {
            const previousSelection = this.state.selectedCellIndex;

            // Re-select own piece
            if (cellOccupier === this.state.currentTurn) {
                this.state.selectedCellIndex = cellIndex;
                console.log('Cell reselected:', cellIndex);

                this.broadcast('cellSelected', {
                    cellIndex,
                    previousCellIndex: previousSelection
                });

            // Move to empty cell
            } else if (cellOccupier === -1) {
                if (this.canMovePiece(this.state.selectedCellIndex, cellIndex)) {
                    console.log(`Moving piece: ${this.state.selectedCellIndex} -> ${cellIndex}`);

                    // Update grid state
                    this.updateCell(this.state.selectedCellIndex, -1);
                    this.updateCell(cellIndex, this.state.currentTurn);

                    // Broadcast move
                    this.broadcast('pieceMoved', {
                        fromCellIndex: this.state.selectedCellIndex,
                        toCellIndex: cellIndex
                    });

                    // Clear selection
                    this.state.selectedCellIndex = -1;
                    this.broadcast('cellSelected', {
                        cellIndex: -1,
                        previousCellIndex: previousSelection
                    });
                    
                    this.nextTurn();
                } else {
                    console.log('Move rejected - too far');
                }

            // Attack enemy piece
            } else {
                if (this.canAttackPiece(this.state.selectedCellIndex, cellIndex)) {
                    console.log(`Attacking piece at: ${cellIndex}`);

                    // Clear the attacked cell (piece dies)
                    this.updateCell(cellIndex, -1);

                    // Broadcast attack
                    this.broadcast('pieceAttacked', {
                        fromCellIndex: this.state.selectedCellIndex,
                        targetCellIndex: cellIndex
                    });

                    // Clear selection
                    this.state.selectedCellIndex = -1;
                    this.broadcast('cellSelected', {
                        cellIndex: -1,
                        previousCellIndex: previousSelection
                    });
                    
                    this.nextTurn();
                } else {
                    console.log('Attack rejected - too far');
                }
            }
        }
    }
}
