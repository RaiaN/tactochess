import { Cell } from "./Cell"

export class Grid {
    cells: Cell[] = []

    getByCoords(x: number, y: number): Cell {
        return this.cells[y * 8 + x];
    }

    getByIndex(index: number): Cell {
        return this.cells[index];
    }
    
    populateGrid() {
        for (let y = 0; y < 8; ++y) {
            for (let x = 0; x < 8; ++x) {
                let cell = new Cell;
                cell.x = x;
                cell.y = y;
                cell.occupiedBy = '';

                this.cells.push(cell);
            }
        }
    }
}