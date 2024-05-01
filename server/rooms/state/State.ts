import { type, Schema, MapSchema, ArraySchema } from "@colyseus/schema";

import { Player } from "./Player";
import { Cell } from "./Cell";

export class MyState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type([ Cell ]) cells = new ArraySchema<Cell>();

    @type("number") currentTurn: number;
    @type("number") selectedCellIndex: number;
    @type("number") moveToCellIndex: number;
    @type("number") attackPieceCellIndex: number;
    @type("number") winner: number;
    
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

        this.selectedCellIndex = -1;
        this.moveToCellIndex = -1;
        this.attackPieceCellIndex = -1;
        this.winner = -1;
    }

    addPlayer(playerId: string) {
        let player = new Player;
        player.playerId = this.players.size;

        this.players.set(playerId, player);

        var cellOffset = 0;
        if (this.players.size == 2) {
            cellOffset = 6 * 8;
        }

        for (let i = 0; i < 2; i++) {
            this.cells.toArray()[cellOffset + i].occupiedBy = player.playerId;
        }
    }

    setSelectedCellIndex(cellIndex: number) {
        this.selectedCellIndex = cellIndex;
    }

    setMoveToCellIndex(cellIndex: number) {
        this.moveToCellIndex = cellIndex;
    }

    setAttackPieceCellIndex(cellIndex: number) {
        this.attackPieceCellIndex = cellIndex;
    }

    getWinner() {
        let firstPlayerCnt = 0;
        let secondPlayerCnt = 0;

        for (let i = 0; i < 64; ++i) {
            firstPlayerCnt += (this.cells.toArray()[i].occupiedBy == 0) ? 1: 0;
            secondPlayerCnt += (this.cells.toArray()[i].occupiedBy == 1) ? 1: 0;
        }

        console.log('First player cnt: ' + firstPlayerCnt);
        console.log('Second player cnt: ' + secondPlayerCnt);

        if (firstPlayerCnt == 0) {
            return 1;
        } else if (secondPlayerCnt == 0) {
            return 0;
        }
        // no winner
        return -1;
    }
}