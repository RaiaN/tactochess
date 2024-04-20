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

        var cellOffset = 6 * 8;
        if (this.grid.cells[63].occupiedBy != '') {
            cellOffset = 8;
        }
       
        for (let i = 0; i < 16; i++) {
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
        let nextTurn = (this.currentPlayer == this.players[0].playerId) ? this.players[1].playerId : this.players[0].playerId;

        this.currentPlayer = nextTurn;

        console.log('Next turn: ' + this.currentPlayer);
    }
}