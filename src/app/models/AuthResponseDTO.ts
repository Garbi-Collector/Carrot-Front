import {UserDTO} from "./user.models";


export interface AuthResponseDTO {
  token: string | null;
  tokenType: string;
  user: UserDTO;
}
