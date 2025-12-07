// Simple game state (no Colyseus)
import { Cell } from './Cell';
import { Player } from './Player';

export interface GameState {
    players: Map<string, Player>;
    cells: Cell[];
    currentTurn: number;
    selectedCellIndex: number;
    winner: number;
}

export function createInitialState(): GameState {
    return {
        players: new Map(),
        cells: [],
        currentTurn: -1,
        selectedCellIndex: -1,
        winner: -1
    };
}
