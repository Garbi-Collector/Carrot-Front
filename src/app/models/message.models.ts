// ========================
// Enum MessageType
// Debe coincidir con el backend
// ========================
import {UserDTO} from "./user.models";

export enum MessageType {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM'
}

// ========================
// MessageDTO (respuesta del backend)
// ========================
export interface MessageDTO {
  id: number;
  content: string;
  type: MessageType;
  sentAt: string;
  editedAt?: string;
  isEdited: boolean;
  sender: UserDTO;
  chatRoomId: number;
}

// ========================
// Enviar mensaje
// ========================
export interface MessageSendDTO {
  chatRoomId: number;
  content: string;
  type?: MessageType; // por defecto CHAT
}

// ========================
// Editar mensaje
// ========================
export interface MessageEditDTO {
  content: string;
}

// ========================
// Crear chat privado
// ========================
export interface PrivateChatRoomCreateDTO {
  recipientId: number;
}

// ========================
// WebSocket: Typing indicator
// ========================
export interface TypingIndicatorWS {
  chatRoomId: number;
  userId: number;
  username: string;
  isTyping: boolean;
}
