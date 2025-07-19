import { IJoinRoomResp } from "./IJoinRoomResp.js";

export interface ICreateRoomResp extends IJoinRoomResp {
    roomCode: string;
}