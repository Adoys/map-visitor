import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should define disabled as false', () => {
    fixture.detectChanges();

    expect(component.disabled()).toBeFalse();
  });

  it('should disable component', () => {
    fixture.componentRef.setInput('disabled', true);

    fixture.detectChanges();

    const element = fixture.debugElement.query(By.css('button'));
    expect(element.nativeElement.disabled).toBeTrue();
  });

  it('should apply the correct apply correct status class', () => {
    fixture.componentRef.setInput('status', 'primary');
    fixture.detectChanges();
    let element = fixture.debugElement.query(By.css('button'));
    expect(element.classes['primary']).toBeTrue();

    fixture.componentRef.setInput('status', 'success');
    fixture.detectChanges();
    element = fixture.debugElement.query(By.css('button'));
    expect(element.classes['success']).toBeTrue();

    fixture.componentRef.setInput('status', 'info');
    fixture.detectChanges();
    element = fixture.debugElement.query(By.css('button'));
    expect(element.classes['info']).toBeTrue();

    fixture.componentRef.setInput('status', 'warning');
    fixture.detectChanges();
    element = fixture.debugElement.query(By.css('button'));
    expect(element.classes['warning']).toBeTrue();

    fixture.componentRef.setInput('status', 'danger');
    fixture.detectChanges();
    element = fixture.debugElement.query(By.css('button'));
    expect(element.classes['danger']).toBeTrue();

    fixture.componentRef.setInput('status', 'basic');
    fixture.detectChanges();
    element = fixture.debugElement.query(By.css('button'));
    expect(element.classes['basic']).toBeTrue();
  });

  it('should set fullWidth attribute', () => {
    fixture.componentRef.setInput('fullWidth', true);
    fixture.detectChanges();

    const element = fixture.debugElement.query(By.css('button'));
    expect(element.classes['full-width']).toBeTrue();
  });

  it('should emit onClick event when clicked', () => {
    spyOn(component.clickButton, 'emit');

    const buttonElement = fixture.debugElement.query(By.css('button'));
    buttonElement.triggerEventHandler('click', null);

    expect(component.clickButton.emit).toHaveBeenCalled();
  });
});
