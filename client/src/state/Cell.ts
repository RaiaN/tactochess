// Simple Cell type (no Colyseus)
export interface Cell {
    x: number;
    y: number;
    occupiedBy: number; // -1 = empty, 0 = player1, 1 = player2
}
