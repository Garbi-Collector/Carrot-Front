import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDTO } from '../models/ApiResponseDTO';
import { MessageDTO, MessageSendDTO, MessageEditDTO } from '../models/message.models';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly API_URL = 'http://localhost:8088/api/messages';

  constructor(private http: HttpClient) {}

  sendMessage(dto: MessageSendDTO): Observable<MessageDTO> {
    return this.http
      .post<ApiResponseDTO<MessageDTO>>(this.API_URL, dto)
      .pipe(map((r) => r.data));
  }

  getLastMessages(chatRoomId: number, limit = 50): Observable<MessageDTO[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http
      .get<ApiResponseDTO<MessageDTO[]>>(
        `${this.API_URL}/chatroom/${chatRoomId}/recent`,
        { params }
      )
      .pipe(map((r) => r.data));
  }

  editMessage(id: number, dto: MessageEditDTO): Observable<MessageDTO> {
    return this.http
      .put<ApiResponseDTO<MessageDTO>>(`${this.API_URL}/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  deleteMessage(id: number): Observable<void> {
    return this.http
      .delete<ApiResponseDTO<void>>(`${this.API_URL}/${id}`)
      .pipe(map(() => void 0));
  }

  searchMessages(chatRoomId: number, query: string): Observable<MessageDTO[]> {
    const params = new HttpParams().set('query', query);
    return this.http
      .get<ApiResponseDTO<MessageDTO[]>>(
        `${this.API_URL}/chatroom/${chatRoomId}/search`,
        { params }
      )
      .pipe(map((r) => r.data));
  }
}
