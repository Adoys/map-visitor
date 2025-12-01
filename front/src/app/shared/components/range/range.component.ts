import {
  Component,
  ElementRef,
  Input,
  Optional,
  Renderer2,
  Self,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule, NgControl, RangeValueAccessor, ReactiveFormsModule } from '@angular/forms';
import { hasValue } from '../../helpers/utilities';

@Component({
  selector: 'custom-range',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './range.component.html',
  styleUrl: './range.component.scss',
})
export class RangeComponent extends RangeValueAccessor {
  @Input()
  set value(value: number | null) {
    this.writeValue(value);
    this._value.set(value ?? 0);
  }
  get value(): number {
    return this._value();
  }

  disabled = input<boolean>(false);
  label = input<string>('');
  max = input<number>(100);
  min = input<number>(0);
  step = input<number>(1);

  parsedLabel = computed(() =>
    this.label() && this._value() != null ? `${this.label()}:${this.round(this._value(), 2)}` : '',
  );

  valueChange = output<number>();
  _value = signal<number>(0);

  constructor(
    @Self() @Optional() public ngControl: NgControl,
    private readonly renderer: Renderer2,
    private readonly elementRef: ElementRef,
  ) {
    super(renderer, elementRef);
    if (hasValue(this.ngControl)) {
      this.ngControl.valueAccessor = this;
    }
  }

  get isDisabled(): boolean {
    return this.ngControl?.disabled === true || this.disabled();
  }

  override writeValue(value: number | null): void {
    this._value.set(value ?? NaN);
    super.writeValue(value);
  }

  onInputChange(ev: Event): void {
    const target = ev.target as HTMLInputElement;
    const value = parseFloat(target.value);
    this._value.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  private round(value: number, decimals: number) {
    const newNumber: number = (value + '' + 'e' + decimals) as unknown as number;
    return Number(Math.round(newNumber) + 'e-' + decimals);
  }
}
