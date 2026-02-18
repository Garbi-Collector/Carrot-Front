import {UserDTO} from "./user.models";
import {MessageType} from "./message.models";

export enum ChatRoomType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL'
}


// ========================
// Import de UserDTO
// ========================


// Si después tenés un message.dto.ts separado,
// podés importarlo desde ahí.
export interface MessageDTO {
  id: number;
  content: string;
  type: MessageType;
  sentAt: string;
  sender: UserDTO;
  isEdited: boolean;
}

// ========================
// ChatRoomDTO
// ========================
export interface ChatRoomDTO {
  id: number;
  name: string;
  type: ChatRoomType;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: UserDTO;
  participants: UserDTO[];
  lastMessage?: MessageDTO;
  participantCount: number;
  unreadCount: number;
}

// ========================
// Crear sala
// ========================
export interface ChatRoomCreateDTO {
  name: string;
  type: ChatRoomType;
  description?: string;
  imageUrl?: string;
  participantIds?: number[];
}

// ========================
// Actualizar sala
// ========================
export interface ChatRoomUpdateDTO {
  name?: string;
  description?: string;
  imageUrl?: string;
}

// ========================
// WebSocket message
// ========================
export interface ChatMessageWS {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderUsername: string;
  senderAvatarUrl?: string;
  content: string;
  type: MessageType;
  sentAt: string;
  isEdited: boolean;
}
