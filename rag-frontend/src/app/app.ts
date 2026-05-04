import { Component,signal} from '@angular/core';
import {PdfUpload} from './pdf-upload/pdf-upload'
import{AskQuestion} from './ask-question/ask-question'
import { ResumeAnalyzer } from './resume-analyzer/resume-analyzer';
import { Navbar } from './navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [
    PdfUpload,
    AskQuestion,
    ResumeAnalyzer,
    Navbar
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('rag-frontend');
}
