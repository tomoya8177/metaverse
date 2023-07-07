import { SOCKET_SERVER_HOST } from '$env/static/private';
import ioClient from 'socket.io-client';
const ENDPOINT = SOCKET_SERVER_HOST;

const socket = ioClient(ENDPOINT);

export const io = socket;
