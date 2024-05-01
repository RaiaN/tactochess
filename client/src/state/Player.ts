import { type, Schema } from "@colyseus/schema";

export class Player extends Schema {
    @type("number") playerId: number;
}