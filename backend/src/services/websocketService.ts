import { Server, Socket } from 'socket.io';
import { Project, ChangeLog } from '../types/models';
import logger from '../utils/logger';
import { WebSocketError, ValidationError } from '../utils/errorHandlers';

let io: Server | null = null;

export const initializeWebSocket = (socketServer: Server): void => {
  io = socketServer;
};

export async function broadcastProjectUpdate(
  projectId: number,
  updateData: Partial<Project>
): Promise<void> {
  try {
    if (io === null) {
      throw new WebSocketError('WebSocket server not initialized');
    }

    const payload = {
      type: 'PROJECT_UPDATE',
      projectId,
      data: updateData,
      timestamp: new Date().toISOString()
    };

    const roomName = `project:${projectId}`;
    io.to(roomName).emit('update', payload);

    const roomSize = io.sockets.adapter.rooms.get(roomName)?.size ?? 0;
    logger.info(`Broadcast project update to room ${roomName}`, {
      projectId,
      connectedClients: roomSize
    });
  } catch (error: any) {
    if (error instanceof WebSocketError) {
      throw error;
    }
    throw new WebSocketError(`Failed to broadcast project update: ${error.message}`);
  }
}

export async function broadcastChangeLogEntry(
  projectId: number,
  changeLog: ChangeLog
): Promise<void> {
  try {
    if (io === null) {
      throw new WebSocketError('WebSocket server not initialized');
    }

    const payload = {
      type: 'CHANGE_LOG_ENTRY',
      projectId,
      changeLog: {
        id: changeLog.id,
        changed_field: changeLog.changed_field,
        old_value: changeLog.old_value,
        new_value: changeLog.new_value,
        changed_by: changeLog.changed_by,
        changed_at: changeLog.changed_at
      },
      timestamp: new Date().toISOString()
    };

    const roomName = `project:${projectId}`;
    io.to(roomName).emit('changeLog', payload);

    logger.info(`Broadcast change log entry to room ${roomName}`, {
      projectId,
      changeLogId: changeLog.id,
      changedField: changeLog.changed_field
    });
  } catch (error: any) {
    if (error instanceof WebSocketError) {
      throw error;
    }
    throw new WebSocketError(`Failed to broadcast change log entry: ${error.message}`);
  }
}

export function joinProjectRoom(socket: Socket, projectId: number): void {
  try {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw new ValidationError('Invalid projectId: must be positive integer');
    }

    const roomName = `project:${projectId}`;
    socket.join(roomName);

    const roomSize = socket.adapter.rooms.get(roomName)?.size ?? 0;
    logger.info(`Socket joined project room`, {
      socketId: socket.id,
      projectId,
      roomSize
    });

    socket.emit('joinedRoom', { projectId, roomSize });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new WebSocketError(`Failed to join project room: ${error.message}`);
  }
}

export function leaveProjectRoom(socket: Socket, projectId: number): void {
  try {
    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw new ValidationError('Invalid projectId: must be positive integer');
    }

    const roomName = `project:${projectId}`;
    socket.leave(roomName);

    const roomSize = socket.adapter.rooms.get(roomName)?.size ?? 0;
    logger.info(`Socket left project room`, {
      socketId: socket.id,
      projectId,
      roomSize
    });

    socket.emit('leftRoom', { projectId });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new WebSocketError(`Failed to leave project room: ${error.message}`);
  }
}