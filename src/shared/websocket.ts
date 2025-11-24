// import { Server } from "http";
// import { WebSocket, WebSocketServer } from "ws";
// import { UserRole, RoomType } from "@prisma/client";
// import { jwtHelpers } from "../helpars/jwtHelpers";
// import config from "../config";
// import prisma from "./prisma";


// // =============================
// // Types & In-Memory Registries
// // =============================
// interface ExtendedWebSocket extends WebSocket {
//   userId?: string;
//   userRole?: UserRole;
//   userName?: string;
//   isAlive?: boolean;
//   path?: string;
// }

// // Online users map
// export const onlineUsers = new Map<string, { socket: ExtendedWebSocket; path: string }>();
// export const userSockets = new Map<string, ExtendedWebSocket>();

// // Room-wise participants (for group chat)
// const roomSockets = new Map<string, Set<string>>();

// // =============================
// // Utils
// // =============================
// function send(ws: ExtendedWebSocket, payload: unknown) {
//   if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
// }

// function sendToUser(userId: string, payload: unknown) {
//   const conn = onlineUsers.get(userId);
//   if (conn?.socket.readyState === WebSocket.OPEN) {
//     conn.socket.send(JSON.stringify(payload));
//     return true;
//   }
//   return false;
// }

// function broadcastToRoom(roomId: string, payload: unknown, exceptUserId?: string) {
//   const members = roomSockets.get(roomId);
//   if (!members) return;
//   members.forEach((uid) => {
//     if (uid !== exceptUserId) sendToUser(uid, payload);
//   });
// }

// // =============================
// // WebSocket Server
// // =============================
// export function setupChatWebSocket(server: Server, path = "/") {
//   const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

//   server.on("upgrade", (request, socket, head) => {
//     if (request.url === path) {
//       wss.handleUpgrade(request, socket, head, (ws) => {
//         wss.emit("connection", ws, request);
//       });
//     }
//   });

//   function heartbeat(ws: ExtendedWebSocket) {
//     ws.isAlive = true;
//   }

//   const interval = setInterval(() => {
//     wss.clients.forEach((ws: ExtendedWebSocket) => {
//       if (ws.isAlive === false) {
//         if (ws.userId) {
//           onlineUsers.delete(ws.userId);
//           userSockets.delete(ws.userId);
//         }
//         return ws.terminate();
//       }
//       ws.isAlive = false;
//       ws.ping();
//     });
//   }, 30000);

//   wss.on("close", () => clearInterval(interval));

//   wss.on("connection", (ws: ExtendedWebSocket, req) => {
//     ws.isAlive = true;
//     ws.path = req.url;
//     send(ws, { event: "info", message: "Connected. Please authenticate." });
//     ws.on("pong", () => heartbeat(ws));

//     ws.on("message", async (raw: string) => {
//       let parsed: any;
//       try {
//         parsed = JSON.parse(raw);
//       } catch {
//         return send(ws, { event: "error", message: "Invalid JSON" });
//       }

//       const { event } = parsed || {};

//       if (!ws.userId && event !== "authenticate")
//         return send(ws, { event: "error", message: "Authenticate first" });

//       try {
//         switch (event) {
//           case "authenticate": {
//             const token = parsed.token;
//             if (!token) return send(ws, { event: "error", message: "Token required" });

//             try {
//               if (!config.jwt.jwt_secret) {
//                 return send(ws, { event: "error", message: "Server configuration error" });
//               }

//               const user = jwtHelpers.verifyToken(token, config.jwt.jwt_secret) as {
//                 id: string;
//                 role: UserRole;
//                 email: string;
//               };

//               // Close previous same-path connection
//               const existing = onlineUsers.get(user.id);
//               if (existing && existing.path === ws.path) {
//                 existing.socket.close();
//                 onlineUsers.delete(user.id);
//               }

//               ws.userId = user.id;
//               ws.userRole = user.role;
//               ws.userName = user.email;
//               onlineUsers.set(user.id, { socket: ws, path: ws.path || "/" });
//               userSockets.set(user.id, ws);

//               send(ws, { event: "authenticated", data: { userId: user.id, role: user.role } });

//               // Send active users
//               const activeTeachers = Array.from(onlineUsers.entries())
//                 .filter(([_, v]) => v.socket.userRole === UserRole.TEACHER)
//                 .map(([id]) => id);
//               const activeStudents = Array.from(onlineUsers.entries())
//                 .filter(([_, v]) => v.socket.userRole === UserRole.USER)
//                 .map(([id]) => id);

