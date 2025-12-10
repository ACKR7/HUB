
import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ChatService, Message } from '../services/chat.service';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass],
  template: `
    <div class="flex h-screen bg-slate-100 overflow-hidden">
      <!-- Sidebar (Hidden on mobile usually, but keeping simple grid for now) -->
      <div class="hidden md:flex flex-col w-64 bg-slate-900 text-white flex-shrink-0">
        <div class="p-4 bg-slate-800 border-b border-slate-700 shadow-md">
          <h1 class="text-xl font-bold flex items-center gap-2">
            <span class="text-2xl">💬</span> FriendHub
          </h1>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">ห้องแชท</h3>
            <div class="flex items-center gap-3 p-2 bg-slate-800 rounded-lg cursor-pointer border-l-4 border-purple-500">
              <div class="w-8 h-8 rounded bg-purple-500 flex items-center justify-center">#</div>
              <span class="font-medium">ทั่วไป (General)</span>
            </div>
          </div>
          
          <div>
            <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">สมาชิกออนไลน์</h3>
            <div class="flex items-center gap-3 p-2 rounded-lg opacity-80 hover:opacity-100 transition-opacity">
              <img [src]="currentUser()?.avatar" class="w-8 h-8 rounded-full bg-slate-700">
              <div class="flex flex-col">
                <span class="text-sm font-medium">{{ currentUser()?.username }} (คุณ)</span>
                <span class="text-xs text-green-400">Online</span>
              </div>
            </div>
            <!-- Bot user simulation -->
            <div class="flex items-center gap-3 p-2 rounded-lg opacity-80">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Gemini" class="w-8 h-8 rounded-full bg-slate-700">
              <div class="flex flex-col">
                <span class="text-sm font-medium">Gemini AI</span>
                <span class="text-xs text-green-400">Always On</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-800 border-t border-slate-700">
          <button 
            (click)="authService.logout()" 
            class="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            ออกจากระบบ
          </button>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex-1 flex flex-col h-full relative">
        <!-- Header Mobile -->
        <div class="md:hidden bg-slate-900 text-white p-3 flex justify-between items-center shadow-md">
           <h1 class="text-lg font-bold">FriendHub</h1>
           <button (click)="authService.logout()" class="text-red-400 text-sm">ออก</button>
        </div>

        <!-- Messages Area -->
        <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
          @for (msg of chatService.messages(); track msg.id) {
            <div class="flex w-full" [class.justify-end]="isMyMessage(msg)">
              <div class="flex gap-3 max-w-[85%] md:max-w-[70%]" [class.flex-row-reverse]="isMyMessage(msg)">
                <!-- Avatar -->
                <div class="flex-shrink-0 self-end">
                  <img [src]="msg.avatar" class="w-8 h-8 rounded-full shadow-sm bg-gray-200">
                </div>

                <!-- Bubble -->
                <div class="flex flex-col" [class.items-end]="isMyMessage(msg)" [class.items-start]="!isMyMessage(msg)">
                  <span class="text-xs text-slate-400 mb-1 px-1">
                    {{ msg.username }} &bull; {{ msg.timestamp | date:'HH:mm' }}
                  </span>
                  <div 
                    class="px-4 py-2 rounded-2xl shadow-sm break-words relative"
                    [class.bg-purple-600]="isMyMessage(msg)"
                    [class.text-white]="isMyMessage(msg)"
                    [class.rounded-br-none]="isMyMessage(msg)"
                    [class.bg-white]="!isMyMessage(msg)"
                    [class.text-slate-800]="!isMyMessage(msg)"
                    [class.rounded-bl-none]="!isMyMessage(msg)"
                    [class.border]="!isMyMessage(msg)"
                    [class.border-slate-200]="!isMyMessage(msg)"
                  >
                    @if (msg.isAi) {
                      <div class="flex items-center gap-1 mb-1 opacity-75 text-xs font-bold uppercase tracking-wide">
                        <span class="text-yellow-300">★</span> AI Generated
                      </div>
                    }
                    {{ msg.text }}
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Typing Indicator for AI -->
          @if (chatService.isAiThinking()) {
            <div class="flex w-full">
               <div class="flex gap-3 max-w-[85%]">
                 <div class="flex-shrink-0 self-end">
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Gemini" class="w-8 h-8 rounded-full shadow-sm bg-gray-200">
                 </div>
                 <div class="flex flex-col items-start">
                    <span class="text-xs text-slate-400 mb-1 px-1">Gemini AI</span>
                    <div class="px-4 py-3 rounded-2xl rounded-bl-none bg-white border border-slate-200 shadow-sm flex gap-1">
                      <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                      <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                 </div>
               </div>
            </div>
          }
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-white border-t border-slate-200">
          <form (submit)="sendMessage($event)" class="max-w-4xl mx-auto flex gap-2">
            <button 
              type="button" 
              (click)="chatService.clearChat()"
              class="p-3 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-colors"
              title="ล้างแชท"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
            
            <div class="flex-1 relative">
              <input 
                type="text" 
                [(ngModel)]="newMessage" 
                name="message"
                class="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none"
                placeholder="พิมพ์ข้อความ... (พิมพ์ @ai เพื่อคุยกับบอท)"
                [disabled]="chatService.isAiThinking()"
              >
            </div>

            <button 
              type="submit" 
              [disabled]="!newMessage.trim() || chatService.isAiThinking()"
              class="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full p-3 w-12 h-12 flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
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
      // Auto-scroll when messages change
      this.chatService.messages(); 
      this.scrollToBottom();
    });
    
    // Auto-scroll when AI status changes (e.g. thinking bubble appears)
    effect(() => {
      this.chatService.isAiThinking();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  ngAfterViewChecked() {
    // Ensuring scroll stays at bottom on init/updates
    // this.scrollToBottom(); 
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
