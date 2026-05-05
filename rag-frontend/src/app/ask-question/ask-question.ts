import { Component, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../api/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

@Component({
  standalone: true,
  selector: 'app-ask-question',
  imports: [CommonModule, FormsModule],
  templateUrl: './ask-question.html',
  styleUrl: './ask-question.css',
})
export class AskQuestion {
  question: string = '';
  messages: Message[] = []; // Array to hold the chat history
  isFetching: boolean = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef 
  ) {}

  ask() {
    if (!this.question.trim()) return;

    // 1. Add User Message to the chat
    const userMsg: Message = {
      text: this.question,
      sender: 'user',
      timestamp: new Date()
    };
    this.messages.push(userMsg);

    console.log("messages: ",this.messages)
    const currentQuestion = this.question; // Store it for the API call
    this.question = ''; // Clear the input box
    this.isFetching = true;
    this.cdr.detectChanges();

    // 2. Fetch AI Response
    this.api.askQuestion(currentQuestion).subscribe({
      next: (res: any) => {
        const aiMsg: Message = {
          text: res.answer,
          sender: 'ai',
          timestamp: new Date()
        };
        this.messages.push(aiMsg);
        this.isFetching = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (err) => {
        const errMsg: Message = {
          text: "Sorry, I encountered an error. Please try again.",
          sender: 'ai',
          timestamp: new Date()
        };
        this.messages.push(errMsg);
        this.isFetching = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Helper to scroll to the latest message
  private scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
  
}