import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api/api';

@Component({
  selector: 'app-jd-analyser',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jd-analyser.html',
  styleUrl: './jd-analyser.css',
})
export class JdAnalyser {
  selectedFiles: File[] = [];
  isAnalyzing: boolean = false;
  results: any = null;
  message: string = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.results = null; // Reset results on new selection
      this.message = `${this.selectedFiles.length} files ready.`;
    }
  }

  upload() {
    if (this.selectedFiles.length < 2) {
      this.message = "Error: Need both Resume and JD.";
      return;
    }

    this.isAnalyzing = true;
    this.message = "Comparing documents...";

    this.api.uploadJd(this.selectedFiles).subscribe({
      next: (res) => {
        console.log(res);
        this.results = res;
        this.isAnalyzing = false;
        this.message = "Analysis Complete!";
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isAnalyzing = false;
        this.message = "Analysis failed. Check backend console.";
        this.cdr.detectChanges();
      }
    });
  }
}