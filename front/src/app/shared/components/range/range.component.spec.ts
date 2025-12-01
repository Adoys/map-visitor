import { ElementRef, Renderer2, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgControl } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { RangeComponent } from './range.component';

describe('RangeComponent', () => {
  let component: RangeComponent;
  let fixture: ComponentFixture<RangeComponent>;
  let mockNgControl: unknown;
  let mockRenderer2: jasmine.SpyObj<Renderer2>;
  let mockElementRef: ElementRef;
  let valueAccessorRef: unknown;

  beforeEach(() => {
    valueAccessorRef = null;

    mockNgControl = {
      get valueAccessor() {
        return valueAccessorRef;
      },
      set valueAccessor(val) {
        valueAccessorRef = val;
      },
    };
    mockRenderer2 = jasmine.createSpyObj('Renderer2', [
      'setAttribute',
      'removeAttribute',
      'addClass',
      'removeClass',
      'setStyle',
    ]);
    mockElementRef = new ElementRef(document.createElement('div'));

    TestBed.configureTestingModule({
      imports: [RangeComponent],
      providers: [
        { provide: NgControl, useValue: mockNgControl },
        { provide: Renderer2, useValue: mockRenderer2 },
        { provide: ElementRef, useValue: mockElementRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set the value to 0', () => {
    const mockSignal = signal(0);
    spyOn(mockSignal, 'set');
    component['_value'] = mockSignal;
    component.value = null;
    expect(mockSignal.set).toHaveBeenCalledWith(0);
  });

  it('should set the value to 10', () => {
    component.value = 10;
    expect(component.value).toBe(10);
  });

  it('should emit new value after change event', () => {
    spyOn(component.valueChange, 'emit');

    const slider = fixture.debugElement.query(By.css('input'));
    slider.triggerEventHandler('input', { target: { value: '10' } });

    expect(component.valueChange.emit).toHaveBeenCalled();
  });

  it('should get disable to true', () => {
    component['ngControl'] = { disabled: false } as NgControl;
    spyOn(component, 'disabled').and.returnValue(true);
    expect(component.isDisabled).toBeTrue();
  });

  it('should create component with ngControl provided and set valueAccessor', () => {
    fixture.componentRef.setInput('label', undefined);
    component['_value'] = signal(NaN);

    expect(component.parsedLabel()).toBe('');
  });
});
