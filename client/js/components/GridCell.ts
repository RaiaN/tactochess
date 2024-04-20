import { Piece } from "./Piece";

export interface CellCoords {
    x: number;
    y: number;
}

export interface WorldLocation {
    x: number;
    y: number;
}

export class GridCell {
    scene: Phaser.Scene;
    coordinates: CellCoords;
    worldLocation: WorldLocation;

    object: Phaser.GameObjects.Sprite | null;
    piece: Piece | null;

    onCellSelected: (cell: GridCell) => boolean;

    constructor(scene: Phaser.Scene, coordinates: CellCoords, worldLocation: WorldLocation) {
        this.scene = scene;
        this.coordinates = coordinates;
        this.worldLocation = worldLocation;

        let tileIndex = (this.coordinates.y + this.coordinates.x) % 2 == 0 ? 9 : 17;
        this.object = this.scene.add.sprite(this.worldLocation.x,  this.worldLocation.y, 'tiles', tileIndex);
        this.object.setInteractive();
        // sprite offset
        this.object.setOrigin(0);
        this.object.scale = 4;

        this.object.on('pointerdown', () => {
            return this.onCellSelected.call(this, this);
        }, this);
    }

    isEqualTo(cell: GridCell): boolean {
        return this.coordinates.x == cell.coordinates.x && this.coordinates.y == cell.coordinates.y;
    }

    setPiece(piece: Piece | null) {
        this.piece = piece;
        this.piece?.setLocation(this.worldLocation);
    }

    getPiece(): Piece | null {
        return this.piece;
    }

    select() {
        console.log('Piece selected: ' + this.coordinates.x + ',' + this.coordinates.y);

        this.object?.setTintFill(0xff);
    }

    unselect() {
        console.log('Piece unselected: ' + this.coordinates.x + ',' + this.coordinates.y);
        this.object?.clearTint();
    }
}