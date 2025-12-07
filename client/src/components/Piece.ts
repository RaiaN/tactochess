import Phaser from 'phaser';
import { WorldLocation } from './GridCell';

type PieceTraits = {
    speed: number;
    moveDistance: number;
    attackDistance: number;
}

const CELL_SIZE = 64;

// Bright indicator color for YOUR pieces
const PLAYER_INDICATOR_COLOR = 0x00BFFF;  // Bright cyan/blue

export class Piece
{
    scene: Phaser.Scene;
    object: Phaser.GameObjects.Sprite;
    indicatorGraphics: Phaser.GameObjects.Graphics;
    tween: Phaser.Tweens.Tween | null;
    indicatorTween: Phaser.Tweens.Tween | null;
    traits: PieceTraits;
    isMine: boolean;
    
    constructor(scene: Phaser.Scene, location: WorldLocation, isLocalPlayer: boolean, isSecondPlayer: boolean)
    {
        this.scene = scene;
        this.isMine = isLocalPlayer;
        
        // Create indicator ring first (behind the soldier)
        this.indicatorGraphics = scene.add.graphics();
        this.indicatorGraphics.setPosition(location.x + CELL_SIZE / 2, location.y + CELL_SIZE / 2);
        
        // Create the soldier sprite
        this.object = this.scene.add.sprite(location.x, location.y, 'walk', 0);
        
        // Set up animations
        this.setUpSpriteAnim('walk', 'walk_anim', 0, 5);
        this.setUpSpriteAnim('shoot', 'shoot_anim', 0, 4);
        this.playWalk();
        
        // Apply color based on ownership
        if (this.isMine) {
            // Your soldiers: no tint (original colors) + cyan indicator
            this.object.clearTint();
            this.drawIndicator();
            this.startIndicatorPulse();
        } else {
            // Enemy soldiers: reddish tint to show they're hostile (keeps details visible)
            this.object.setTint(0xFF6666);
        }
        
        // Flip enemy soldiers to face the other direction
        this.object.setFlipY(isSecondPlayer);
        
        // Position and scale
        this.object.setOrigin(0, 0);
        this.object.setScale(0.15);
        
        this.traits = {
            speed: 125,
            moveDistance: 5,
            attackDistance: 5
        }
    }

    drawIndicator() {
        this.indicatorGraphics.clear();
        
        // Glowing ring under the soldier
        this.indicatorGraphics.lineStyle(3, PLAYER_INDICATOR_COLOR, 0.9);
        this.indicatorGraphics.strokeCircle(0, 0, 28);
        
        // Outer glow
        this.indicatorGraphics.lineStyle(6, PLAYER_INDICATOR_COLOR, 0.3);
        this.indicatorGraphics.strokeCircle(0, 0, 32);
    }

    startIndicatorPulse() {
        this.indicatorTween = this.scene.tweens.add({
            targets: this.indicatorGraphics,
            alpha: 0.4,
            ease: 'Sine.easeInOut',
            duration: 800,
            repeat: -1,
            yoyo: true
        });
    }

    setUpSpriteAnim(spriteKey: string, animKey: string, startFrame: number, endFrame?: number, frameRate?: number, repeat?: number)
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

        if (!this.object.anims.create(config)) {
            console.log('Failed to load anim from: ', spriteKey);
        }
    }

    playWalk() {
        let animConfig = {
            key: 'walk_anim',
            frameRate: 5,
            randomFrame: true
        };
        this.object.anims.play(animConfig);
    }

    playShoot() {
        this.object.anims.play('shoot_anim');
        // Return to walk after shooting
        this.scene.time.delayedCall(500, () => this.playWalk());
    }

    setLocation(newLocation: WorldLocation) {
        this.object.setPosition(newLocation.x, newLocation.y);
        this.indicatorGraphics.setPosition(newLocation.x + CELL_SIZE / 2, newLocation.y + CELL_SIZE / 2);
    }

    getLocation() {
        return { x: this.object.x, y: this.object.y };
    }

    destroy() {
        if (this.indicatorTween) {
            this.scene.tweens.remove(this.indicatorTween);
        }
        if (this.tween) {
            this.scene.tweens.remove(this.tween);
        }
        this.indicatorGraphics.destroy();
        this.object.destroy();
    }

    moveTo(newLocation: WorldLocation): Promise<void> {
        return new Promise((resolve) => {
            const duration = 300; // Animation duration in ms
            
            // Animate the sprite
            this.scene.tweens.add({
                targets: this.object,
                x: newLocation.x,
                y: newLocation.y,
                ease: 'Quad.easeInOut',
                duration: duration,
                onComplete: () => resolve()
            });
            
            // Animate the indicator ring to follow
            this.scene.tweens.add({
                targets: this.indicatorGraphics,
                x: newLocation.x + CELL_SIZE / 2,
                y: newLocation.y + CELL_SIZE / 2,
                ease: 'Quad.easeInOut',
                duration: duration
            });
        });
    }

    select() {
        this.tween = this.scene.tweens.add({
            targets: this.object,
            scaleX: 0.18,
            scaleY: 0.18,
            ease: 'Sine.easeInOut',  
            duration: 400,
            repeat: -1,
            yoyo: true
        });
    }

    unselect() {
        if (this.tween != null) {
            this.scene.tweens.remove(this.tween);
            this.tween = null;
            this.object.setScale(0.15);
        }
    }
};