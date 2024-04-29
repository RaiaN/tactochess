
import { Room, Delayed, Client } from '@colyseus/core';
import { type, Schema, MapSchema, ArraySchema } from '@colyseus/schema';


class State extends Schema {
  @type("string") currentTurn: string;
  @type({ map: "boolean" }) players = new MapSchema<boolean>();
  @type(["number"]) board: number[] = new ArraySchema<number>(0, 0, 0, 0, 0, 0, 0, 0, 0);
  @type("string") winner: string;
  @type("boolean") draw: boolean;
}

export class Tactochess extends Room<State> {
    maxClients = 2;
    randomMoveTimeout: Delayed;
  
    onCreate () {
      console.log('onCreate');
      this.setState(new State());
      this.onMessage("action", (client, message) => this.playerAction(client, message));
    }
  
    onJoin (client: Client) {
      console.log('onJoin');
      this.state.players.set(client.sessionId, true);
  
      if (this.state.players.size === 2) {
        this.state.currentTurn = client.sessionId;
        this.setAutoMoveTimeout();
  
        // lock this room for new users
        this.lock();
      }
    }
  
    playerAction (client: Client, data: any) {
      if (this.state.winner || this.state.draw) {
        return false;
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
  
    setAutoMoveTimeout() {
      if (this.randomMoveTimeout) {
        this.randomMoveTimeout.clear();
      }
  
      // this.randomMoveTimeout = this.clock.setTimeout(() => this.doRandomMove(), TURN_TIMEOUT * 1000);
    }
  
    checkBoardComplete () {
      return this.state.board
        .filter(item => item === 0)
        .length === 0;
    }
  
    onLeave (client) {
      console.log('onLeave');

      this.state.players.delete(client.sessionId);
  
      if (this.randomMoveTimeout) {
        this.randomMoveTimeout.clear()
      }
  
      let remainingPlayerIds = Array.from(this.state.players.keys());
      if (!this.state.winner && !this.state.draw && remainingPlayerIds.length > 0) {
        this.state.winner = remainingPlayerIds[0]
      }
    }
  
  }
