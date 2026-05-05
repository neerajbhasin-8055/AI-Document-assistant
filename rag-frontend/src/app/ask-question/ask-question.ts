import { Component, ChangeDetectorRef } from '@angular/core'; // 1. Added ChangeDetectorRef
import { ApiService } from '../api/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-ask-question',
  imports: [CommonModule, FormsModule],
  templateUrl: './ask-question.html',
  styleUrl: './ask-question.css',
})
export class AskQuestion {
  question: string = '';
  answer: string = '';
  isFetching: boolean = false;

  // 2. Inject ChangeDetectorRef into the constructor
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef 
  ) {}

  ask() {
    if (!this.question.trim()) {
      this.answer = "Please ask a question";
      return;
    }

    this.isFetching = true;
    this.answer = '';

    this.api.askQuestion(this.question).subscribe({
      next: (res: any) => {
        // 3. Update the data
        this.answer = res.answer;
        this.isFetching = false;

        // 4. Trigger UI Refresh
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("AI Assistant Error:", err);
        this.answer = "Error getting answer. Please try again.";
        this.isFetching = false;

        // Trigger UI Refresh on error as well
        this.cdr.detectChanges();
      }
    });
  }
}