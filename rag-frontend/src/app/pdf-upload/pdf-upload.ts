import { Component } from '@angular/core';
import {ApiService} from '../api/api'
import { CommonModule } from '@angular/common';
import { AskQuestion } from '../ask-question/ask-question';
@Component({
  selector: 'app-pdf-upload',
  imports: [AskQuestion],
  templateUrl: './pdf-upload.html',
  styleUrl: './pdf-upload.css',
})
export class PdfUpload {
  constructor(private api:ApiService){}
  file : any;
  message : string = "";
  fileName : string = "";
  onFileSelected(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.file = selectedFile;
      this.fileName = selectedFile.name; // Store the name here
    }
  }

  upload(){

    if(!this.file){
      this.message = "Please select a file first";
      return;
    }
    this.api.uploadPdf(this.file).subscribe({ //  we use subscribe because response is asynchronous
      next : () =>{
        this.message = this.fileName+" uploaded successfully"
      },
      error:()=>{
        this.message = this.fileName+" Upload failed"
      }
    })
  }
}
