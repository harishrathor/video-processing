import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitVideoComponent } from './split-video.component';

describe('SplitVideoComponent', () => {
  let component: SplitVideoComponent;
  let fixture: ComponentFixture<SplitVideoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SplitVideoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SplitVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
