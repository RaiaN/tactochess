import { Schema, type } from "@colyseus/schema";

export class Cell extends Schema {
    @type("number") x: number;
    @type("number") y: number;
    @type("number") occupiedBy: number;
}