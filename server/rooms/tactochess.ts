
import { Room, Delayed, Client } from '@colyseus/core';
import { MyState } from "./state/State"
import { Cell } from './state/Cell';

export class Tactochess extends Room<MyState> {
    maxClients = 2;
    randomMoveTimeout: Delayed;

    playerIds: string[] = new Array<string>;
  
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
        this.state.currentTurn = this.state.players.get(client.sessionId).playerId;
        console.log('Current turn player id: ' + this.state.currentTurn);
        // this.setAutoMoveTimeout();
  
        // lock this room for new users
        this.lock();
      }
    }

    getPlayerId(playerStringId: string): number {
      return this.state.players.get(playerStringId).playerId;
    }

    nextTurn() {
      let firstPlayerId = this.getPlayerId(this.playerIds[0]);
      let secondPlayerId = this.getPlayerId(this.playerIds[1]);

      let nextPlayer: number = (this.state.currentTurn == firstPlayerId) ? secondPlayerId : firstPlayerId;
      console.log('Next player turn: ' + nextPlayer);

      this.state.currentTurn = nextPlayer;
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
      console.log('Message from client (player id): ' + playerId);
      console.log('Message data: ' + data);

      if (this.state.winner) {
        return false;
      }

      if (this.state.currentTurn === this.getPlayerId((client.sessionId))) {
        // TODO: parse data
        // TODO: Implement action!
      }
  
      /*if (client.sessionId === this.state.currentTurn) {
        const playerIds = Array.from(this.state.players.keys());
  
        const index = data.x + BOARD_WIDTH * data.y;
  
        if (this.state.board[index] === 0) {
          const move = (client.sessionId === playerIds[0]) ? 1 : 2;
          this.state.board[index] = move;
  
          if (this.checkWin(data.x, data.y, move)) {
            this.state.winner = client.sessionId;
  
          } else if (this.checkBoardComplete()) {
            this.state.draw = true;
  
          } else {
            // switch turn
            const otherPlayerSessionId = (client.sessionId === playerIds[0]) ? playerIds[1] : playerIds[0];
  
            this.state.currentTurn = otherPlayerSessionId;
  
            this.setAutoMoveTimeout();
          }
  
        }
      }*/
    }

    doRandomMove() {

    }
  
    setAutoMoveTimeout() {
      if (this.randomMoveTimeout) {
        this.randomMoveTimeout.clear();
      }
  
      // timeout is 3 seconds!
      this.randomMoveTimeout = this.clock.setTimeout(() => this.doRandomMove(), 3 * 1000);
    }
  
    onLeave (client) {
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
