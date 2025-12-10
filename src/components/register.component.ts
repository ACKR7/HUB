
import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md backdrop-blur-sm bg-opacity-95">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-slate-800 mb-2">สร้างบัญชีใหม่</h1>
          <p class="text-slate-500">เข้าร่วมกลุ่มเพื่อนของคุณวันนี้</p>
        </div>

        <form (submit)="onSubmit($event)" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">เลือกรูปโปรไฟล์</label>
            <div class="flex justify-center gap-4 mb-4 flex-wrap">
              @for (av of avatars; track av) {
                <button 
                  type="button"
                  (click)="selectedAvatar.set(av)"
                  class="relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all hover:scale-110"
                  [class.border-purple-600]="selectedAvatar() === av"
                  [class.border-transparent]="selectedAvatar() !== av"
                  [class.ring-2]="selectedAvatar() === av"
                  [class.ring-purple-300]="selectedAvatar() === av"
                >
                  <img [src]="av" class="w-full h-full object-cover">
                </button>
              }
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">ชื่อผู้ใช้ (Username)</label>
            <input 
              type="text" 
              [(ngModel)]="username" 
              name="username"
              class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
              placeholder="ตั้งชื่อเล่นของคุณ"
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
            สมัครสมาชิก
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-slate-600">
            มีบัญชีอยู่แล้ว? 
            <button (click)="goToLogin.emit()" class="text-purple-600 font-bold hover:underline">
              เข้าสู่ระบบ
            </button>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  authService = inject(AuthService);
  goToLogin = output<void>();

  username = '';
  error = signal<string>('');
  
  // Example avatars from DiceBear
  avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Willow',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight'
  ];
  
  selectedAvatar = signal<string>(this.avatars[0]);

  onSubmit(e: Event) {
    e.preventDefault();
    if (!this.username.trim()) {
      this.error.set('กรุณากรอกชื่อผู้ใช้');
      return;
    }

    const success = this.authService.register(this.username, this.selectedAvatar());
    if (!success) {
      this.error.set('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
    }
  }
}
