import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumeAnalyzer } from './resume-analyzer';

describe('ResumeAnalyzer', () => {
  let component: ResumeAnalyzer;
  let fixture: ComponentFixture<ResumeAnalyzer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeAnalyzer],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeAnalyzer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