//               if (ws.userRole === UserRole.USER) send(ws, { event: "activeTeachers", data: activeTeachers });
//               if (ws.userRole === UserRole.TEACHER) send(ws, { event: "activeStudents", data: activeStudents });

//               broadcastToAll(wss, { event: "userStatus", data: { userId: user.id, isOnline: true } });
//             } catch {
//               send(ws, { event: "error", message: "Invalid token" });
//             }
//             break;
//           }

//           // 1:1 message
//           case "message": {
//             const { receiverId, message, timerId } = parsed;
//             if (!ws.userId || !receiverId || !message) return;

//             let room = await prisma.room.findFirst({
//               where: { OR: [{ senderId: ws.userId, receiverId }, { senderId: receiverId, receiverId: ws.userId }] },
//             });

//             if (!room) room = await prisma.room.create({ data: { senderId: ws.userId, receiverId } });

//             const chat = await prisma.chat.create({
//               data: { senderId: ws.userId, receiverId, roomId: room.id, message, timerId },
//             });

//             // Fetch sender/receiver info
//             const users = await prisma.user.findMany({
//               where: { id: { in: [ws.userId, receiverId] } },
//               select: { id: true, fullName: true, profileImage: true },
//             });

//             const enrichedChat = {
//               ...chat,
//               sender: users.find(u => u.id === ws.userId) || { senderId: chat.senderId },
//               receiver: users.find(u => u.id === receiverId) || { receiverId: chat.receiverId },
//             };

//             // Send to receiver & sender
//             const receiverSocket = userSockets.get(receiverId);
//             if (receiverSocket) send(receiverSocket, { event: "message", data: enrichedChat });
//             send(ws, { event: "message", data: enrichedChat });
//             break;
//           }

//           // Fetch chats with a user
//           case "fetchChats": {
//             const { receiverId } = parsed;
//             if (!ws.userId) return;

//             const room = await prisma.room.findFirst({
//               where: { OR: [{ senderId: ws.userId, receiverId }, { senderId: receiverId, receiverId: ws.userId }] },
//             });
//             if (!room) return send(ws, { event: "fetchChats", data: [] });

//             const chats = await prisma.chat.findMany({ where: { roomId: room.id }, orderBy: { createdAt: "asc" } });
//             await prisma.chat.updateMany({ where: { roomId: room.id, receiverId: ws.userId }, data: { isRead: true } });

//             // Fetch user info
//             const users = await prisma.user.findMany({
//               where: { id: { in: [ws.userId, receiverId] } },
//               select: { id: true, fullName: true, profileImage: true },
//             });

//             const chatsWithUserInfo = chats.map(chat => ({
//               ...chat,
//               sender: users.find(u => u.id === chat.senderId) || { senderId: chat.senderId },
//               receiver: users.find(u => u.id === chat.receiverId) || { receiverId: chat.receiverId },
//             }));

//             send(ws, { event: "fetchChats", data: chatsWithUserInfo });
//             break;
//           }

//           // Online users list
//           case "onlineUsers": {
//             const onlineUserList = Array.from(userSockets.keys());
//             const users = await prisma.user.findMany({
//               where: { id: { in: onlineUserList } },
//               select: { id: true, email: true, role: true },
//             });
//             send(ws, { event: "onlineUsers", data: users });
//             break;
//           }

//           // Default unknown event
//           default:
//             send(ws, { event: "error", message: "Unknown event" });
//         }
//       } catch (err) {
//         send(ws, { event: "error", message: (err as Error)?.message || "Server error" });
//       }
//     });

//     ws.on("close", () => {
//       if (!ws.userId) return;
//       onlineUsers.delete(ws.userId);
//       userSockets.delete(ws.userId);
//       broadcastToAll(wss, { event: "userStatus", data: { userId: ws.userId, isOnline: false } });
//     });
//   });

//   return wss;
// }

// function broadcastToAll(wss: WebSocketServer, payload: object) {
//   wss.clients.forEach(client => {
//     if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(payload));
//   });
// }


import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { UserRole } from "@prisma/client";
import { jwtHelpers } from "../helpars/jwtHelpers";
import config from "../config";
import prisma from "./prisma";

