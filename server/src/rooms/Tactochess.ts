import { Room, Delayed, Client } from '@colyseus/core';
import { MyState } from "./state/State"
import { Cell } from './state/Cell';
import { GameMode } from './GameMode';

export class Tactochess extends Room<MyState> {
    maxClients = 2;
    randomMoveTimeout: Delayed;

    playerIds: string[] = new Array<string>;

    gameMode: GameMode = new GameMode;
  
    onCreate () {
      console.log('onCreate');

      this.setState(new MyState());
      this.onMessage("action", (client, message) => this.playerAction(client, message));
    }
  
    onJoin (client: Client) {
      console.log('onJoin');

      if (this.state.players.size == 0) {
        this.state.populateGrid();
      }

      this.state.addPlayer(client.sessionId);

      this.playerIds.push(client.sessionId);
  
      if (this.state.players.size === 2) {
        this.pickRandomPlayerAsCurrent();
        console.log('Current turn player id: ' + this.state.currentTurn);
        // this.setAutoMoveTimeout();
  
        // lock this room for new users
        this.lock();
      }
    }

    getPlayerId(playerStringId: string): number {
      return this.state.players.get(playerStringId).playerId;
    }

    pickRandomPlayerAsCurrent() {
      this.state.currentTurn = this.getPlayerId(this.playerIds[Math.floor(Math.random() * this.playerIds.length)]);
    }

    nextTurn() {
      let winnerPlayerId = this.state.getWinner();
      let firstPlayerId = this.getPlayerId(this.playerIds[0]);
      let secondPlayerId = this.getPlayerId(this.playerIds[1]);

      if (winnerPlayerId == -1) {
        let nextPlayer: number = (this.state.currentTurn == firstPlayerId) ? secondPlayerId : firstPlayerId;
        console.log('Next player turn: ' + nextPlayer);
  
        this.state.currentTurn = nextPlayer;
      } else if (winnerPlayerId == firstPlayerId || winnerPlayerId == secondPlayerId) {
        this.state.winner = winnerPlayerId;
        console.log('Player id won: ' + winnerPlayerId);
      } else {
        console.log('Server error! winnerPlayerId = ' + winnerPlayerId);
      }
    }

    getByCoords(x: number, y: number): Cell {
        return this.state.cells.toArray()[y * 8 + x];
    }

    getByIndex(index: number): Cell {
        return this.state.cells.toArray()[index];
    }

    updateGrid(index: number, occupiedBy: number) {
        this.getByIndex(index).occupiedBy = occupiedBy;
    }

    checkWin(): boolean {
        let playerCnt = 0;
        let enemyCnt = 0;

        let firstPlayerId = this.getPlayerId(this.playerIds[0]);
        let secondPlayerId = this.getPlayerId(this.playerIds[1]);

        this.state.cells.toArray().forEach((cell) => {
            if (cell.occupiedBy == firstPlayerId) {
                ++playerCnt; 
            } else if (cell.occupiedBy == secondPlayerId) {
                ++enemyCnt; 
            }
        });

        return playerCnt == 0 || enemyCnt == 0;
    }
  
    playerAction (client: Client, data: any) {
      let playerId: number = this.getPlayerId(client.sessionId);
      console.log('------Message from client (player id): ' + playerId);
      console.log('Message data: ' + JSON.stringify(data));

      if (this.state.winner != -1) {
        return false;
      }

      if (this.state.currentTurn === this.getPlayerId(client.sessionId)) {
        this.handlePlayerAction(data.cellIndex);
      }
    }

    handlePlayerAction(cellIndex: number) {
        let cellOccupier: number = this.getByIndex(cellIndex).occupiedBy;

        console.log('handlePlayerAction');
        console.log('this.state.selectedCellIndex: ' + this.state.selectedCellIndex);
        console.log('cellIndex: ' + cellIndex);

        if (this.state.selectedCellIndex == cellIndex) {
          console.log('Server will ignore the client message as Player selected the same cell: ' + cellIndex);
          return;
        }

        // 1. select phase
        if (this.state.selectedCellIndex == -1) {
            // cannot select enemy piece
            if (cellOccupier != this.state.currentTurn) {
                return false;
            }

            this.state.setSelectedCellIndex(cellIndex);
            console.log('Player selected cell: ' + cellIndex);

            // implicit switch to next phase: move/attack
 
        // 2. move/attack phase
        } else {
            // early exit: change selection!
            if (cellOccupier == this.state.currentTurn) {
              this.state.setSelectedCellIndex(cellIndex);
              console.log('Player reselected cell: ' + cellIndex);

            // Move piece
            } else if (cellOccupier == -1) {
                if (this.gameMode.canMovePiece(this.getByIndex(cellIndex), this.getByIndex(this.state.selectedCellIndex))) {
                  console.log(`Player is moving the piece from ${this.state.selectedCellIndex} to ${cellIndex}!`);

                  this.updateGrid(this.state.selectedCellIndex, -1);
                  this.updateGrid(cellIndex, this.state.currentTurn);
  
                  this.state.setMoveToCellIndex(cellIndex);
                  this.state.setSelectedCellIndex(-1);
                  this.nextTurn();
                } else {
                  console.log(`GameMode: Can't move the player piece from ${this.state.selectedCellIndex} to ${cellIndex}. Too far!`);
                }
                

            // Attack piece
            } else {
                if (this.gameMode.canAttackPiece(this.getByIndex(cellIndex), this.getByIndex(this.state.selectedCellIndex))) {
                  console.log(`Player is attacking the enemy piece at ${cellIndex}!`);

                  this.updateGrid(cellIndex, -1);
  
                  this.state.setAttackPieceCellIndex(cellIndex);
                  this.state.setSelectedCellIndex(-1);
                  this.nextTurn();
                } else {
                  console.log(`GameMode: Can't attack the enemy piece at ${cellIndex}. Too far!`);
                }
            }
        }
    }

    doRandomMove() {
      // TODO: Skip turn for now!
    }
  
    setAutoMoveTimeout() {
      if (this.randomMoveTimeout) {
        this.randomMoveTimeout.clear();
      }
  
      // timeout is 3 seconds!
      this.randomMoveTimeout = this.clock.setTimeout(() => this.doRandomMove(), 3 * 1000);
    }
  
    onLeave (client: Client) {
      console.log('onLeave');

      this.state.players.delete(client.sessionId);
      // this.state.playerIds.splice(client.sessionId == this.state.playerIds[0] ? 0 : 1, 1);
  
      if (this.randomMoveTimeout) {
        this.randomMoveTimeout.clear()
      }

      if (!this.state.winner && this.state.players.size > 0) {
        this.state.winner = this.state.players.keys().next().value;
      }
    }
  }
