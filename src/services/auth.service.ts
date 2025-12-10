
import { Injectable, signal, computed } from '@angular/core';

export interface User {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline';
  color: string; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Key for local storage
  private readonly STORAGE_KEY = 'friendhub_user';
  private readonly USERS_KEY = 'friendhub_users_db';

  currentUser = signal<User | null>(this.loadUser());
  
  // Simulate a database of users
  usersDb = signal<User[]>(this.loadUsersDb());

  // Neon palette
  private readonly NEON_COLORS = [
    '#FF3131', // Neon Red
    '#FF5722', // Neon Orange
    '#FFC107', // Neon Amber
    '#39FF14', // Neon Green
    '#0FF0FC', // Neon Cyan
    '#007FFF', // Neon Blue
    '#BC13FE', // Neon Purple
    '#FF1493', // Neon Pink
    '#CCFF00', // Electric Lime
    '#FE019A', // Hot Pink
  ];

  constructor() {
    // Sync users across tabs
    window.addEventListener('storage', (event) => {
      if (event.key === this.USERS_KEY) {
        this.usersDb.set(this.loadUsersDb());
      }
    });
  }

  isLoggedIn = computed(() => !!this.currentUser());

  login(username: string): boolean {
    let user = this.usersDb().find(u => u.username === username);
    if (user) {
      // Backwards compatibility: Assign color if missing
      if (!user.color) {
        user = { ...user, color: this.getRandomColor() };
        this.updateUserInDb(user);
      }
      this.currentUser.set(user);
      this.saveUserToStorage(user);
      return true;
    }
    return false;
  }

  register(username: string, avatar: string): boolean {
    if (this.usersDb().some(u => u.username === username)) {
      return false; // User already exists
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      avatar,
      status: 'online',
      color: this.getRandomColor()
    };

    const updatedUsers = [...this.usersDb(), newUser];
    this.usersDb.set(updatedUsers);
    this.saveUsersDb(updatedUsers);
    
    // Auto login after register
    this.currentUser.set(newUser);
    this.saveUserToStorage(newUser);
    return true;
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private getRandomColor(): string {
    return this.NEON_COLORS[Math.floor(Math.random() * this.NEON_COLORS.length)];
  }

  private updateUserInDb(updatedUser: User) {
    const users = this.usersDb().map(u => u.id === updatedUser.id ? updatedUser : u);
    this.usersDb.set(users);
    this.saveUsersDb(users);
  }

  private loadUser(): User | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;
    const user = JSON.parse(stored);
    
    // Ensure loaded user has a color
    if (!user.color) {
      user.color = this.getRandomColor();
      this.saveUserToStorage(user);
    }
    return user;
  }

  private saveUserToStorage(user: User) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  private loadUsersDb(): User[] {
    const stored = localStorage.getItem(this.USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveUsersDb(users: User[]) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }
}
