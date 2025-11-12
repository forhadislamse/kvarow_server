
import { WebSocket, WebSocketServer } from "ws";
import prisma from "../shared/prisma";
import config from "../config";
import { Server } from "http";
import { jwtHelpers } from "../helpars/jwtHelpers";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
}

const onlineUsers = new Set<string>();
const userSockets = new Map<string, ExtendedWebSocket>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });
  console.log("WebSocket server is running");

  wss.on("connection", (ws: ExtendedWebSocket) => {
    console.log("A user connected");

    ws.on("message", async (data: string) => {
      try {
        const parsedData = JSON.parse(data);

        switch (parsedData.event) {
          case "authenticate": {
            const token = parsedData.token;
            if (!token) return ws.close();

            const user = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as string);
            if (!user) return ws.close();

            ws.userId = user.id;
            onlineUsers.add(user.id);
            userSockets.set(user.id, ws);

            broadcastToAll(wss, { event: "userStatus", data: { userId: user.id, isOnline: true } });
            break;
          }

          case "message": {
            const { receiverId, message, images } = parsedData;
            if (!ws.userId || !receiverId || !message) return;

            let room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId }
                ]
              }
            });

            if (!room) {
              room = await prisma.room.create({ data: { senderId: ws.userId, receiverId } });
            }

            const chat = await prisma.chat.create({
              data: { senderId: ws.userId, receiverId, roomId: room.id, message, images: { set: images || [] } }
            });

            const receiverSocket = userSockets.get(receiverId);
            if (receiverSocket) receiverSocket.send(JSON.stringify({ event: "message", data: chat }));
            ws.send(JSON.stringify({ event: "message", data: chat }));
            break;
          }

          case "fetchChats": {
            const { receiverId } = parsedData;
            if (!ws.userId || !receiverId) return;

            const room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId }
                ]
              }
            });

            if (!room) return ws.send(JSON.stringify({ event: "noRoomFound" }));

            const chats = await prisma.chat.findMany({
              where: { roomId: room.id },
              orderBy: { createdAt: "asc" }
            });

            await prisma.chat.updateMany({
              where: { roomId: room.id, receiverId: ws.userId },
              data: { isRead: true }
            });

            ws.send(JSON.stringify({ event: "fetchChats", data: chats }));
            break;
          }

          case "messageList": {
            if (!ws.userId) return;
            const rooms = await prisma.room.findMany({
              where: { OR: [{ senderId: ws.userId }, { receiverId: ws.userId }] },
              include: { chats: { orderBy: { createdAt: "desc" }, take: 1 } }
            });

            const userIds = rooms.map(r => (r.senderId === ws.userId ? r.receiverId : r.senderId));
            const userInfos = await prisma.user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, firstName: true, lastName: true, email: true, profileImage: true }
            });

            const userWithLastMessages = rooms.map(r => {
              const otherUserId = r.senderId === ws.userId ? r.receiverId : r.senderId;
              const userInfo = userInfos.find(u => u.id === otherUserId);
              return { user: userInfo, lastMessage: r.chats[0] || null };
            });

            ws.send(JSON.stringify({ event: "messageList", data: userWithLastMessages }));
            break;
          }

          case "groupMessage": {
            const { groupId, message, images } = parsedData;
            if (!ws.userId || !groupId || !message) return;

            const isMember = await prisma.communityMembers.findFirst({ where: { communityId: groupId, userId: ws.userId } });
            if (!isMember) return ws.send(JSON.stringify({ event: "error", message: "Not a community member" }));

            const chat = await prisma.communityMessage.create({
              data: { communityId: groupId, senderId: ws.userId, message, images: images || [] },
              include: { sender: { select: { id: true, firstName: true, lastName: true, email: true, profileImage: true } } }
            });

            const members = await prisma.communityMembers.findMany({ where: { communityId: groupId } });
            members.forEach(m => {
              const memberSocket = userSockets.get(m.userId);
              if (memberSocket) memberSocket.send(JSON.stringify({ event: "groupMessage", data: chat }));
            });
            break;
          }

          case "fetchGroupMessages": {
            const { groupId } = parsedData;
            if (!ws.userId || !groupId) return;

            const isMember = await prisma.communityMembers.findFirst({ where: { communityId: groupId, userId: ws.userId } });
            if (!isMember) return;

            const messages = await prisma.communityMessage.findMany({
              where: { communityId: groupId },
              orderBy: { createdAt: "asc" },
              include: { sender: { select: { id: true, firstName: true, lastName: true, email: true, profileImage: true } } }
            });

            ws.send(JSON.stringify({ event: "fetchGroupMessages", data: messages }));
            break;
          }

          default:
            console.log("Unknown event:", parsedData.event);
        }
      } catch (err) {
        console.error("WebSocket error:", err);
      }
    });

    ws.on("close", () => {
      if (ws.userId) {
        onlineUsers.delete(ws.userId);
        userSockets.delete(ws.userId);
        broadcastToAll(wss, { event: "userStatus", data: { userId: ws.userId, isOnline: false } });
      }
      console.log("User disconnected");
    });
  });

  return wss;
}

function broadcastToAll(wss: WebSocketServer, message: object) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(message));
  });
}


// ===========================
// WebSocket Test Payloads (Postman/WebSocket)
// ===========================

/*

1. Authenticate Event:
{
  "event": "authenticate",
  "token": "YOUR_JWT_TOKEN_HERE"
}

2. Single Private Message:
{
  "event": "message",
  "receiverId": "RECEIVER_USER_ID",
  "message": "Hello! This is a test message",
  "images": []  // optional
}

3. Fetch Private Chats:
{
  "event": "fetchChats",
  "receiverId": "RECEIVER_USER_ID"
}

4. Fetch Message List (Latest message per room):
{
  "event": "messageList"
}

5. Send Group Message (Community Chat):
{
  "event": "groupMessage",
  "groupId": "COMMUNITY_ID",
  "message": "Hello everyone in the community!",
  "images": []  // optional
}

6. Fetch Group Messages:
{
  "event": "fetchGroupMessages",
  "groupId": "COMMUNITY_ID"
}

*/

