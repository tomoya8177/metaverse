import ioClient from 'socket.io-client';
import { PUBLIC_SOCKET_SERVER_HOST } from '$env/static/public';
const ENDPOINT = PUBLIC_SOCKET_SERVER_HOST;

const socket = ioClient(ENDPOINT);

export const io = socket;
