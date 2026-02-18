// Enum equivalente a User.UserStatus de Java
export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY'
}

// ========================
// UserDTO
// ========================
export interface UserDTO {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  status: UserStatus;
  enabled: boolean;
  createdAt: string;   // LocalDateTime -> string ISO
  lastSeenAt?: string; // puede ser null
}

// ========================
// Login
// ========================
export interface UserLoginDTO {
  usernameOrEmail: string;
  password: string;
}

// ========================
// Registro
// ========================
export interface UserRegistrationDTO {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

// ========================
// Actualizar estado
// ========================
export interface UserStatusDTO {
  status: UserStatus;
}

// ========================
// WebSocket status
// ========================
export interface UserStatusWS {
  userId: number;
  username: string;
  status: UserStatus;
  timestamp: string;
}

// ========================
// Actualizar perfil
// ========================
export interface UserUpdateDTO {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}
