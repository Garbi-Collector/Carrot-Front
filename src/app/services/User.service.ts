import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDTO } from '../models/ApiResponseDTO';
import { UserDTO, UserUpdateDTO, UserStatusDTO } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API_URL = 'http://localhost:8088/api/users';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserDTO[]> {
    return this.http
      .get<ApiResponseDTO<UserDTO[]>>(this.API_URL)
      .pipe(map((r) => r.data));
  }

  getUserById(id: number): Observable<UserDTO> {
    return this.http
      .get<ApiResponseDTO<UserDTO>>(`${this.API_URL}/${id}`)
      .pipe(map((r) => r.data));
  }

  searchUsers(query: string): Observable<UserDTO[]> {
    const params = new HttpParams().set('query', query);
    return this.http
      .get<ApiResponseDTO<UserDTO[]>>(`${this.API_URL}/search`, { params })
      .pipe(map((r) => r.data));
  }

  getOnlineUsers(): Observable<UserDTO[]> {
    return this.http
      .get<ApiResponseDTO<UserDTO[]>>(`${this.API_URL}/online`)
      .pipe(map((r) => r.data));
  }

  updateCurrentUser(dto: UserUpdateDTO): Observable<UserDTO> {
    return this.http
      .put<ApiResponseDTO<UserDTO>>(`${this.API_URL}/me`, dto)
      .pipe(map((r) => r.data));
  }

  updateUserStatus(dto: UserStatusDTO): Observable<UserDTO> {
    return this.http
      .put<ApiResponseDTO<UserDTO>>(`${this.API_URL}/me/status`, dto)
      .pipe(map((r) => r.data));
  }
}
