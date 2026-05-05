import { Component } from '@angular/core';
import { ApiService } from '../api/api';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-resume-analyzer',
  imports: [CommonModule],
  templateUrl: './resume-analyzer.html',
  styleUrl: './resume-analyzer.css',
  standalone:true
})
export class ResumeAnalyzer {}
