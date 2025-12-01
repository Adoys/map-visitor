import { ElementRef, Renderer2 } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgControl } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { CheckboxComponent } from './checkbox.component';

describe('CheckboxComponent', () => {
  let component: CheckboxComponent;
  let fixture: ComponentFixture<CheckboxComponent>;
  let mockNgControl: jasmine.SpyObj<NgControl>;
  let mockRenderer2: jasmine.SpyObj<Renderer2>;
  let mockElementRef: ElementRef;

  beforeEach(async () => {
    mockNgControl = jasmine.createSpyObj('NgControl', [], {
      valueAccessor: null,
    });
    mockRenderer2 = jasmine.createSpyObj('Renderer2', [
      'setAttribute',
      'removeAttribute',
      'addClass',
      'removeClass',
      'setStyle',
    ]);
    mockElementRef = new ElementRef(document.createElement('div'));

    await TestBed.configureTestingModule({
      imports: [CheckboxComponent],
      providers: [
        { provide: NgControl, useValue: mockNgControl },
        { provide: Renderer2, useValue: mockRenderer2 },
        { provide: ElementRef, useValue: mockElementRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set the value to 0', () => {
    component.value = null;
    expect(component.value).toBeFalse();
  });

  it('should set the value to true', () => {
    component.value = true;
    expect(component.value).toBeTrue();
  });

  it('should emit new value after change event', () => {
    spyOn(component.valueChange, 'emit');

    const checkbox = fixture.debugElement.query(By.css('input'));
    checkbox.triggerEventHandler('change', { target: { checked: true } });

    expect(component.valueChange.emit).toHaveBeenCalled();
  });

  it('should emit false after change event', () => {
    spyOn(component.valueChange, 'emit');
    spyOn(component, 'onChange');

    const checkbox = fixture.debugElement.query(By.css('input'));
    checkbox.triggerEventHandler('change', { target: {} });

    expect(component['_value']).toBeFalse();
    expect(component.onChange).toHaveBeenCalledWith(false);
    expect(component.valueChange.emit).toHaveBeenCalledWith(false);
  });

  it('should get disable to true', () => {
    component['ngControl'] = { disabled: false } as NgControl;
    spyOn(component, 'disabled').and.returnValue(true);
    expect(component.isDisabled).toBeTrue();
  });

  it('should get required to true', () => {
    component['ngControl'] = { invalid: false, touched: false } as NgControl;
    component['_value'] = false;
    spyOn(component, 'required').and.returnValue(true);
    expect(component.isInvalid).toBeTrue();
  });
});
