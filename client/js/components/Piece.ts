import Phaser from 'phaser';
import { GridCell, WorldLocation } from './GridCell';

type PieceTraits = {
    speed: number;
}

export class Piece
{
    scene: Phaser.Scene;

    object: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null;
    traits: PieceTraits;
    
    constructor(scene: Phaser.Scene, location: WorldLocation, isWhite: boolean)
    {
        this.scene = scene;

        this.object = this.scene.physics.add.sprite(location.x, location.y, 'characters');
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

        this.traits = {
            speed: 125
        }
    }

    setLocation(newLocation: WorldLocation) {
        this.object?.setPosition(newLocation.x, newLocation.y);
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

    select() {
        this.object?.anims.play('up');
    }

    unselect() {
        this.object?.anims.play('down');
    }
};