import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { AuthService } from '../../services/AuthService';

import { UserDTO, UserStatus, UserStatusWS } from '../../models/user.models';
import {
  ChatRoomDTO,
  ChatRoomType,
  ChatMessageWS,
  ChatRoomCreateDTO
} from '../../models/chat.models';
import {
  MessageDTO,
  MessageSendDTO,
  MessageType,
  PrivateChatRoomCreateDTO,
  TypingIndicatorWS
} from '../../models/message.models';
import {ChatRoomService} from "../../services/Chat room.service";
import {MessageService} from "../../services/Message.service";
import {UserService} from "../../services/User.service";
import {WebSocketService} from "../../services/Websocket.service";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInputRef!: ElementRef;

  currentUser: UserDTO | null = null;
  chatRooms: ChatRoomDTO[] = [];
  selectedRoom: ChatRoomDTO | null = null;
  messages: MessageDTO[] = [];
  onlineUsers: UserDTO[] = [];
  allUsers: UserDTO[] = [];

  messageContent = '';
  searchRoomQuery = '';
  searchUserQuery = '';
  typingUsers: Map<number, string> = new Map();
  typingTimeout: any;

  // UI state
  showNewChatModal = false;
  showCreateGroupModal = false;
  showRoomInfo = false;
  showUserSearch = false;
  isLoadingMessages = false;
  sidebarTab: 'chats' | 'users' = 'chats';

  // Group creation
  newGroupName = '';
  newGroupDescription = '';
  selectedUserIds: number[] = [];

  private subscriptions = new Subscription();
  private typingSubject = new Subject<void>();
  private shouldScrollBottom = false;

  readonly UserStatus = UserStatus;
  readonly ChatRoomType = ChatRoomType;

  constructor(
    private authService: AuthService,
    private chatRoomService: ChatRoomService,
    private messageService: MessageService,
    private userService: UserService,
    private wsService: WebSocketService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.initWebSocket();
    this.loadChatRooms();
    this.loadOnlineUsers();
    this.loadAllUsers();
    this.setupTypingDebounce();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
      this.shouldScrollBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.wsService.disconnect();
  }

  // ─── WebSocket ───────────────────────────────────────────────

  private initWebSocket(): void {
    this.wsService.connect();

    const statusSub = this.wsService.userStatus$.subscribe((status: UserStatusWS) => {
      this.updateUserStatus(status);
    });
    this.subscriptions.add(statusSub);
  }

  private subscribeToRoom(room: ChatRoomDTO): void {
    const msgSub = this.wsService.subscribeToRoom(room.id).subscribe((msg: ChatMessageWS) => {
      if (this.selectedRoom?.id === msg.chatRoomId) {
        const msgDTO: MessageDTO = {
          id: msg.id,
          content: msg.content,
          type: msg.type as any,
          sentAt: msg.sentAt,
          isEdited: msg.isEdited,
          sender: {
            id: msg.senderId,
            username: msg.senderUsername,
            avatarUrl: msg.senderAvatarUrl,
          } as UserDTO,
          chatRoomId: msg.chatRoomId,
        };
        this.messages = [...this.messages, msgDTO];
        this.shouldScrollBottom = true;
        this.cdr.detectChanges();
      }
      this.updateRoomLastMessage(msg);
    });

    const typingSub = this.wsService.subscribeToTyping(room.id).subscribe((indicator: TypingIndicatorWS) => {
      if (indicator.userId === this.currentUser?.id) return;
      if (indicator.isTyping) {
        this.typingUsers.set(indicator.userId, indicator.username);
      } else {
        this.typingUsers.delete(indicator.userId);
      }
      this.cdr.detectChanges();
    });

    this.subscriptions.add(msgSub);
    this.subscriptions.add(typingSub);
  }

  // ─── Data loading ────────────────────────────────────────────

  loadChatRooms(): void {
    this.chatRoomService.getCurrentUserChatRooms().subscribe({
      next: (rooms) => {
        console.log('Rooms cargadas:', rooms);  // ← agregá esto
        this.chatRooms = rooms;
      },
      error: (e) => console.error('Error loading rooms', e),
    });
  }

  loadOnlineUsers(): void {
    this.userService.getOnlineUsers().subscribe({
      next: (users) => (this.onlineUsers = users),
      error: (e) => console.error('Error loading online users', e),
    });
  }

  loadAllUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => (this.allUsers = users),
      error: (e) => console.error('Error loading users', e),
    });
  }

  selectRoom(room: ChatRoomDTO): void {
    if (this.selectedRoom?.id === room.id) return;

    if (this.selectedRoom) {
      this.wsService.unsubscribeFromRoom(this.selectedRoom.id);
    }

    this.selectedRoom = room;
    this.messages = [];
    this.typingUsers.clear();
    this.isLoadingMessages = true;
    this.subscribeToRoom(room);

    this.messageService.getLastMessages(room.id, 50).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.isLoadingMessages = false;
        this.shouldScrollBottom = true;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Error loading messages', e);
        this.isLoadingMessages = false;
      },
    });
  }

  // ─── Messaging ───────────────────────────────────────────────

  sendMessage(): void {
    const content = this.messageContent.trim();
    if (!content || !this.selectedRoom) return;

    const dto: MessageSendDTO = {
      chatRoomId: this.selectedRoom.id,
      content,
      type: MessageType.CHAT,
    };

    this.messageContent = '';
    this.wsService.sendMessage(this.selectedRoom.id, dto);

    // Stop typing indicator
    this.sendTypingIndicator(false);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onInput(): void {
    this.typingSubject.next();
  }

  private setupTypingDebounce(): void {
    const typingSub = this.typingSubject.pipe(debounceTime(300)).subscribe(() => {
      if (this.messageContent.trim()) {
        this.sendTypingIndicator(true);
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => this.sendTypingIndicator(false), 2000);
      }
    });
    this.subscriptions.add(typingSub);
  }

  private sendTypingIndicator(isTyping: boolean): void {
    if (!this.selectedRoom || !this.currentUser) return;
    this.wsService.sendTyping(this.selectedRoom.id, {
      chatRoomId: this.selectedRoom.id,
      userId: this.currentUser.id,
      username: this.currentUser.username,
      isTyping,
    });
  }

  // ─── Room creation ────────────────────────────────────────────

  openPrivateChat(user: UserDTO): void {
    const dto: PrivateChatRoomCreateDTO = { recipientId: user.id };
    this.chatRoomService.createOrGetPrivateChatRoom(dto).subscribe({
      next: (room) => {
        const existing = this.chatRooms.find((r) => r.id === room.id);
        if (!existing) this.chatRooms = [room, ...this.chatRooms];
        this.selectRoom(room);
        this.showNewChatModal = false;
      },
      error: (e) => console.error('Error creating private chat', e),
    });
  }

  createGroupRoom(): void {
    if (!this.newGroupName.trim()) return;

    const dto: ChatRoomCreateDTO = {
      name: this.newGroupName.trim(),
      type: ChatRoomType.GROUP,
      description: this.newGroupDescription.trim() || undefined,
      participantIds: this.selectedUserIds,
    };

    this.chatRoomService.createGroupChatRoom(dto).subscribe({
      next: (room) => {
        this.chatRooms = [room, ...this.chatRooms];
        this.selectRoom(room);
        this.resetGroupForm();
        this.showCreateGroupModal = false;
      },
      error: (e) => console.error('Error creating group', e),
    });
  }

  toggleUserSelection(userId: number): void {
    const idx = this.selectedUserIds.indexOf(userId);
    if (idx >= 0) {
      this.selectedUserIds = this.selectedUserIds.filter((id) => id !== userId);
    } else {
      this.selectedUserIds = [...this.selectedUserIds, userId];
    }
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUserIds.includes(userId);
  }

  private resetGroupForm(): void {
    this.newGroupName = '';
    this.newGroupDescription = '';
    this.selectedUserIds = [];
  }

  leaveRoom(): void {
    if (!this.selectedRoom) return;
    this.chatRoomService.leaveChatRoom(this.selectedRoom.id).subscribe({
      next: () => {
        this.chatRooms = this.chatRooms.filter((r) => r.id !== this.selectedRoom?.id);
        this.selectedRoom = null;
        this.messages = [];
      },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private updateUserStatus(status: UserStatusWS): void {
    this.onlineUsers = this.onlineUsers.map((u) =>
      u.id === status.userId ? { ...u, status: status.status } : u
    );
    this.allUsers = this.allUsers.map((u) =>
      u.id === status.userId ? { ...u, status: status.status } : u
    );
  }

  private updateRoomLastMessage(msg: ChatMessageWS): void {
    this.chatRooms = this.chatRooms.map((room) => {
      if (room.id === msg.chatRoomId) {
        return {
          ...room,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            type: msg.type as any,
            sentAt: msg.sentAt,
            isEdited: msg.isEdited,
            sender: { id: msg.senderId, username: msg.senderUsername } as UserDTO,
          } as MessageDTO,
        };
      }
      return room;
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  getRoomName(room: ChatRoomDTO): string {
    if (room.type === ChatRoomType.PRIVATE) {
      const other = room.participants.find((p) => p.id !== this.currentUser?.id);
      return other?.fullName || other?.username || room.name;
    }
    return room.name;
  }

  getRoomAvatar(room: ChatRoomDTO): string | null {
    if (room.type === ChatRoomType.PRIVATE) {
      const other = room.participants.find((p) => p.id !== this.currentUser?.id);
      return other?.avatarUrl || null;
    }
    return room.imageUrl || null;
  }

  getOtherParticipant(room: ChatRoomDTO): UserDTO | null {
    return room.participants.find((p) => p.id !== this.currentUser?.id) || null;
  }

  getStatusColor(status: UserStatus): string {
    switch (status) {
      case UserStatus.ONLINE: return '#96B960';
      case UserStatus.AWAY: return '#FFC857';
      case UserStatus.BUSY: return '#D84315';
      default: return '#9A6148';
    }
  }

  isOwnMessage(msg: MessageDTO): boolean {
    return msg.sender.id === this.currentUser?.id;
  }

  getTypingText(): string {
    const names = Array.from(this.typingUsers.values());
    if (names.length === 0) return '';
    if (names.length === 1) return `${names[0]} está escribiendo...`;
    return `${names.slice(0, 2).join(', ')} están escribiendo...`;
  }

  get filteredRooms(): ChatRoomDTO[] {
    if (!this.searchRoomQuery) return this.chatRooms;
    const q = this.searchRoomQuery.toLowerCase();
    return this.chatRooms.filter((r) =>
      this.getRoomName(r).toLowerCase().includes(q)
    );
  }

  get filteredUsers(): UserDTO[] {
    if (!this.searchUserQuery) return this.allUsers;
    const q = this.searchUserQuery.toLowerCase();
    return this.allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q)
    );
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  formatRoomTime(room: ChatRoomDTO): string {
    const dateStr = room.lastMessage?.sentAt || room.updatedAt;
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return this.formatTime(dateStr);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.wsService.disconnect();
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth']),
      error: () => this.router.navigate(['/auth']),
    });
  }
}
