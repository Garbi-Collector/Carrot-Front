import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDTO } from '../models/ApiResponseDTO';
import {
  ChatRoomDTO,
  ChatRoomCreateDTO,
  ChatRoomUpdateDTO,
} from '../models/chat.models';
import { PrivateChatRoomCreateDTO } from '../models/message.models';

@Injectable({ providedIn: 'root' })
export class ChatRoomService {
  private readonly API_URL = 'http://localhost:8088/api/chatrooms';

  constructor(private http: HttpClient) {}

  getCurrentUserChatRooms(): Observable<ChatRoomDTO[]> {
    return this.http
      .get<ApiResponseDTO<ChatRoomDTO[]>>(this.API_URL)
      .pipe(map((r) => r.data));
  }

  getChatRoomById(id: number): Observable<ChatRoomDTO> {
    return this.http
      .get<ApiResponseDTO<ChatRoomDTO>>(`${this.API_URL}/${id}`)
      .pipe(map((r) => r.data));
  }

  createGroupChatRoom(dto: ChatRoomCreateDTO): Observable<ChatRoomDTO> {
    return this.http
      .post<ApiResponseDTO<ChatRoomDTO>>(`${this.API_URL}/group`, dto)
      .pipe(map((r) => r.data));
  }

  createOrGetPrivateChatRoom(
    dto: PrivateChatRoomCreateDTO
  ): Observable<ChatRoomDTO> {
    return this.http
      .post<ApiResponseDTO<ChatRoomDTO>>(`${this.API_URL}/private`, dto)
      .pipe(map((r) => r.data));
  }

  updateChatRoom(id: number, dto: ChatRoomUpdateDTO): Observable<ChatRoomDTO> {
    return this.http
      .put<ApiResponseDTO<ChatRoomDTO>>(`${this.API_URL}/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  addParticipant(roomId: number, userId: number): Observable<ChatRoomDTO> {
    return this.http
      .post<ApiResponseDTO<ChatRoomDTO>>(
        `${this.API_URL}/${roomId}/participants/${userId}`,
        {}
      )
      .pipe(map((r) => r.data));
  }

  removeParticipant(roomId: number, userId: number): Observable<ChatRoomDTO> {
    return this.http
      .delete<ApiResponseDTO<ChatRoomDTO>>(
        `${this.API_URL}/${roomId}/participants/${userId}`
      )
      .pipe(map((r) => r.data));
  }

  leaveChatRoom(id: number): Observable<void> {
    return this.http
      .post<ApiResponseDTO<void>>(`${this.API_URL}/${id}/leave`, {})
      .pipe(map(() => void 0));
  }

  deleteChatRoom(id: number): Observable<void> {
    return this.http
      .delete<ApiResponseDTO<void>>(`${this.API_URL}/${id}`)
      .pipe(map(() => void 0));
  }

  searchChatRooms(query: string): Observable<ChatRoomDTO[]> {
    const params = new HttpParams().set('query', query);
    return this.http
      .get<ApiResponseDTO<ChatRoomDTO[]>>(`${this.API_URL}/search`, { params })
      .pipe(map((r) => r.data));
  }
}
