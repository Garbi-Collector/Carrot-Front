import { UserDTO } from './UserDTO';

export interface AuthResponseDTO {
  token: string | null;
  tokenType: string;
  user: UserDTO;
}
