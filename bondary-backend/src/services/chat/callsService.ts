import { prisma } from '../../lib/prisma';

export interface ChatCall {
  id: string;
  chatRoomId?: string;
  initiatorId: string;
  callType: 'voice' | 'video' | 'screen_share';
  status: 'initiated' | 'ringing' | 'ongoing' | 'ended' | 'missed' | 'declined' | 'failed';
  startedAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  endReason?: string;
  recordingUrl?: string;
  metadata: any;
  participants?: CallParticipant[];
  createdAt: Date;
}

export interface CallParticipant {
  id: string;
  callId: string;
  userId: string;
  displayName?: string;
  status: 'invited' | 'ringing' | 'joined' | 'left' | 'declined' | 'missed';
  joinedAt?: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export class CallsService {
  // Initiate a call
  async initiateCall(
    initiatorId: string,
    callType: 'voice' | 'video' | 'screen_share',
    chatRoomId?: string,
    participantIds: string[] = []
  ): Promise<ChatCall> {
    return await prisma.$transaction(async (tx) => {
      // Create call record
      const callResult = await tx.$queryRaw<any[]>`
        INSERT INTO bondarys.chat_calls (initiator_id, call_type, chat_room_id, status)
        VALUES (${initiatorId}::uuid, ${callType}, ${chatRoomId ? chatRoomId : null}::uuid, 'initiated')
        RETURNING *
      `;

      const call = callResult[0];

      // Add initiator as participant
      await tx.$executeRaw`
        INSERT INTO bondarys.chat_call_participants (call_id, user_id, status, joined_at)
        VALUES (${call.id}::uuid, ${initiatorId}::uuid, 'joined', NOW())
      `;

      // Invite other participants
      for (const participantId of participantIds) {
        if (participantId !== initiatorId) {
          await tx.$executeRaw`
            INSERT INTO bondarys.chat_call_participants (call_id, user_id, status)
            VALUES (${call.id}::uuid, ${participantId}::uuid, 'invited')
          `;
        }
      }

      return await this.getCall(call.id) as ChatCall;
    });
  }

  // Get call by ID
  async getCall(callId: string): Promise<ChatCall | null> {
    const callResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_calls WHERE id = ${callId}::uuid
    `;

    if (callResult.length === 0) return null;

    const participants = await this.getCallParticipants(callId);

    return {
      ...this.mapCall(callResult[0]),
      participants,
    };
  }

  // Get call participants
  async getCallParticipants(callId: string): Promise<CallParticipant[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT cp.*, u.display_name
      FROM bondarys.chat_call_participants cp
      LEFT JOIN bondarys.users u ON cp.user_id = u.id
      WHERE cp.call_id = ${callId}::uuid
    `;
    return result.map(row => ({
      ...this.mapParticipant(row),
      displayName: row.display_name,
    }));
  }

  // Update call status
  async updateCallStatus(
    callId: string,
    status: ChatCall['status'],
    endReason?: string
  ): Promise<ChatCall | null> {
    if (status === 'ongoing') {
      await prisma.$executeRaw`
        UPDATE bondarys.chat_calls SET status = ${status}, started_at = NOW() WHERE id = ${callId}::uuid
      `;
    } else if (status === 'ended' || status === 'missed' || status === 'declined' || status === 'failed') {
      if (endReason) {
        await prisma.$executeRaw`
          UPDATE bondarys.chat_calls 
          SET status = ${status}, ended_at = NOW(), end_reason = ${endReason},
              duration_seconds = EXTRACT(EPOCH FROM (NOW() - COALESCE(started_at, created_at)))::INTEGER
          WHERE id = ${callId}::uuid
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE bondarys.chat_calls 
          SET status = ${status}, ended_at = NOW(),
              duration_seconds = EXTRACT(EPOCH FROM (NOW() - COALESCE(started_at, created_at)))::INTEGER
          WHERE id = ${callId}::uuid
        `;
      }
    } else {
      await prisma.$executeRaw`
        UPDATE bondarys.chat_calls SET status = ${status} WHERE id = ${callId}::uuid
      `;
    }

    return await this.getCall(callId);
  }

  // Join a call
  async joinCall(callId: string, userId: string): Promise<CallParticipant | null> {
    const result = await prisma.$queryRaw<any[]>`
      UPDATE bondarys.chat_call_participants 
      SET status = 'joined', joined_at = NOW()
      WHERE call_id = ${callId}::uuid AND user_id = ${userId}::uuid
      RETURNING *
    `;

    if (result.length === 0) {
      // Not invited, add as new participant
      const insertResult = await prisma.$queryRaw<any[]>`
        INSERT INTO bondarys.chat_call_participants (call_id, user_id, status, joined_at)
        VALUES (${callId}::uuid, ${userId}::uuid, 'joined', NOW())
        RETURNING *
      `;
      return this.mapParticipant(insertResult[0]);
    }

    return this.mapParticipant(result[0]);
  }

  // Leave a call
  async leaveCall(callId: string, userId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE bondarys.chat_call_participants 
      SET status = 'left', left_at = NOW()
      WHERE call_id = ${callId}::uuid AND user_id = ${userId}::uuid
    `;

    // Check if all participants have left
    const activeParticipants = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM bondarys.chat_call_participants 
      WHERE call_id = ${callId}::uuid AND status = 'joined'
    `;

    if (Number(activeParticipants[0].count) === 0) {
      await this.updateCallStatus(callId, 'ended', 'all_left');
    }
  }

  // Decline a call
  async declineCall(callId: string, userId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE bondarys.chat_call_participants 
      SET status = 'declined'
      WHERE call_id = ${callId}::uuid AND user_id = ${userId}::uuid
    `;

    // Check if all invited participants have declined
    const pendingParticipants = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM bondarys.chat_call_participants 
      WHERE call_id = ${callId}::uuid AND status IN ('invited', 'ringing', 'joined')
    `;

    if (Number(pendingParticipants[0].count) <= 1) {
      await this.updateCallStatus(callId, 'declined', 'all_declined');
    }
  }

  // Update participant media state
  async updateParticipantState(
    callId: string,
    userId: string,
    updates: { isMuted?: boolean; isVideoOff?: boolean; isScreenSharing?: boolean }
  ): Promise<CallParticipant | null> {
    const setParts: string[] = [];
    const params: any[] = [callId, userId];
    let paramIndex = 3;

    if (updates.isMuted !== undefined) {
      setParts.push(`is_muted = $${paramIndex++}`);
      params.push(updates.isMuted);
    }
    if (updates.isVideoOff !== undefined) {
      setParts.push(`is_video_off = $${paramIndex++}`);
      params.push(updates.isVideoOff);
    }
    if (updates.isScreenSharing !== undefined) {
      setParts.push(`is_screen_sharing = $${paramIndex++}`);
      params.push(updates.isScreenSharing);
    }

    if (setParts.length === 0) return null;

    const result = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE bondarys.chat_call_participants 
       SET ${setParts.join(', ')}
       WHERE call_id = $1::uuid AND user_id = $2::uuid
       RETURNING *`,
      ...params
    );

    return result[0] ? this.mapParticipant(result[0]) : null;
  }

  // Get user's call history
  async getCallHistory(
    userId: string,
    options: { limit?: number; offset?: number; callType?: string } = {}
  ): Promise<ChatCall[]> {
    const { limit = 50, offset = 0, callType } = options;

    let result: any[];
    if (callType) {
      result = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT c.* FROM bondarys.chat_calls c
        JOIN bondarys.chat_call_participants cp ON c.id = cp.call_id
        WHERE cp.user_id = ${userId}::uuid AND c.call_type = ${callType}
        ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      result = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT c.* FROM bondarys.chat_calls c
        JOIN bondarys.chat_call_participants cp ON c.id = cp.call_id
        WHERE cp.user_id = ${userId}::uuid
        ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const calls: ChatCall[] = [];
    for (const row of result) {
      const call = await this.getCall(row.id);
      if (call) calls.push(call);
    }

    return calls;
  }

  // Get active call for a chat room
  async getActiveCall(chatRoomId: string): Promise<ChatCall | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT id FROM bondarys.chat_calls 
      WHERE chat_room_id = ${chatRoomId}::uuid AND status IN ('initiated', 'ringing', 'ongoing')
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return result[0] ? await this.getCall(result[0].id) : null;
  }

  // Get missed calls count
  async getMissedCallsCount(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM bondarys.chat_call_participants cp
      JOIN bondarys.chat_calls c ON cp.call_id = c.id
      WHERE cp.user_id = ${userId}::uuid AND cp.status = 'missed'
        AND c.created_at > NOW() - INTERVAL '7 days'
    `;
    return Number(result[0].count);
  }

  private mapCall(row: any): ChatCall {
    return {
      id: row.id,
      chatRoomId: row.chat_room_id,
      initiatorId: row.initiator_id,
      callType: row.call_type,
      status: row.status,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationSeconds: row.duration_seconds,
      endReason: row.end_reason,
      recordingUrl: row.recording_url,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    };
  }

  private mapParticipant(row: any): CallParticipant {
    return {
      id: row.id,
      callId: row.call_id,
      userId: row.user_id,
      status: row.status,
      joinedAt: row.joined_at,
      leftAt: row.left_at,
      isMuted: row.is_muted,
      isVideoOff: row.is_video_off,
      isScreenSharing: row.is_screen_sharing,
    };
  }
}

export const callsService = new CallsService();
