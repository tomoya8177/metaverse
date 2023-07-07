import ioClient from 'socket.io-client';
import { SOCKET_SERVER_HOST } from './config';
const ENDPOINT = SOCKET_SERVER_HOST;

const socket = ioClient(ENDPOINT);

export const io = socket;
