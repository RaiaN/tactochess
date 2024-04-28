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

        this.object = this.scene.physics.add.sprite(location.x, location.y);

        this.setUpSpriteAnim(this.object, 'walk', 'walk_anim', 0, 5);
        this.setUpSpriteAnim(this.object, 'shoot', 'shoot_anim', 0, 5);

        let animConfig = {
            key: 'walk_anim',
            frameRate: 5,
            // timeScale?: number;
            randomFrame: true
        };
        this.object.anims.play(animConfig);
        if (isWhite) {
            this.object.setTint(0xBB00BB);
        } else {
            this.object.setTint(0x69FF00);
            this.object.setFlipY(true);
        }

        // sprite offset
        this.object.setOrigin(0, 0);

        this.object.scale = 0.15;
        this.object.body.collideWorldBounds = true;
        this.object.body.velocity.x = 0;
        this.object.body.velocity.y = 0;

        this.object.setImmovable(false);
        this.object.setPushable(false);

        this.traits = {
            speed: 125,
            moveDistance: 5,
            attackDistance: 5
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

        if (!sprite.anims.create(config)) {
            console.log('Failed to load anim from: ', spriteKey);
        }
    }

    destroy() {
        // TODO: Play animation?
        this.object.destroy();
    }

    moveTo(newLocation: WorldLocation) {
        console.log('Moving piece to a new location:' + newLocation.x, newLocation.y);
        this.object.setImmovable(true);
        this.scene.physics.moveTo(this.object!, newLocation.x, newLocation.y, this.traits.speed);
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