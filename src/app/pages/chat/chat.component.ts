import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NgIf, AsyncPipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  currentUser$ = this.authService.currentUser$;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Chat component loaded - User is authenticated!');
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Force logout anyway
        this.router.navigate(['/auth']);
      }
    });
  }
}
