
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

    spawnPieces () {
        this.spawnPlayerPieces();
        this.spawnEnemyPieces();
    }

    spawnPlayerPieces () {
        const offset = 0;

        for (var i = 0; i < 2; i++) {
            let cell = this.grid.cells[offset + i];

            let piece = new Piece(this.scene, cell.worldLocation, true);
            cell.setPiece(piece);

            this.pieces.add(piece.object!);
        }
    }

    spawnEnemyPieces () {
        const offset = 6 * 8;

        for (var i = 0; i < 2; i++) {
            let cell = this.grid.cells[offset + i];

            let piece = new Piece(this.scene, cell.worldLocation, false);
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

        let moveDistance: number = piece.traits.moveDistance;

        if (Phaser.Math.Distance.Snake(fromCell.coordinates.x, fromCell.coordinates.y, toCell.coordinates.x, toCell.coordinates.y) < moveDistance)
        {
            this.pieceToMove = piece;
            this.moveToCell = toCell;
            this.hasReachedTarget = false;

            this.pieceToMove.moveTo(this.moveToCell.worldLocation);

            return true;
        } else {
            console.log('Cannot move the piece. Too far!');
        }

        return false;
    }

    attackPiece(fromCell: GridCell, toCell: GridCell): boolean {
        let attacker: Piece = fromCell.getPiece()!;
        let attackDistance: number = attacker.traits.attackDistance;

        if (Phaser.Math.Distance.Snake(fromCell.coordinates.x, fromCell.coordinates.y, toCell.coordinates.x, toCell.coordinates.y) < attackDistance) {
            // Destroy enemy piece
            fromCell.getPiece()!.object.play('shoot_anim');
            toCell.getPiece()?.destroy();
            toCell.setPiece(null);

            setTimeout(() =>  fromCell.getPiece()!.playWalk(), 500);

            return true;
        } else {
            console.log('Cannot attack the piece. Too far!');
        }

        return false;
    }

    update () {
        // TODO: this logic can be moved to Piece class itself
        // we call hasMoveTarget()? for each piece 
        // if true then call update()
        // the same can be done wrt Attack action

        if (this.pieceToMove != null && this.moveToCell != null) {
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
        }
    }

    hasActiveAction() {
        return this.pieceToMove != null && this.moveToCell != null;
    }
}