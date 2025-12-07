import Phaser from 'phaser';
import { WorldLocation } from './GridCell';

type PieceTraits = {
    speed: number;
    moveDistance: number;
    attackDistance: number;
}

const CELL_SIZE = 64;
const PAWN_RADIUS = 22;

// Bright indicator color for YOUR pieces
const PLAYER_INDICATOR_COLOR = 0x00BFFF;  // Bright cyan/blue

export class Piece
{
    scene: Phaser.Scene;
    container: Phaser.GameObjects.Container;
    graphics: Phaser.GameObjects.Graphics;
    indicatorGraphics: Phaser.GameObjects.Graphics;
    tween: Phaser.Tweens.Tween | null;
    indicatorTween: Phaser.Tweens.Tween | null;
    traits: PieceTraits;
    isWhite: boolean;
    isMine: boolean;  // Does this piece belong to the local player?
    
    constructor(scene: Phaser.Scene, location: WorldLocation, isLocalPlayer: boolean, isSecondPlayer: boolean)
    {
        this.scene = scene;
        this.isMine = isLocalPlayer;
        // Local player is always white from their perspective, opponent is black
        this.isWhite = isLocalPlayer;
        
        // Create container first
        this.container = scene.add.container(location.x + CELL_SIZE / 2, location.y + CELL_SIZE / 2);
        
        // Create indicator ring (drawn behind the pawn)
        this.indicatorGraphics = scene.add.graphics();
        this.container.add(this.indicatorGraphics);
        
        // Create graphics for the pawn
        this.graphics = scene.add.graphics();
        this.container.add(this.graphics);
        
        this.drawPawn();
        
        // Add pulsing indicator for player's own pieces
        if (this.isMine) {
            this.drawIndicator();
            this.startIndicatorPulse();
        }
        
        this.traits = {
            speed: 125,
            moveDistance: 5,
            attackDistance: 5
        }
    }

    drawIndicator() {
        this.indicatorGraphics.clear();
        
        // Glowing ring under the pawn
        this.indicatorGraphics.lineStyle(3, PLAYER_INDICATOR_COLOR, 0.9);
        this.indicatorGraphics.strokeCircle(0, 12, PAWN_RADIUS * 1.1);
        
        // Inner glow
        this.indicatorGraphics.lineStyle(6, PLAYER_INDICATOR_COLOR, 0.3);
        this.indicatorGraphics.strokeCircle(0, 12, PAWN_RADIUS * 1.2);
    }

    startIndicatorPulse() {
        this.indicatorTween = this.scene.tweens.add({
            targets: this.indicatorGraphics,
            alpha: 0.5,
            ease: 'Sine.easeInOut',
            duration: 800,
            repeat: -1,
            yoyo: true
        });
    }

    drawPawn() {
        this.graphics.clear();
        
        const baseColor = this.isWhite ? 0xFFFFFF : 0x1a1a1a;
        const outlineColor = this.isWhite ? 0x333333 : 0xCCCCCC;
        const highlightColor = this.isWhite ? 0xf0f0f0 : 0x3a3a3a;
        
        // Shadow
        this.graphics.fillStyle(0x000000, 0.3);
        this.graphics.fillEllipse(2, 4, PAWN_RADIUS * 1.6, PAWN_RADIUS * 0.5);
        
        // Base (wide bottom)
        this.graphics.fillStyle(baseColor, 1);
        this.graphics.fillEllipse(0, 12, PAWN_RADIUS * 1.5, PAWN_RADIUS * 0.6);
        this.graphics.lineStyle(2, outlineColor, 1);
        this.graphics.strokeEllipse(0, 12, PAWN_RADIUS * 1.5, PAWN_RADIUS * 0.6);
        
        // Body (tapered middle)
        this.graphics.fillStyle(baseColor, 1);
        this.graphics.fillEllipse(0, 0, PAWN_RADIUS * 0.9, PAWN_RADIUS * 1.1);
        this.graphics.lineStyle(2, outlineColor, 1);
        this.graphics.strokeEllipse(0, 0, PAWN_RADIUS * 0.9, PAWN_RADIUS * 1.1);
        
        // Head (top sphere)
        this.graphics.fillStyle(baseColor, 1);
        this.graphics.fillCircle(0, -14, PAWN_RADIUS * 0.5);
        this.graphics.lineStyle(2, outlineColor, 1);
        this.graphics.strokeCircle(0, -14, PAWN_RADIUS * 0.5);
        
        // Highlight on head
        this.graphics.fillStyle(highlightColor, 0.6);
        this.graphics.fillCircle(-3, -17, PAWN_RADIUS * 0.15);
    }

    setLocation(newLocation: WorldLocation) {
        this.container.setPosition(newLocation.x + CELL_SIZE / 2, newLocation.y + CELL_SIZE / 2);
    }

    getLocation() {
        return { x: this.container.x - CELL_SIZE / 2, y: this.container.y - CELL_SIZE / 2 };
    }

    destroy() {
        if (this.indicatorTween) {
            this.scene.tweens.remove(this.indicatorTween);
        }
        this.indicatorGraphics.destroy();
        this.graphics.destroy();
        this.container.destroy();
    }

    moveTo(newLocation: WorldLocation) {
        console.log('Moving piece to a new location:' + newLocation.x, newLocation.y);
    }

    select() {
        this.tween = this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.15,
            scaleY: 1.15,
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
            this.container.setScale(1, 1);
        }
    }
};