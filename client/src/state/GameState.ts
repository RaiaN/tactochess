import { Player } from "./Player";
import { Grid } from "./Grid";

export class GameState {
    players: Player[] = [];
    grid: Grid;
    playerId: number;
    winner: string;

    constructor() {
        this.grid = new Grid;
        this.grid.populateGrid();
    }

    addPlayer(playerId) {
        this.players.push(new Player(playerId));

        var cellOffset = 0;
        if (this.players.length == 2) {
            cellOffset = 6 * 8;
        }

        for (let i = 0; i < 2; i++) {
            this.grid.cells[cellOffset + i].occupiedBy = playerId;
        }
    }

    setThisPlayerId(playerId: number) {
        this.playerId = playerId;
    }

    updateGrid(index: number, occupiedBy: string) {
        this.grid.getByIndex(index).occupiedBy = occupiedBy;
    }

    checkWin(): boolean {
        let playerCnt = 0;
        let enemyCnt = 0;

        this.grid.cells.forEach((cell) => {
            if (cell.occupiedBy == this.players[0].playerId) {
                ++playerCnt; 
            } else if (cell.occupiedBy == this.players[1].playerId) {
                ++enemyCnt; 
            }
        });

        return playerCnt == 0 || enemyCnt == 0;
    }

    getThisPlayerId(): number {
        return this.playerId;
    }
}