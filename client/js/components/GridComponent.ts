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
        var rowCount = Math.floor(this.worldSize / GridComponent.CELL_SIZE);
        for (let y = 0; y < rowCount; y++) {
            for (let x = 0; x < rowCount; x++) {
                var gridX = x * GridComponent.CELL_SIZE;
                var gridY = y * GridComponent.CELL_SIZE;

                let newCell = new GridCell(this.scene, {x: x, y: y}, {x: gridX, y: gridY});
                newCell.onCellSelected = (cell) => this.onCellSelected(cell);

                this.cells.push(newCell);
            }
        }
    }

    getCellByCoords(coords: CellCoords): GridCell {
        return this.cells[coords.y * 8 + coords.x];
    }

    getCellByIndex(index: number): GridCell {
        return this.cells[index];
    }
}