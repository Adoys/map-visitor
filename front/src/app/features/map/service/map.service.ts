import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, of, map, tap, Observable } from 'rxjs';
import { containerBuilder } from '../../../shared/helpers/pixi-utils';
import { Indefinable, PickProps } from '../../../shared/interfaces/generic';
import { IDataBackground } from '../../../shared/interfaces/IDataBackground';
import { IFilterSlot } from '../../../shared/interfaces/IFilterSlot';
import { IMapBackground } from '../../../shared/interfaces/IMapBackground';
import { IMapData } from '../../../shared/interfaces/IMapData';
import { IMapDataType } from '../../../shared/interfaces/IMapDataType';
import { InternalSlot } from '../../../shared/interfaces/internal-slot';
import { IStateBox } from '../../../shared/interfaces/IStateBox';
import { MapState } from '../../../shared/interfaces/MapState';
import { ContainerDescriptor, MapMode, LayoutProperties } from '../base-map/interfaces';
import { availableSlots, defaultSlotMetaData, slotDescriptorFactory } from '../../../shared/helpers/default-slots';

@Injectable()
export class MapService {
  [x: string]: any;
  containerDescriptors: ContainerDescriptor[] = [];

  private readonly availableSlots = signal<InternalSlot[]>([]);
  private readonly availableIcons = signal<InternalSlot[]>([]);

  private readonly mapMode = signal<MapMode>('view');

  private readonly maps = signal<IMapBackground[]>([]);
  private readonly mapSlots = signal<IMapData[]>([]);
  private readonly mapSize = signal<IDataBackground>({ height: 175, width: 300 });
  private readonly mapScale = signal<LayoutProperties>({ scaleX: 1, scaleY: 1 });
  defaultState!: IStateBox;
  private readonly mapStates = new BehaviorSubject<MapState<IStateBox>>([]);
  private readonly filters = signal<IFilterSlot[]>([]);
  private readonly filterValue$ = new BehaviorSubject<IFilterSlot[]>([]);



  getInternalSlots() {
    return of(availableSlots).pipe(
      map((slots) =>
        slots.map((slot) =>
          slotDescriptorFactory({
            assetId: slot.assetId,
            label: slot.label,
            type: slot.type,
            repeat: slot.repeat,
            scale: slot.scale,
          }),
        ),
      ),
      tap((slots) => {
        this.containerDescriptors = slots;
      }),
    );
  }

  getExternalSlots(): Observable<string[]> {
    //TODO: PRH-1505 support external slots
    return of([]);
  }

  getMaps(): IMapBackground[] {
    return this.maps();
  }

  setMaps(maps: IMapBackground[]): void {
    this.maps.set(maps);
  }

  getMapSlots(): IMapData[] {
    return this.mapSlots();
  }

  getFilters(): IFilterSlot[] {
    return this.filterValue$.value;
  }

  getMapSlot(id: string): Indefinable<InternalSlot> {
    return this.availableSlots().find((slot) => slot.id === id || slot.id === 'slot');
  }

  getAvailableSlots(): InternalSlot[] {
    return this.availableSlots();
  }

  setMapSlots(mapSlots: IMapData[]): void {
    this.mapSlots.set(mapSlots);
  }

  getMapSize(): IDataBackground {
    return this.mapSize();
  }

  getMapMode(): MapMode {
    return this.mapMode();
  }

  getMapScale(): LayoutProperties {
    return this.mapScale();
  }

  setMapScale(scale: LayoutProperties): void {
    this.mapScale.set(scale);
  }

  setMapMode(mode: MapMode): void {
    this.mapMode.set(mode);
  }

  setMapSize(mapSize: IDataBackground): void {
    this.mapSize.set(mapSize);
  }
  setAvailableSlots(slots: InternalSlot[]): void {
    this.availableSlots.set(slots);
  }
  getSlotContainer(slotId?: string, scale = 1) {
    const newSlot = this.containerDescriptors.find((descriptor) => descriptor.label === slotId);
    const slotType: IMapDataType = Object.values(IMapDataType).find((type) => type === slotId) ?? IMapDataType.INFO_POINT;

    if (!newSlot) {
      return null;
    }

    const data: PickProps<IMapData, 'label' | 'type' | 'id'> = {
      id: 1,
      label: newSlot.label,
      type: slotType,
    };

    return {
      container: containerBuilder(newSlot, scale),
      data,
    };
  }

  getMapStates(): BehaviorSubject<MapState<IStateBox>> {
    return this.mapStates;
  }

  getDefaultState(): IStateBox | undefined {
    return this.getMapStates().value.find((s) => s.isDefault === true);
  }

  setMapStates(states: MapState<IStateBox>) {
    this.detectDefaultState();
    this.mapStates.next(states);
  }

  private detectDefaultState(): void {
    this.mapStates.subscribe((states) => {
      const defaultStates: IStateBox[] = states.filter((state) => state.isDefault === true);

      if (defaultStates.length > 1) {
        console.warn('Only one default state is allowed.');
        this.defaultState = defaultStates[0];
      } else if (defaultStates.length !== 1) {
        console.warn('An default state must be defined.');
      } else {
        this.defaultState = defaultStates[0];
      }
    });
  }

  setFilter(filter: IFilterSlot[]) {
    return this.filterValue$.next(filter);
  }
}