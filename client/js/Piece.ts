import Phaser from 'phaser';
import { GridCell } from './Cell';

type PieceTraits = {
    speed: number;
}



export class Piece
{
    scene: Phaser.Scene;
    cell: GridCell;

    object: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null;
    traits: PieceTraits;
    
    constructor(scene: Phaser.Scene, cell: GridCell, isWhite: boolean)
    {
        this.scene = scene;
        this.cell = cell;

        this.object = this.scene.physics.add.sprite(this.cell.worldLocation.x, this.cell.worldLocation.y, 'characters');
        this.object.setInteractive()
        // sprite offset
        this.object.setOrigin(0, 0);

        if (isWhite) {
            // Skeleton anims
            this.setUpSpriteAnim(this.object, 'characters', 'down', 9, 11);
            this.setUpSpriteAnim(this.object, 'characters', 'left', 21, 23);
            this.setUpSpriteAnim(this.object, 'characters', 'right', 33, 35);
            this.setUpSpriteAnim(this.object, 'characters', 'up', 45, 47);

            this.object.anims.play('up');
        } else {
            // Bat anims
            this.setUpSpriteAnim(this.object, 'characters', 'down', 51, 53);
            this.setUpSpriteAnim(this.object, 'characters', 'left', 63, 65);
            this.setUpSpriteAnim(this.object, 'characters', 'right', 75, 77);
            this.setUpSpriteAnim(this.object, 'characters', 'up', 87, 89);

            this.object.anims.play('down');
        }

        this.object.scale = 4;
        this.object.body.collideWorldBounds = true;
        this.object.body.velocity.x = 0;
        this.object.body.velocity.y = 0;

        // Todo: emit event -> cell selected!
        this.object.on('pointerdown', () => {
            this.object!.anims.play('left');
        }, this);


        this.traits = {
            speed: 125
        }
    }

    setUpSpriteAnim(sprite: Phaser.Physics.Arcade.Sprite, spriteKey: string, animKey: string, startFrame: integer, endFrame?: integer, frameRate?: integer, repeat?: integer)
    {
        let config = {
            key: animKey,
            frames: this.scene.anims.generateFrameNumbers(spriteKey, {
                start: startFrame,
                end: endFrame ?? startFrame
            }),
            frameRate: frameRate ?? 10,
            repeat: repeat ?? -1
        };

        sprite.anims.create(config);
    }

    destroy() {
        this.object?.destroy();
        this.object = null;
    }
};