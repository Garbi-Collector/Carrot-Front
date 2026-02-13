export interface UserDTO {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  emailVerified: boolean;
  enabled: boolean;
  createdAt: string;
  lastSeenAt?: string;
}
