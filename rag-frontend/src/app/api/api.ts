import { Component } from '@angular/core';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn:'root'
})
export class ApiService{
  baseUrl = 'http://localhost:3000';
  constructor(private http:HttpClient){}

  uploadPdf(file:File){
    const formData = new FormData();
    formData.append('pdf',file);
    return this.http.post(`${this.baseUrl}/upload-pdf`,formData)
  }
  askQuestion(question:string){
    return this.http.post(`${this.baseUrl}/ask`,{question})
  }
}