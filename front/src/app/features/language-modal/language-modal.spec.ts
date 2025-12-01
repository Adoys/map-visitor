import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageModal } from './language-modal';

describe('LanguageModal', () => {
  let component: LanguageModal;
  let fixture: ComponentFixture<LanguageModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanguageModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
