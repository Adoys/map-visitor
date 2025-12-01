import { NgControl, Validators } from '@angular/forms';

export const isRequiredSet = (control?: NgControl): boolean => {
  return !!(control?.control?.hasValidator((control) => Validators.required(control)) ?? false);
};
