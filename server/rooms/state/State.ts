import { type, Schema, MapSchema, ArraySchema } from "@colyseus/schema";

import { Player } from "./Player";
import { Cell } from "./Cell";

export class MyState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type([ Cell ]) cells = new ArraySchema<Cell>();

    @type("number") currentTurn: number;
    @type("string") winner: string;

    /*getByCoords(x: number, y: number): Cell {
        return this.cells[y * 8 + x];
    }

    getByIndex(index: number): Cell {
        return this.cells[index];
    }*/
    
    populateGrid() {
        console.log('populateGrid');

        for (let y = 0; y < 8; ++y) {
            for (let x = 0; x < 8; ++x) {
                let cell: Cell = new Cell;
                cell.x = x;
                cell.y = y;
                cell.occupiedBy = -1;

                this.cells.push(cell);
            }
        }
    }

    addPlayer(playerId: string) {
        // this.playerIds.push(playerId);
        
        let player = new Player;
        player.playerId = this.players.size + 1;

        this.players.set(playerId, player);

        var cellOffset = 0;
        if (this.players.size == 2) {
            cellOffset = 6 * 8;
        }

        for (let i = 0; i < 2; i++) {
            this.cells.toArray()[cellOffset + i].occupiedBy = player.playerId;
        }
    }

    startGame() {
        // FIXME:
        if (Math.random() < 0.5) {
            // this.currentTurn = this.playerIds[0];
        } else {
            // this.currentTurn = this.playerIds[1];
        }
    }

    /*nextTurn() {
        playerIds: string[] = new Array<string>;

        let firstPlayerId = this.players.get(this.playerIds[0]).playerId;
        let secondPlayerId = this.players.get(this.playerIds[1]).playerId;

        let nextPlayer: number = (this.currentTurn == firstPlayerId) ? secondPlayerId : firstPlayerId;
        console.log('Next player turn: ' + nextPlayer);

        this.currentTurn = nextPlayer;
    }*/

    /*updateGrid(index: number, occupiedBy: number) {
        this.getByIndex(index).occupiedBy = occupiedBy;
    }*/

    /*checkWin(): boolean {
        let playerCnt = 0;
        let enemyCnt = 0;

        this.cells.forEach((cell) => {
            if (cell.occupiedBy == this.players[0].playerId) {
                ++playerCnt; 
            } else if (cell.occupiedBy == this.players[1].playerId) {
                ++enemyCnt; 
            }
        });

        return playerCnt == 0 || enemyCnt == 0;
    }*/
}