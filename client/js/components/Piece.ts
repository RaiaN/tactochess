import Phaser from 'phaser';
import { WorldLocation } from './GridCell';

type PieceTraits = {
    speed: number;
    moveDistance:  number;
    attackDistance: number;
}

export class Piece
{
    scene: Phaser.Scene;

    object: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    tween: Phaser.Tweens.Tween | null;
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

        this.object.setPushable(false);
        // this.object.setCircle(5, 2, 2);

        this.traits = {
            speed: 125,
            moveDistance: 3,
            attackDistance: 4
        }
    }

    setLocation(newLocation: WorldLocation) {
        this.object.setPosition(newLocation.x, newLocation.y);
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
        // TODO: Play animation?
        this.object.destroy();
    }

    moveTo(newLocation: WorldLocation) {
        console.log('Moving piece to a new location:' + newLocation.x, newLocation.y);
        // this.scene.physics.moveToObject(this.object!, newLocation);
    }

    select() {
        this.tween = this.scene.tweens.add({
            targets: this.object,
            alpha: 0.4,
            ease: 'Cubic.easeOut',  
            duration: 500,
            repeat: -1,
            yoyo: true
        });
    }

    unselect() {
        if (this.tween != null) {
            this.scene.tweens.remove(this.tween);
            this.tween = null;
            this.object.alpha = 1.0;
        }
    }
};