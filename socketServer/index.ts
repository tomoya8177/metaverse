import { Client } from "./types/Client";
import { API_ENDPOINT } from "./lib/config";
import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import { DateTime } from "luxon";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
  },
});
console.log({ io });
let clients: Client[] = [];

// Socket.IO stuff goes here
io.on("connection", (socket: any) => {
  console.log("a user connected");
  let roomId: string | null = null;
  // Generate a random username and send it to the client to display it
  let userId: string | null = null;
  // Receive incoming messages and broadcast them
  socket.on("userId", async (id: string) => {
    userId = id;
    console.log({ userId });
    if (!userId) return;
    const user = await axios.get(`${API_ENDPOINT}/api/users/${id}`);

    clients.push({
      userId: id,
      clientId: socket.id,
      startAt: DateTime.now().toISO() || "",
      endAt: "",
    });
  });
  socket.on("enterRoom", (id: string) => {
    socket.join(id);
    roomId = id;
    io.in(roomId).emit("userInRoom", {
      from: userId,
    });
    //get all users in room
    const sockets: Set<string> | undefined =
      io.sockets.adapter.rooms.get(roomId);
    if (!sockets) return;
    Array.from(sockets).forEach((client) => {
      const matchedClient = clients.find((c) => c.clientId === client);
      if (!matchedClient) return;
      socket.emit("userInRoom", {
        from: matchedClient.userId,
      });
    });
  });
  socket.on("position", (position: any) => {
    let client = clients.find((c) => c.clientId === socket.id);
    if (client) client.position = position;
    if (!roomId) return;
    io.in(roomId).emit("position", {
      from: userId,
      position: position,
    });
  });
  socket.on("message", (message: string) => {
    io.emit("message", {
      from: userId,
      message: message,
      time: new Date().toLocaleString(),
    });
  });
  socket.on("updateProfile", (profile: any) => {
    if (!roomId) return;
    io.in(roomId).emit("updateProfile", profile);
  });
  socket.on("disconnect", async () => {
    console.log("disconnected");
    const position = clients.find((c) => c.clientId === socket.id)?.position;
    try {
      await axios.put(`http://localhost:5173/api/users/${userId}`, {
        lastRoom: roomId,
        lastPosition: JSON.stringify(position),
      });
    } catch (e) {
      //console.log(e);
    }
    if (!roomId) return;
    io.in(roomId).emit("userLeftRoom", {
      from: userId,
    });
    const client = clients.find((c) => c.clientId === socket.id);
    if (!client) return;
    client.endAt = DateTime.now().toISO() || "";
    console.log({ client });
    try {
      console.log("posting");
      await axios.post(`http://localhost:5173/api/sessions`, {
        user: client.userId,
        startAt: client.startAt,
        endAt: client.endAt,
        event: roomId,
      });
    } catch (e) {
      console.log("errored");
      //console.log(e);
    }
    clients = clients.filter((c) => c.clientId !== socket.id);
    if (!roomId) return;
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
