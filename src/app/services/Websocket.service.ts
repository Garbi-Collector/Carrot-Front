import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { AuthService } from './AuthService';
import { ChatMessageWS} from '../models/chat.models';
import { UserStatusWS } from '../models/user.models';

import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import {TypingIndicatorWS} from "../models/message.models";

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private stompClient: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();

  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  private messageSubjects: Map<string, Subject<ChatMessageWS>> = new Map();
  private typingSubjects: Map<string, Subject<TypingIndicatorWS>> = new Map();
  private userStatusSubject = new Subject<UserStatusWS>();
  public userStatus$ = this.userStatusSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token || this.stompClient?.connected) return;

    this.stompClient = new Client({
      webSocketFactory: () =>
        new SockJS(`http://localhost:8088/ws?token=${token}`),
      reconnectDelay: 5000,
      onConnect: () => {
        this.connectedSubject.next(true);
        this.subscribeToUserStatus();
      },
      onDisconnect: () => {
        this.connectedSubject.next(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
      },
    });

    this.stompClient.activate();
  }

  disconnect(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.stompClient?.deactivate();
    this.connectedSubject.next(false);
  }

  private subscribeToUserStatus(): void {
    if (!this.stompClient?.connected) return;
    const sub = this.stompClient.subscribe('/topic/user-status', (msg: IMessage) => {
      const status: UserStatusWS = JSON.parse(msg.body);
      this.userStatusSubject.next(status);
    });
    this.subscriptions.set('user-status', sub);
  }

  subscribeToRoom(chatRoomId: number): Observable<ChatMessageWS> {
    const key = `room-${chatRoomId}`;
    if (!this.messageSubjects.has(key)) {
      this.messageSubjects.set(key, new Subject<ChatMessageWS>());
    }

    if (this.stompClient?.connected && !this.subscriptions.has(key)) {
      const sub = this.stompClient.subscribe(
        `/topic/chatroom/${chatRoomId}`,
        (msg: IMessage) => {
          const message: ChatMessageWS = JSON.parse(msg.body);
          this.messageSubjects.get(key)?.next(message);
        }
      );
      this.subscriptions.set(key, sub);
    }

    return this.messageSubjects.get(key)!.asObservable();
  }

  subscribeToTyping(chatRoomId: number): Observable<TypingIndicatorWS> {
    const key = `typing-${chatRoomId}`;
    if (!this.typingSubjects.has(key)) {
      this.typingSubjects.set(key, new Subject<TypingIndicatorWS>());
    }

    if (this.stompClient?.connected && !this.subscriptions.has(key)) {
      const sub = this.stompClient.subscribe(
        `/topic/chatroom/${chatRoomId}/typing`,
        (msg: IMessage) => {
          const indicator: TypingIndicatorWS = JSON.parse(msg.body);
          this.typingSubjects.get(key)?.next(indicator);
        }
      );
      this.subscriptions.set(key, sub);
    }

    return this.typingSubjects.get(key)!.asObservable();
  }

  unsubscribeFromRoom(chatRoomId: number): void {
    const msgKey = `room-${chatRoomId}`;
    const typingKey = `typing-${chatRoomId}`;
    this.subscriptions.get(msgKey)?.unsubscribe();
    this.subscriptions.get(typingKey)?.unsubscribe();
    this.subscriptions.delete(msgKey);
    this.subscriptions.delete(typingKey);
  }

  sendMessage(chatRoomId: number, payload: any): void {
    if (!this.stompClient?.connected) return;
    this.stompClient.publish({
      destination: `/app/chat.sendMessage/${chatRoomId}`,
      body: JSON.stringify(payload),
    });
  }

  sendTyping(chatRoomId: number, payload: any): void {
    if (!this.stompClient?.connected) return;
    this.stompClient.publish({
      destination: `/app/chat.typing/${chatRoomId}`,
      body: JSON.stringify(payload),
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
