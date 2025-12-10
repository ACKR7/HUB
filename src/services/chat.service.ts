
import { Injectable, signal, inject, effect } from '@angular/core';
import { AuthService, User } from './auth.service';
import { GoogleGenAI } from "@google/genai";

export interface Message {
  id: string;
  text: string;
  userId: string;
  username: string; 
  avatar: string;   
  color: string;
  timestamp: number;
  isAi?: boolean;
  // Translation fields
  translation?: string;
  isTranslating?: boolean;
  showTranslation?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private authService = inject(AuthService);
  
  messages = signal<Message[]>([]);
  isAiThinking = signal<boolean>(false);

  private readonly CHAT_KEY = 'friendhub_messages';

  constructor() {
    this.loadMessages();
    
    // Listen for changes from other tabs (Real-time sync)
    window.addEventListener('storage', (event) => {
      if (event.key === this.CHAT_KEY) {
        this.loadMessages();
      }
    });
  }

  async sendMessage(text: string) {
    const user = this.authService.currentUser();
    if (!user) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      text,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      color: user.color || '#8b5cf6', // Use user color
      timestamp: Date.now()
    };

    this.addMessage(newMessage);

    // AI Trigger Logic
    if (text.toLowerCase().includes('@ai') || text.toLowerCase().includes('bot') || text.endsWith('?')) {
      await this.generateAiResponse(text);
    }
  }

  private addMessage(msg: Message) {
    this.messages.update(msgs => {
      const updated = [...msgs, msg];
      // Keep only last 100 messages to prevent overflow
      return updated.length > 100 ? updated.slice(updated.length - 100) : updated;
    });
    this.saveMessages();
  }

  async translateMessage(messageId: string) {
    const msgs = this.messages();
    const index = msgs.findIndex(m => m.id === messageId);
    if (index === -1) return;

    const message = msgs[index];

    // Toggle if already translated
    if (message.translation) {
      this.updateMessage(index, { showTranslation: !message.showTranslation });
      return;
    }

    // Start translation
    this.updateMessage(index, { isTranslating: true, showTranslation: true });

    const apiKey = process.env['API_KEY'];
    if (!apiKey) {
      this.updateMessage(index, { isTranslating: false, translation: 'Missing API Key' });
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const prompt = `
        Translate the following text into Thai. 
        If the text is already mostly in Thai, translate it into English.
        Keep the tone casual and friendly.
        Return ONLY the translated text.
        
        Text to translate: "${message.text}"
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      this.updateMessage(index, { 
        isTranslating: false, 
        translation: response.text.trim() 
      });

    } catch (error) {
      console.error("Translation Error", error);
      this.updateMessage(index, { 
        isTranslating: false, 
        translation: 'Translation failed' 
      });
    }
  }

  private updateMessage(index: number, updates: Partial<Message>) {
    this.messages.update(msgs => {
      const newMsgs = [...msgs];
      newMsgs[index] = { ...newMsgs[index], ...updates };
      return newMsgs;
    });
    this.saveMessages();
  }

  private async generateAiResponse(userPrompt: string) {
    const apiKey = process.env['API_KEY'];
    if (!apiKey) {
      this.addSystemMessage("ขออภัย ไม่พบ API Key สำหรับ Gemini");
      return;
    }

    this.isAiThinking.set(true);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const history = this.messages().slice(-5).map(m => `${m.username}: ${m.text}`).join('\n');
      const prompt = `
        You are "Gemini Friend", a helpful and fun member of a friend group chat.
        Current chat history:
        ${history}
        
        The last message was: "${userPrompt}"
        
        Reply in Thai (ภาษาไทย) naturally, casually, and briefly like a friend. 
        Don't be too formal. Use emojis if appropriate.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        text: response.text.trim(),
        userId: 'ai-bot',
        username: 'Gemini AI',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gemini',
        color: '#FFFFFF', // AI uses White for high contrast glow
        timestamp: Date.now(),
        isAi: true
      };

      this.addMessage(aiMessage);

    } catch (error) {
      console.error("AI Error", error);
      this.addSystemMessage("Gemini กำลังพักผ่อน (เกิดข้อผิดพลาดในการเชื่อมต่อ)");
    } finally {
      this.isAiThinking.set(false);
    }
  }

  private addSystemMessage(text: string) {
    const msg: Message = {
      id: crypto.randomUUID(),
      text,
      userId: 'system',
      username: 'System',
      avatar: 'https://ui-avatars.com/api/?name=Sys&background=000&color=fff',
      color: '#64748b', // Slate for system
      timestamp: Date.now(),
      isAi: true
    };
    this.addMessage(msg);
  }

  private loadMessages() {
    const stored = localStorage.getItem(this.CHAT_KEY);
    if (stored) {
      this.messages.set(JSON.parse(stored));
    } else {
      this.addSystemMessage("ยินดีต้อนรับสู่ FriendHub! เริ่มต้นสนทนากับเพื่อนของคุณได้เลย ลองถามคำถามเพื่อให้ AI ช่วยตอบ");
    }
  }

  private saveMessages() {
    const msgs = this.messages();
    localStorage.setItem(this.CHAT_KEY, JSON.stringify(msgs));
  }

  clearChat() {
    this.messages.set([]);
    localStorage.removeItem(this.CHAT_KEY);
    this.addSystemMessage("ล้างประวัติแชทเรียบร้อยแล้ว");
  }
}
