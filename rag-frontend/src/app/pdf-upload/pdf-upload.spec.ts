import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfUpload } from './pdf-upload';

describe('PdfUpload', () => {
  let component: PdfUpload;
  let fixture: ComponentFixture<PdfUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfUpload],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfUpload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
