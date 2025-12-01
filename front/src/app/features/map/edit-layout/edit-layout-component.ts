import { Component, input, OnInit, output } from '@angular/core';
import { RangeComponent } from "../../../shared/components/range/range.component";
import { CheckboxComponent } from "../../../shared/components/checkbox/checkbox.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { Container } from 'pixi.js';
import { LayoutProperties } from '../base-map/interfaces';
import { FaIconComponent, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'edit-layout-component',
  imports: [FaIconComponent, RangeComponent, CheckboxComponent, ButtonComponent],
  templateUrl: './edit-layout-component.html',
  styleUrl: './edit-layout-component.scss'
})
export class EditLayoutComponent implements OnInit {
  cancelLayout = output<void>();
  submitLayout = output<LayoutProperties>();
  mapContainer = input.required<Container>();
  rangeStep = 0.01;
  rangeMin = 0.1;
  rangeMax = 5;
  freeMode = false;
  isValidSize = true;
  private initialValue: LayoutProperties = {
    scaleX: 1,
    scaleY: 1,
  };
  currentValue: LayoutProperties = { ...this.initialValue };
  
  constructor(private readonly faicon: FaIconLibrary) {
    this.faicon.addIconPacks(fas);
  }

  ngOnInit(): void {
    const scaleX = this.mapContainer().scale.x;
    const scaleY = this.mapContainer().scale.y;
    this.freeMode = scaleX !== scaleY;
    this.initialValue = { scaleX, scaleY };
    this.currentValue = { ...this.initialValue };
  }

  private previewMap() {
    const map = this.mapContainer();
    map.scale.x = this.currentValue.scaleX;
    map.scale.y = this.currentValue.scaleY;
  }

  reset(): void {
    this.currentValue = { ...this.initialValue };
    this.previewMap();
  }

  onCancel(): void {
    this.reset();
    this.cancelLayout.emit();
  }

  save(): void {
    this.submitLayout.emit(this.currentValue);
  }

  scaleXChanged(v: number): void {
    this.currentValue.scaleX = v;
    this.previewMap();
  }

  scaleYChanged(v: number): void {
    this.currentValue.scaleY = v;
    this.previewMap();
  }

  scaleChanged(v: number): void {
    this.currentValue.scaleX = v;
    this.currentValue.scaleY = v;
    this.previewMap();
  }

  onFreeModeChange(newValue: boolean) {
    this.freeMode = newValue;

    if (!this.freeMode && this.currentValue.scaleX !== this.currentValue.scaleY) {
      this.currentValue.scaleY = this.currentValue.scaleX;
      this.previewMap();
    }
  }
}