// =============================
// Types & In-Memory Registries
// =============================
interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  userRole?: UserRole;
  userName?: string;
  isAlive?: boolean;
  path?: string;
}

// Online users map
export const onlineUsers = new Map<string, { socket: ExtendedWebSocket; path: string }>();
export const userSockets = new Map<string, ExtendedWebSocket>();

// Room-wise participants (for group chat)
const roomSockets = new Map<string, Set<string>>();

// =============================
// Utils
// =============================
function send(ws: ExtendedWebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function sendToUser(userId: string, payload: unknown) {
  const conn = onlineUsers.get(userId);
  if (conn?.socket.readyState === WebSocket.OPEN) {
    conn.socket.send(JSON.stringify(payload));
    return true;
  }
  return false;
}

function broadcastToRoom(roomId: string, payload: unknown, exceptUserId?: string) {
  const members = roomSockets.get(roomId);
  if (!members) return;
  members.forEach((uid) => {
    if (uid !== exceptUserId) sendToUser(uid, payload);
  });
}

function broadcastToAll(wss: WebSocketServer, payload: object) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(payload));
  });
}

// =============================
// WebSocket Server
// =============================
export function setupChatWebSocket(server: Server, path = "/ws/chat") {
  const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

  // Upgrade HTTP connection to WebSocket
  server.on("upgrade", (request, socket, head) => {
    if (request.url === path) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  // Heartbeat for detecting dead connections
  const heartbeat = (ws: ExtendedWebSocket) => ws.isAlive = true;
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) {
        if (ws.userId) {
          onlineUsers.delete(ws.userId);
          userSockets.delete(ws.userId);
        }
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  wss.on("close", () => clearInterval(interval));

  wss.on("connection", (ws: ExtendedWebSocket, req) => {
    ws.isAlive = true;
    ws.path = req.url;
    send(ws, { event: "info", message: "Connected. Please authenticate." });
    ws.on("pong", () => heartbeat(ws));

    ws.on("message", async (raw: string) => {
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return send(ws, { event: "error", message: "Invalid JSON" });
      }

      const { event } = parsed || {};
      if (!ws.userId && event !== "authenticate") return send(ws, { event: "error", message: "Authenticate first" });

      try {
        switch (event) {
          // =========================
          // Authenticate
          // =========================
          case "authenticate": {
            const token = parsed.token;
            if (!token) return send(ws, { event: "error", message: "Token required" });

            try {
              if (!config.jwt?.jwt_secret) {
                return send(ws, { event: "error", message: "Server configuration error" });
              }

              const user = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as string) as {
                id: string;
                role: UserRole;
                email: string;
              };

              const existing = onlineUsers.get(user.id);
              if (existing && existing.path === ws.path) {
                existing.socket.close();
                onlineUsers.delete(user.id);
              }

              ws.userId = user.id;
              ws.userRole = user.role;
              ws.userName = user.email;
              onlineUsers.set(user.id, { socket: ws, path: ws.path || "/" });
              userSockets.set(user.id, ws);

              send(ws, { event: "authenticated", data: { userId: user.id, role: user.role } });

              // Broadcast user online status
              broadcastToAll(wss, { event: "userStatus", data: { userId: user.id, isOnline: true } });
            } catch {
              send(ws, { event: "error", message: "Invalid token" });
            }
            break;
          }

          // =========================
          // 1:1 Message
          // =========================
          case "message": {
            const { receiverId, message, timerId } = parsed;
            if (!ws.userId || !receiverId || !message) return;

            let room = await prisma.room.findFirst({
              where: { OR: [{ senderId: ws.userId, receiverId }, { senderId: receiverId, receiverId: ws.userId }] },
            });

            if (!room) room = await prisma.room.create({ data: { senderId: ws.userId, receiverId } });

            const chat = await prisma.chat.create({ data: { senderId: ws.userId, receiverId, roomId: room.id, message, timerId } });

            // Fetch sender/receiver info
            const users = await prisma.user.findMany({
              where: { id: { in: [ws.userId, receiverId] } },
              select: { id: true, fullName: true, profileImage: true },
            });

            const enrichedChat = {
              ...chat,
              sender: users.find(u => u.id === ws.userId) || { senderId: chat.senderId },
              receiver: users.find(u => u.id === receiverId) || { receiverId: chat.receiverId },
            };

            const receiverSocket = userSockets.get(receiverId);
            if (receiverSocket) send(receiverSocket, { event: "message", data: enrichedChat });
            send(ws, { event: "message", data: enrichedChat });
            break;
          }

          // =========================
          // Fetch chats with user
          // =========================
          case "fetchChats": {
            const { receiverId } = parsed;
            if (!ws.userId) return;

            const room = await prisma.room.findFirst({
              where: { OR: [{ senderId: ws.userId, receiverId }, { senderId: receiverId, receiverId: ws.userId }] },
            });
            if (!room) return send(ws, { event: "fetchChats", data: [] });

            const chats = await prisma.chat.findMany({ where: { roomId: room.id }, orderBy: { createdAt: "asc" } });
            await prisma.chat.updateMany({ where: { roomId: room.id, receiverId: ws.userId }, data: { isRead: true } });

            const users = await prisma.user.findMany({
              where: { id: { in: [ws.userId, receiverId] } },
              select: { id: true, fullName: true, profileImage: true },
            });

            const chatsWithUserInfo = chats.map(chat => ({
              ...chat,
              sender: users.find(u => u.id === chat.senderId) || { senderId: chat.senderId },
              receiver: users.find(u => u.id === chat.receiverId) || { receiverId: chat.receiverId },
            }));

            send(ws, { event: "fetchChats", data: chatsWithUserInfo });
            break;
          }

          // =========================
          // Message List (last message per user)
          // =========================
          case "messageList": {
            try {
              const rooms = await prisma.room.findMany({
                where: { OR: [{ senderId: ws.userId }, { receiverId: ws.userId }] },
                include: { chat: { orderBy: { createdAt: "desc" }, take: 1 } },
              });

              const userIds = rooms.map(r => r.senderId === ws.userId ? r.receiverId : r.senderId).filter((id): id is string => id !== null);
              const userInfos = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, fullName: true, profileImage: true },
              });

              const onlineUserIds = Array.from(onlineUsers.keys());

              const userWithLastMessages = rooms.map((room) => {
                const otherUserId = room.senderId === ws.userId ? room.receiverId : room.senderId;
                if (!otherUserId) return null;

                const userInfo = userInfos.find(u => u.id === otherUserId);
                const username = userInfo ? `${userInfo.fullName}` : "";

                return {
                  user: {
                    id: otherUserId,
                    username,
                    profileImage: userInfo?.profileImage || "",
                    isOnline: onlineUserIds.includes(otherUserId),
                  },
                  lastMessage: room.chat[0] || null,
                };
              }).filter(u => u !== null);

              send(ws, { event: "messageList", data: userWithLastMessages });
            } catch (error) {
              console.error(error);
              send(ws, { event: "error", message: "Failed to fetch message list" });
            }
            break;
          }

          // =========================
          // Online users list
          // =========================
          case "onlineUsers": {
            const onlineUserList = Array.from(userSockets.keys());
            const users = await prisma.user.findMany({
              where: { id: { in: onlineUserList } },
              select: { id: true, email: true, role: true },
            });
            send(ws, { event: "onlineUsers", data: users });
            break;
          }

          // =========================
          // Unread messages
          // =========================
          case "unReadMessages": {
            const { receiverId } = parsed;
            if (!ws.userId || !receiverId) return;

            const room = await prisma.room.findFirst({
              where: { OR: [{ senderId: ws.userId, receiverId }, { senderId: receiverId, receiverId: ws.userId }] },
            });
            if (!room) return send(ws, { event: "noUnreadMessages", data: [] });

            const unReadMessages = await prisma.chat.findMany({
              where: { roomId: room.id, isRead: false, receiverId: ws.userId },
            });

            send(ws, { event: "unReadMessages", data: { messages: unReadMessages, count: unReadMessages.length } });
            break;
          }

          // =========================
          // Default unknown event
          // =========================
          default:
            send(ws, { event: "error", message: "Unknown event" });
        }
      } catch (err) {
        send(ws, { event: "error", message: (err as Error)?.message || "Server error" });
      }
    });

    // =========================
    // Connection close
    // =========================
    ws.on("close", () => {
      if (!ws.userId) return;
      onlineUsers.delete(ws.userId);
      userSockets.delete(ws.userId);
      broadcastToAll(wss, { event: "userStatus", data: { userId: ws.userId, isOnline: false } });
    });
  });

  return wss;
}
