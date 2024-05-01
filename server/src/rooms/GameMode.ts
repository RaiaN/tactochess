import { Cell } from "./state/Cell"

export class GameMode {
    MOVE_DISTANCE: number = 3;
    ATTACK_DISTANCE = 4;
    
    canMovePiece(fromCell: Cell, toCell: Cell): boolean {
        return (Math.abs(fromCell.x - toCell.x) +  Math.abs(fromCell.y - toCell.y)) <= this.MOVE_DISTANCE;
    }

    canAttackPiece(fromCell: Cell, toCell: Cell): boolean {
        return (Math.abs(fromCell.x - toCell.x) +  Math.abs(fromCell.y - toCell.y)) <= this.ATTACK_DISTANCE;
    }
}