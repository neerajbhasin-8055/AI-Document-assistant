import { Component, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../api/api';
import { CommonModule } from '@angular/common';
import { AskQuestion } from '../ask-question/ask-question';

@Component({
  selector: 'app-pdf-upload',
  standalone: true,
  imports: [AskQuestion, CommonModule],
  templateUrl: './pdf-upload.html',
  styleUrl: './pdf-upload.css',
})
export class PdfUpload {
  file: File | null = null;
  message: string = "";
  fileName: string = "";
  isUploading: boolean = false;
  isSummarizing: boolean = false; // New flag for the summary state
  summary: string = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  onFileSelected(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.file = selectedFile;
      this.fileName = selectedFile.name;
      this.message = ""; 
      this.summary = ""; 
      this.isSummarizing = false;
    }
  }

  upload() {
    if (!this.file) {
      this.message = "Please select a file first";
      return;
    }

    this.isUploading = true;
    this.message = "Uploading " + this.fileName + "...";

    this.api.uploadPdf(this.file).subscribe({
      next: (response: any) => {
        this.isUploading = false;
        this.message = response.message || "Upload successful";
        
        // Start the summary process immediately after upload success
        this.generateSummary();
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Upload failed:", err);
        this.isUploading = false;
        this.message = this.fileName + " upload failed";
        this.cdr.detectChanges();
      }
    });
  }

  generateSummary() {
    this.isSummarizing = true; // Start summary loading
    this.cdr.detectChanges();

    this.api.askQuestion("Summarise this document").subscribe({
      next: (response: any) => {
        const fullText = response.answer || "";
        const cleanText = fullText.replace(/[•\-\*]/g, "").replace(/\s+/g, " ").trim();
        const words = cleanText.split(" ");
        this.summary = words.slice(0, 400).join(" ");
        
        this.isSummarizing = false; // Stop summary loading
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Summary failed:", err);
        this.summary = "Could not generate summary automatically.";
        this.isSummarizing = false;
        this.cdr.detectChanges();
      }
    });
  }
}