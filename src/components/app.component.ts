
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login.component';
import { RegisterComponent } from './components/register.component';
import { ChatComponent } from './components/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, RegisterComponent, ChatComponent],
  template: `
    @if (authService.isLoggedIn()) {
      <app-chat />
    } @else {
      @if (view() === 'login') {
        <app-login (goToRegister)="view.set('register')" />
      } @else {
        <app-register (goToLogin)="view.set('login')" />
      }
    }
  `
})
export class AppComponent {
  authService = inject(AuthService);
  view = signal<'login' | 'register'>('login');
}
