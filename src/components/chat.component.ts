
import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ChatService, Message } from '../services/chat.service';
import { DatePipe, NgClass, CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass, CommonModule],
  template: `
    <div class="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <!-- Sidebar -->
      <div class="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white flex-shrink-0">
        <div class="p-4 bg-slate-900 border-b border-slate-800 shadow-lg z-10">
          <h1 class="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            <span class="text-2xl">✨</span> FriendHub
          </h1>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Rooms</h3>
            <div class="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl cursor-pointer border border-slate-700/50 hover:bg-slate-800 transition-colors shadow-lg shadow-purple-900/10">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">#</div>
              <span class="font-medium text-slate-200">ทั่วไป (General)</span>
            </div>
          </div>
          
          <div>
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Members ({{ authService.usersDb().length + 1 }})</h3>
            <div class="space-y-2">
               <!-- Bot user -->
              <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div class="relative">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Gemini" class="w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-800">
                  <div class="absolute bottom-0 right-0 w-3 h-3 bg-blue-400 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-slate-300">Gemini AI</span>
                  <span class="text-xs text-blue-400">Bot</span>
                </div>
              </div>

              <!-- Registered Users List -->
              @for (user of authService.usersDb(); track user.id) {
                <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <div class="relative">
                    <img [src]="user.avatar" class="w-10 h-10 rounded-full border-2 border-slate-700">
                    <!-- Green dot if current user, otherwise generic status -->
                    <div 
                      class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900"
                      [class.bg-green-500]="user.id === currentUser()?.id"
                      [class.shadow-[0_0_8px_rgba(34,197,94,0.6)]]="user.id === currentUser()?.id"
                      [class.bg-slate-500]="user.id !== currentUser()?.id"
                    ></div>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-slate-200 truncate max-w-[120px]" [style.color]="user.color">{{ user.username }}</span>
                    <span class="text-xs text-slate-500">
                      {{ user.id === currentUser()?.id ? 'Online (You)' : 'Member' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-900 border-t border-slate-800">
          <button 
            (click)="authService.logout()" 
            class="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all text-sm font-medium border border-slate-700 hover:border-red-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            ออกจากระบบ
          </button>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex-1 flex flex-col h-full relative bg-slate-950">
        <!-- Header Mobile -->
        <div class="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg border-b border-slate-800 z-20">
           <h1 class="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">FriendHub</h1>
           <button (click)="authService.logout()" class="text-slate-400 text-sm">ออก</button>
        </div>

        <!-- Messages Area -->
        <div #scrollContainer class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar">
          @for (msg of chatService.messages(); track msg.id) {
            <div class="flex w-full group" [class.justify-end]="isMyMessage(msg)">
              <div class="flex gap-3 max-w-[85%] md:max-w-[70%]" [class.flex-row-reverse]="isMyMessage(msg)">
                <!-- Avatar -->
                <div class="flex-shrink-0 self-end opacity-0 group-hover:opacity-100 transition-opacity duration-300" [class.opacity-100]="!isMyMessage(msg)">
                  <img [src]="msg.avatar" class="w-8 h-8 rounded-full shadow-lg border border-slate-700 bg-slate-800">
                </div>

                <!-- Bubble Container -->
                <div class="flex flex-col" [class.items-end]="isMyMessage(msg)" [class.items-start]="!isMyMessage(msg)">
                  <span class="text-[10px] text-slate-500 mb-1 px-1 font-medium tracking-wide">
                    {{ msg.username }}
                  </span>
                  
                  <!-- Glowing Bubble -->
                  <div 
                    class="px-5 py-3 rounded-2xl break-words relative transition-all duration-300 text-white font-medium tracking-wide"
                    [class.rounded-br-sm]="isMyMessage(msg)"
                    [class.rounded-bl-sm]="!isMyMessage(msg)"
                    [style.backgroundColor]="msg.color || '#8b5cf6'"
                    [style.boxShadow]="'0 0 15px ' + (msg.color || '#8b5cf6') + '66'"
                    [style.textShadow]="'0 1px 2px rgba(0,0,0,0.3)'"
                  >
                    @if (msg.isAi) {
                      <div class="flex items-center gap-1 mb-1 text-white/90 text-[10px] font-bold uppercase tracking-wider border-b border-white/20 pb-1 w-full">
                        <span class="text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]">★</span> AI Generated
                      </div>
                    }
                    
                    <div class="font-sans">
                      {{ msg.text }}
                    </div>

                    <!-- Translation Section -->
                    @if (msg.showTranslation) {
                      <div class="mt-2 pt-2 border-t border-white/20 text-sm italic text-white/90">
                        @if (msg.isTranslating) {
                           <div class="flex items-center gap-2">
                             <div class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             <span class="text-xs">Translating...</span>
                           </div>
                        } @else {
                           <div class="flex items-start gap-1">
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-1 opacity-70 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                             <span>{{ msg.translation }}</span>
                           </div>
                        }
                      </div>
                    }
                  </div>
                  
                  <div class="flex items-center gap-2 mt-1 px-1">
                    <span class="text-[10px] text-slate-600">
                      {{ msg.timestamp | date:'HH:mm' }}
                    </span>
                    
                    <!-- Translate Button -->
                    <button 
                      (click)="chatService.translateMessage(msg.id)"
                      class="text-[10px] text-slate-600 hover:text-slate-300 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      [class.text-slate-300]="msg.showTranslation"
                      [class.opacity-100]="msg.showTranslation"
                      title="แปลภาษา"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
                      {{ msg.showTranslation ? 'ซ่อนแปล' : 'แปล' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Typing Indicator -->
          @if (chatService.isAiThinking()) {
            <div class="flex w-full">
               <div class="flex gap-3 max-w-[85%]">
                 <div class="flex-shrink-0 self-end">
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Gemini" class="w-8 h-8 rounded-full shadow-lg border border-slate-700 bg-slate-800">
                 </div>
                 <div class="flex flex-col items-start">
                    <span class="text-[10px] text-slate-500 mb-1 px-1">Gemini AI</span>
                    <div class="px-5 py-4 rounded-2xl rounded-bl-sm bg-slate-800 border border-slate-700 shadow-[0_0_15px_rgba(255,255,255,0.1)] flex gap-1.5">
                      <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce shadow-[0_0_8px_#60a5fa]"></div>
                      <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75 shadow-[0_0_8px_#60a5fa]"></div>
                      <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150 shadow-[0_0_8px_#60a5fa]"></div>
                    </div>
                 </div>
               </div>
            </div>
          }
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-slate-900 border-t border-slate-800 z-20">
          <form (submit)="sendMessage($event)" class="max-w-4xl mx-auto flex gap-3">
            <button 
              type="button" 
              (click)="chatService.clearChat()"
              class="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
              title="ล้างแชท"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
            
            <div class="flex-1 relative group">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <input 
                type="text" 
                [(ngModel)]="newMessage" 
                name="message"
                class="relative w-full pl-6 pr-12 py-3.5 bg-slate-800 text-white border border-slate-700 rounded-full focus:ring-0 focus:border-slate-600 placeholder:text-slate-500 transition-all outline-none shadow-inner"
                placeholder="พิมพ์ข้อความ... (@ai เพื่อคุยกับบอท)"
                [disabled]="chatService.isAiThinking()"
                autocomplete="off"
              >
            </div>

            <button 
              type="submit" 
              [disabled]="!newMessage.trim() || chatService.isAiThinking()"
              class="relative group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
              <div class="relative bg-slate-900 text-white rounded-full p-3.5 w-12 h-12 flex items-center justify-center border border-slate-700 group-hover:border-slate-600 group-active:scale-95 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ChatComponent implements AfterViewChecked {
  authService = inject(AuthService);
  chatService = inject(ChatService);
  
  currentUser = this.authService.currentUser;
  newMessage = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor() {
    effect(() => {
      this.chatService.messages(); 
      this.scrollToBottom();
    });
    
    effect(() => {
      this.chatService.isAiThinking();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  ngAfterViewChecked() {
    // Ensuring scroll stays at bottom on init/updates is handled by effects primarily
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  isMyMessage(msg: Message): boolean {
    return msg.userId === this.currentUser()?.id;
  }

  sendMessage(e: Event) {
    e.preventDefault();
    if (!this.newMessage.trim()) return;
    
    this.chatService.sendMessage(this.newMessage);
    this.newMessage = '';
    
    setTimeout(() => this.scrollToBottom(), 50);
  }
}
