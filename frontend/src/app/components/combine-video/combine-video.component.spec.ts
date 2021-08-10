import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CombineVideoComponent } from './combine-video.component';

describe('CombineVideoComponent', () => {
  let component: CombineVideoComponent;
  let fixture: ComponentFixture<CombineVideoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CombineVideoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CombineVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
