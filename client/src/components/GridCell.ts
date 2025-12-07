import { Piece } from "./Piece";

export interface CellCoords {
    x: number;
    y: number;
}

export interface WorldLocation {
    x: number;
    y: number;
}

const CELL_SIZE = 64;

// Clean chess board colors
const LIGHT_SQUARE = 0xF0D9B5;  // Classic light wood
const DARK_SQUARE = 0xB58863;   // Classic dark wood
const HIGHLIGHT_COLOR = 0x7CB342; // Green highlight for selection

export class GridCell {
    scene: Phaser.Scene;
    coordinates: CellCoords;
    index: number;
    worldLocation: WorldLocation;

    graphics: Phaser.GameObjects.Graphics;
    hitArea: Phaser.GameObjects.Rectangle;
    piece: Piece | null;
    isLight: boolean;
    isHighlighted: boolean = false;

    onCellSelected: (cell: GridCell) => boolean;
    
    constructor(scene: Phaser.Scene, coordinates: CellCoords, worldLocation: WorldLocation) {
        this.scene = scene;
        this.coordinates = coordinates;
        this.index = coordinates.x * 8 + coordinates.y;
        this.worldLocation = worldLocation;
        this.isLight = (this.coordinates.y + this.coordinates.x) % 2 == 0;

        // Draw the cell
        this.graphics = this.scene.add.graphics();
        this.drawCell();

        // Create invisible hit area for interaction
        this.hitArea = this.scene.add.rectangle(
            this.worldLocation.x + CELL_SIZE / 2, 
            this.worldLocation.y + CELL_SIZE / 2, 
            CELL_SIZE, 
            CELL_SIZE
        );
        this.hitArea.setInteractive();
        this.hitArea.setAlpha(0.001); // Nearly invisible but clickable

        this.hitArea.on('pointerdown', () => {
            return this.onCellSelected.call(this, this);
        }, this);

        this.hitArea.on('pointerover', () => {
            if (!this.isHighlighted) {
                this.drawCell(true);
            }
        });

        this.hitArea.on('pointerout', () => {
            if (!this.isHighlighted) {
                this.drawCell(false);
            }
        });
    }

    drawCell(hover: boolean = false) {
        this.graphics.clear();
        
        const baseColor = this.isLight ? LIGHT_SQUARE : DARK_SQUARE;
        const color = this.isHighlighted ? HIGHLIGHT_COLOR : baseColor;
        
        this.graphics.fillStyle(color, 1);
        this.graphics.fillRect(this.worldLocation.x, this.worldLocation.y, CELL_SIZE, CELL_SIZE);
        
        // Subtle hover effect
        if (hover && !this.isHighlighted) {
            this.graphics.fillStyle(0xFFFFFF, 0.15);
            this.graphics.fillRect(this.worldLocation.x, this.worldLocation.y, CELL_SIZE, CELL_SIZE);
        }
        
        // Subtle inner border for depth
        this.graphics.lineStyle(1, this.isLight ? 0xE0C9A5 : 0xA57853, 0.5);
        this.graphics.strokeRect(this.worldLocation.x + 1, this.worldLocation.y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }

    isEqualTo(cell: GridCell): boolean {
        return this.coordinates.x == cell.coordinates.x && this.coordinates.y == cell.coordinates.y;
    }

    setPiece(piece: Piece | null) {
        this.piece = piece;
    }

    getPiece(): Piece | null {
        return this.piece;
    }

    select() {
        console.log('Cell selected: ' + this.coordinates.x + ',' + this.coordinates.y);
        this.isHighlighted = true;
        this.drawCell();
        this.piece?.select();
    }

    unselect() {
        console.log('Cell unselected: ' + this.coordinates.x + ',' + this.coordinates.y);
        this.isHighlighted = false;
        this.drawCell();
        this.piece?.unselect();
    }
}