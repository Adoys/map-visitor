import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseMap } from './base-map';

describe('BaseMap', () => {
  let component: BaseMap;
  let fixture: ComponentFixture<BaseMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BaseMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
