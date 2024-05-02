import Phaser from 'phaser';
import { Piece } from './Piece';
import { GridComponent } from './GridComponent';
import { GridCell } from './GridCell';

export class PieceController
{
    scene: Phaser.Scene;
    pieces: Phaser.Physics.Arcade.Group;
    grid: GridComponent;

    // moveToAnimation
    hasReachedTarget: boolean;

    pieceToMove: Piece | null;
    moveToCell: GridCell | null;

    onMovementFinished: () => void;

    constructor(scene: Phaser.Scene, grid: GridComponent) {
        this.scene = scene;
        this.grid = grid;

        this.pieces = this.scene.physics.add.group();
    }

    spawnPieces (isPlayer: boolean, numPlayers: number) {
        const offset = numPlayers == 0 ? 0 : 6 * 8;

        for (var i = 0; i < 16; i++) {
            let cell = this.grid.cells[offset + i];

            let piece = new Piece(this.scene, cell.worldLocation, isPlayer, numPlayers > 0);
            cell.setPiece(piece);

            this.pieces.add(piece.object!);
        }
    }

    enableCollision() {
        // TODO: Does this game need physics???
        // this.scene.physics.add.collider(this.pieces);
    }

    movePiece(fromCell: GridCell, toCell: GridCell): boolean {
        let piece: Piece = fromCell.getPiece()!;

        piece.setLocation(toCell.worldLocation);
        this.onMovementFinished.call(this);

        return true;
    }

    async attackPiece(fromCell: GridCell, toCell: GridCell): Promise<boolean> {
        const attackAnim = async () => {
            let piece: Piece = fromCell.getPiece()!;

            // let angle = Phaser.Math.Angle.BetweenPoints(piece.getLocation(), toCell.worldLocation);
            // piece.object.angle += angle;

            piece.object.play('shoot_anim');
            toCell.getPiece()?.destroy();
            toCell.setPiece(null);

            setTimeout(() =>  piece.playWalk(), 500);
        }
        await attackAnim();

        return false;
    }

    update () {
        // TODO: this logic can be moved to Piece class itself
        // we call hasMoveTarget()? for each piece 
        // if true then call update()
        // the same can be done wrt Attack action

        /*if (this.pieceToMove != null && this.moveToCell != null) {
            let piece: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = this.pieceToMove.object;
            let targetCell: Phaser.GameObjects.Sprite = this.moveToCell.object;

            if (!this.hasReachedTarget) {
                const distance = Phaser.Math.Distance.BetweenPoints(piece.body.position, new Phaser.Math.Vector2(targetCell.x, targetCell.y));
                
                // this.pieceToMove.moveTo(this.moveToCell.worldLocation);
                // const angle = Phaser.Math.Angle.BetweenPoints(this.moveToCell.worldLocation, piece.body.position);
        
                if (piece.body.velocity.x > 0 || piece.body.velocity.y > 0)
                {
                    console.log(`Distance: ${distance}`);
        
                    if (distance < 4)
                    {
                        piece.body.reset(targetCell.x, targetCell.y);
        
                        this.hasReachedTarget = true;
                    }
                }
            } else {
                this.pieceToMove.object!.setImmovable(false);

                this.pieceToMove = null;
                this.moveToCell = null;
                this.onMovementFinished.call(this);
            }
        }*/
    }

    hasActiveAction() {
        return this.pieceToMove != null && this.moveToCell != null;
    }
}

function async() {
    throw new Error('Function not implemented.');
}
