import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JdAnalyser } from './jd-analyser';

describe('JdAnalyser', () => {
  let component: JdAnalyser;
  let fixture: ComponentFixture<JdAnalyser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JdAnalyser],
    }).compileComponents();

    fixture = TestBed.createComponent(JdAnalyser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
