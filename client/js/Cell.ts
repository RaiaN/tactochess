export interface CellLocation {
    x: number;
    y: number;
}

export class GridCell {
    scene: Phaser.Scene;
    coordinates: CellLocation;
    worldLocation: CellLocation;

    object: Phaser.GameObjects.Sprite | null;

    constructor(scene: Phaser.Scene, coordinates: CellLocation, worldLocation: CellLocation) {
        this.scene = scene;
        this.coordinates = coordinates;
        this.worldLocation = worldLocation;

        let tileIndex = (this.coordinates.y + this.coordinates.x) % 2 == 0 ? 9 : 17;
        this.object = this.scene.add.sprite(this.worldLocation.x,  this.worldLocation.y, 'tiles', tileIndex);
        // sprite offset
        this.object.setOrigin(0, 0);

        this.object.scale = 4;
    }
}