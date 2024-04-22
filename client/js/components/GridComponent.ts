import { CellCoords, GridCell } from "./GridCell";

export class GridComponent {
    static CELL_SIZE: number = 64;
    
    scene: Phaser.Scene;
    cells: GridCell[] = [];
    worldSize: number;

    onCellSelected: (cell: GridCell) => boolean;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.worldSize = this.scene.physics.world.bounds.width;

        this.generateGrid();
    }

    generateGrid () {
        let rowCount = Math.floor(this.worldSize / GridComponent.CELL_SIZE);
        for (let y = 0; y < rowCount; y++) {
            for (let x = 0; x < rowCount; x++) {
                let gridX = x * GridComponent.CELL_SIZE;
                let gridY = y * GridComponent.CELL_SIZE;

                let newCell = new GridCell(this.scene, {x: y, y: x}, {x: gridX, y: gridY});
                newCell.onCellSelected = (cell) => this.onCellSelected(cell);

                this.cells.push(newCell);
            }
        }
    }

    getCellByCoords(coords: CellCoords): GridCell {
        return this.cells[coords.x * 8 + coords.y];
    }

    getCellByIndex(index: number): GridCell {
        return this.cells[index];
    }
}