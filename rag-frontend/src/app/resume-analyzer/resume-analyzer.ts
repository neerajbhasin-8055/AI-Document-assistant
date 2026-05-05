import { Component,ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../api/api';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-resume-analyzer',
  imports: [CommonModule],
  templateUrl: './resume-analyzer.html',
  styleUrl: './resume-analyzer.css',
  standalone:true
})
export class ResumeAnalyzer {
  file: File | null = null;
  message: string = '';
  isAnalyzing: boolean = false;
  
  // Results object to store parsed data
  analysisResults: any = null;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  onFileSelected(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.file = selectedFile;
      this.message = "";
      this.analysisResults = null; // Clear old results
    }
  }

  upload() {
    if (!this.file) {
      this.message = "Please upload a resume first";
      return;
    }

    this.isAnalyzing = true;
    this.message = "Analyzing " + this.file.name + "...";

    this.api.uploadResume(this.file).subscribe({
      next: (res: any) => {
        console.log(res)
        this.analysisResults = res; // This now holds {skills: [], missing: [], ...}
        this.message = "Analysis Complete";
        this.isAnalyzing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message = "Analysis failed. Please try again.";
        this.isAnalyzing = false;
        this.cdr.detectChanges();
      }
    });
  }
}