import { Player } from "./Player";
import { Grid } from "./Grid";

export class GameState {
    players: Player[] = [];
    grid: Grid;
    currentPlayer: string;
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

    startGame() {
        if (Math.random() < 0.5) {
            this.currentPlayer = this.players[0].playerId;
        } else {
            this.currentPlayer = this.players[1].playerId;
        }
    }

    nextTurn() {
        let nextPlayer: string = (this.currentPlayer == this.players[0].playerId) ? this.players[1].playerId : this.players[0].playerId;

        this.currentPlayer = nextPlayer;

        console.log('Next turn: ' + this.currentPlayer);
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

    getCurrentPlayer(): string {
        return this.currentPlayer;
    }
}