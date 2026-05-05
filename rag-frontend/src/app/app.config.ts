import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter,Routes } from '@angular/router';
import { PdfUpload } from './pdf-upload/pdf-upload';
import { ResumeAnalyzer } from './resume-analyzer/resume-analyzer';

const routes:Routes = [
  {path:'',component:PdfUpload},
  {path:'resume-analyzer',component:ResumeAnalyzer}
]
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes)
  ]
};
