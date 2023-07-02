import { XYZ } from "./XYZ";

export type Client = {
  clientId: string;
  userId: string;
  position?: {
    position: XYZ
    rotation: XYZ;
  }
