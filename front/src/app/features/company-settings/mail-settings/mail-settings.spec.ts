import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailSettings } from './mail-settings';

describe('MailSettings', () => {
  let component: MailSettings;
  let fixture: ComponentFixture<MailSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MailSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MailSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
