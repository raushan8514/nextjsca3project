import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'lingopro_dev_secret_key_change_in_production_2026';

interface Participant {
  ws: WebSocket;
  userId: string;
  name: string;
  role: string;
  classId: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
}

// Map of classId -> Map of userId -> Participant
const activeRooms = new Map<string, Map<string, Participant>>();

export function setupWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    let currentParticipant: Participant | null = null;

    ws.on('message', (rawMessage: string) => {
      try {
        const data = JSON.parse(rawMessage.toString());

        switch (data.type) {
          case 'join_room': {
            const { token, classId } = data;
            if (!token || !classId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing token or classId' }));
              return;
            }

            // Verify JWT
            let payload: any;
            try {
              payload = jwt.verify(token, JWT_SECRET);
            } catch (err) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired session token' }));
              return;
            }

            const userId = payload.id;
            const name = payload.name;
            const role = payload.role;

            // Verify class exists and is not cancelled
            const liveClass = db.prepare('SELECT * FROM live_classes WHERE id = ?').get(classId) as any;
            if (!liveClass) {
              ws.send(JSON.stringify({ type: 'error', message: 'Classroom not found' }));
              return;
            }

            if (liveClass.status === 'cancelled') {
              ws.send(JSON.stringify({ type: 'error', message: 'This class has been cancelled by the instructor' }));
              return;
            }

            // Check if room exists in memory, else create
            if (!activeRooms.has(classId)) {
              activeRooms.set(classId, new Map());
            }

            const room = activeRooms.get(classId)!;

            // Auto-record attendance on join
            const now = new Date().toISOString();
            try {
              db.prepare(`
                INSERT INTO live_class_attendance (id, class_id, user_id, user_name, user_role, joined_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(class_id, user_id) DO UPDATE SET joined_at = excluded.joined_at
              `).run(`att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, classId, userId, name, role, now);
            } catch (attErr) {
              console.error('Failed to record attendance:', attErr);
            }

            currentParticipant = {
              ws,
              userId,
              name,
              role,
              classId,
              isMuted: false,
              isCameraOff: false,
              isHandRaised: false,
              isScreenSharing: false,
              joinedAt: Date.now()
            };

            room.set(userId, currentParticipant);

            // Notify existing room members that new participant joined
            const participantInfo = {
              userId,
              name,
              role,
              isMuted: false,
              isCameraOff: false,
              isHandRaised: false,
              isScreenSharing: false
            };

            for (const [peerId, peer] of room.entries()) {
              if (peerId !== userId && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: 'peer_joined',
                  peer: participantInfo
                }));
              }
            }

            // Send full room state to the newly joined participant
            const existingPeers = Array.from(room.values())
              .filter(p => p.userId !== userId)
              .map(p => ({
                userId: p.userId,
                name: p.name,
                role: p.role,
                isMuted: p.isMuted,
                isCameraOff: p.isCameraOff,
                isHandRaised: p.isHandRaised,
                isScreenSharing: p.isScreenSharing
              }));

            // Fetch recent chat history
            const recentMessages = db.prepare(`
              SELECT * FROM live_class_messages
              WHERE class_id = ?
              ORDER BY created_at ASC
              LIMIT 50
            `).all(classId);

            ws.send(JSON.stringify({
              type: 'room_joined',
              classId,
              classTitle: liveClass.title,
              instructorId: liveClass.instructor_id,
              isInstructor: role === 'ADMIN' || userId === liveClass.instructor_id,
              peers: existingPeers,
              messages: recentMessages
            }));

            break;
          }

          // WebRTC Signaling Relay (Offer, Answer, ICE Candidate)
          case 'signal': {
            if (!currentParticipant) return;
            const { targetUserId, signal } = data;
            const room = activeRooms.get(currentParticipant.classId);
            if (!room) return;

            const targetPeer = room.get(targetUserId);
            if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
              targetPeer.ws.send(JSON.stringify({
                type: 'signal',
                fromUserId: currentParticipant.userId,
                signal
              }));
            }
            break;
          }

          // Classroom Text Chat
          case 'chat_message': {
            if (!currentParticipant) return;
            const { message, isAnnouncement } = data;
            if (!message || !String(message).trim()) return;

            const room = activeRooms.get(currentParticipant.classId);
            if (!room) return;

            const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const createdAt = new Date().toISOString();
            const announcementFlag = (currentParticipant.role === 'ADMIN' && Boolean(isAnnouncement)) ? 1 : 0;

            // Save to database
            db.prepare(`
              INSERT INTO live_class_messages (id, class_id, user_id, user_name, user_role, message, is_announcement, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              msgId,
              currentParticipant.classId,
              currentParticipant.userId,
              currentParticipant.name,
              currentParticipant.role,
              String(message).trim(),
              announcementFlag,
              createdAt
            );

            // Broadcast message to all participants in room
            const payload = {
              type: 'new_chat_message',
              message: {
                id: msgId,
                class_id: currentParticipant.classId,
                user_id: currentParticipant.userId,
                user_name: currentParticipant.name,
                user_role: currentParticipant.role,
                message: String(message).trim(),
                is_announcement: announcementFlag,
                created_at: createdAt
              }
            };

            for (const peer of room.values()) {
              if (peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify(payload));
              }
            }
            break;
          }

          // Hand Raise Toggle
          case 'toggle_hand': {
            if (!currentParticipant) return;
            currentParticipant.isHandRaised = Boolean(data.isHandRaised);
            const room = activeRooms.get(currentParticipant.classId);
            if (!room) return;

            for (const peer of room.values()) {
              if (peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: 'peer_state_changed',
                  userId: currentParticipant.userId,
                  state: { isHandRaised: currentParticipant.isHandRaised }
                }));
              }
            }
            break;
          }

          // Media state toggle (mic / camera / screen share)
          case 'media_state': {
            if (!currentParticipant) return;
            if (typeof data.isMuted === 'boolean') currentParticipant.isMuted = data.isMuted;
            if (typeof data.isCameraOff === 'boolean') currentParticipant.isCameraOff = data.isCameraOff;
            if (typeof data.isScreenSharing === 'boolean') currentParticipant.isScreenSharing = data.isScreenSharing;

            const room = activeRooms.get(currentParticipant.classId);
            if (!room) return;

            for (const peer of room.values()) {
              if (peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: 'peer_state_changed',
                  userId: currentParticipant.userId,
                  state: {
                    isMuted: currentParticipant.isMuted,
                    isCameraOff: currentParticipant.isCameraOff,
                    isScreenSharing: currentParticipant.isScreenSharing
                  }
                }));
              }
            }
            break;
          }

          // Instructor Moderation: Mute Participant
          case 'instructor_mute': {
            if (!currentParticipant || currentParticipant.role !== 'ADMIN') return;
            const { targetUserId } = data;
            const room = activeRooms.get(currentParticipant.classId);
            if (!room) return;

            const targetPeer = room.get(targetUserId);
            if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
              targetPeer.isMuted = true;
              targetPeer.ws.send(JSON.stringify({ type: 'force_mute' }));

              for (const peer of room.values()) {
                if (peer.ws.readyState === WebSocket.OPEN) {
                  peer.ws.send(JSON.stringify({
                    type: 'peer_state_changed',
                    userId: targetUserId,
                    state: { isMuted: true }
                  }));
                }
              }
            }
            break;
          }

          // Instructor Moderation: Remove Disruptive Participant
          case 'remove_participant': {
            if (!currentParticipant || currentParticipant.role !== 'ADMIN') return;
            const { targetUserId } = data;
            const room = activeRooms.get(currentParticipant.classId);
            if (!room) return;

            const targetPeer = room.get(targetUserId);
            if (targetPeer) {
              if (targetPeer.ws.readyState === WebSocket.OPEN) {
                targetPeer.ws.send(JSON.stringify({
                  type: 'kicked',
                  message: 'You have been removed from the live session by the instructor.'
                }));
                targetPeer.ws.close();
              }
              room.delete(targetUserId);

              for (const peer of room.values()) {
                if (peer.ws.readyState === WebSocket.OPEN) {
                  peer.ws.send(JSON.stringify({
                    type: 'peer_left',
                    userId: targetUserId
                  }));
                }
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message handling error:', err);
      }
    });

    ws.on('close', () => {
      if (currentParticipant) {
        const { classId, userId, joinedAt } = currentParticipant;
        const room = activeRooms.get(classId);
        if (room) {
          room.delete(userId);
          if (room.size === 0) {
            activeRooms.delete(classId);
          } else {
            for (const peer of room.values()) {
              if (peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify({
                  type: 'peer_left',
                  userId
                }));
              }
            }
          }
        }

        // Record leave time & total attendance duration in seconds
        const leftAt = new Date().toISOString();
        const durationSeconds = Math.max(0, Math.round((Date.now() - joinedAt) / 1000));
        try {
          db.prepare(`
            UPDATE live_class_attendance
            SET left_at = ?, duration_seconds = duration_seconds + ?
            WHERE class_id = ? AND user_id = ?
          `).run(leftAt, durationSeconds, classId, userId);
        } catch (updateErr) {
          console.error('Failed to update leave attendance:', updateErr);
        }
      }
    });
  });

  console.log('✅ Real-time WebSocket signaling server mounted on /ws');
}
