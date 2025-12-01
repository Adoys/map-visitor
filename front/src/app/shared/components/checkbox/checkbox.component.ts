import { NgClass } from '@angular/common';
import { Component, ElementRef, Input, Optional, Renderer2, Self, input, output } from '@angular/core';
import { CheckboxControlValueAccessor, FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';
import { isRequiredSet } from '../../helpers/form-control';

@Component({
  selector: 'custom-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, NgClass],
})
export class CheckboxComponent extends CheckboxControlValueAccessor {
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  label = input<string>('');
  identifier = input<string>('');

  @Input()
  set value(value: boolean | null) {
    this.writeValue(value ?? false);
    this._value = value ?? false;
  }
  get value(): boolean {
    return this._value;
  }

  get isInvalid(): boolean {
    return (this.ngControl?.invalid === true && this.ngControl?.touched === true) || (this.required() && !this._value);
  }

  get isDisabled(): boolean {
    return this.ngControl?.disabled === true || this.disabled();
  }

  get isRequired(): boolean {
    return isRequiredSet(this.ngControl) || this.required();
  }

  valueChange = output<boolean>();

  private _value = false;

  constructor(
    @Self() @Optional() public ngControl: NgControl,
    private readonly renderer: Renderer2,
    private readonly elementRef: ElementRef<unknown>,
  ) {
    super(renderer, elementRef);
    if (this.ngControl !== undefined && this.ngControl !== null) {
      this.ngControl.valueAccessor = this;
    }
  }

  override writeValue(value: boolean): void {
    this._value = value;
    super.writeValue(value);
  }

  onChanged(event: Event): void {
    const isChecked = (event.target as HTMLInputElement)?.checked ?? false;
    this._value = isChecked;
    this.onChange(isChecked);
    this.valueChange.emit(isChecked);
  }
}
