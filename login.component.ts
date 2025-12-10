
import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md backdrop-blur-sm bg-opacity-95">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-slate-800 mb-2">เข้าสู่ระบบ</h1>
          <p class="text-slate-500">ยินดีต้อนรับกลับสู่ FriendHub</p>
        </div>

        <form (submit)="onSubmit($event)" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">ชื่อผู้ใช้ (Username)</label>
            <input 
              type="text" 
              [(ngModel)]="username" 
              name="username"
              class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
              placeholder="กรอกชื่อผู้ใช้ของคุณ"
              required
            >
          </div>

          @if (error()) {
            <div class="p-3 bg-red-100 text-red-600 rounded-lg text-sm text-center">
              {{ error() }}
            </div>
          }

          <button 
            type="submit" 
            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 active:scale-[0.98]"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-slate-600">
            ยังไม่มีบัญชี? 
            <button (click)="goToRegister.emit()" class="text-purple-600 font-bold hover:underline">
              สมัครสมาชิก
            </button>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);
  goToRegister = output<void>();
  
  username = '';
  error = signal<string>('');

  onSubmit(e: Event) {
    e.preventDefault();
    if (!this.username.trim()) {
      this.error.set('กรุณากรอกชื่อผู้ใช้');
      return;
    }

    const success