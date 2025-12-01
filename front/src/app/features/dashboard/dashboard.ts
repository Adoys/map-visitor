import { AfterViewInit, Component, input, OnDestroy, OnInit, output, viewChild } from '@angular/core';
import { EditLayoutComponent } from "../map/edit-layout/edit-layout-component";
import { SlotsSelectorComponent } from "../map/slots-selector/slots-selector.component";
import { Container, UnresolvedAsset } from 'pixi.js';
import { BehaviorSubject, Subject, Subscription, tap, switchMap, from, take } from 'rxjs';
import { loadAssets } from '../../shared/helpers/pixi-utils';
import { hasValue } from '../../shared/helpers/utilities';
import { ContainerClick } from '../../shared/interfaces/ContainerClick';
import { IDataBackground } from '../../shared/interfaces/IDataBackground';
import { IFilterSlot } from '../../shared/interfaces/IFilterSlot';
import { IMapBackground } from '../../shared/interfaces/IMapBackground';
import { IMapData, ISerializeMap } from '../../shared/interfaces/IMapData';
import { SessionInfo } from '../../shared/interfaces/IMapInfo';
import { InternalSlot } from '../../shared/interfaces/internal-slot';
import { IStateBox } from '../../shared/interfaces/IStateBox';
import { MapState } from '../../shared/interfaces/MapState';
import { MapMode, LayoutProperties } from '../map/base-map/interfaces';
import { MapService } from '../map/service/map.service';
import { BaseMapComponent } from '../map/base-map/base-map';
import { AppHeader } from "../app-header/app-header";

@Component({
  selector: 'app-dashboard',
  imports: [BaseMapComponent, EditLayoutComponent, SlotsSelectorComponent, AppHeader],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  /*
  customSlotsUrl = input<string>();
  elements = input<BehaviorSubject<IMapData[]>>();
  map = input<IMapBackground[]>([]);
  mapSize = input<IDataBackground>({ height: 600, width: 800 });
  mode = input<MapMode>('view');
  name = input<string>('generic map');
  updateElement = input<Subject<ContainerClick>>();
  serialize = input<Subject<void>>();
  stateBoxEvent = input<BehaviorSubject<SessionInfo<string>[]>>();
  getFilters = input<BehaviorSubject<IFilterSlot[]>>();
  slots: IMapData[] = [];
  statesBox = input.required<MapState<IStateBox>>();
  legendClick = output<void>();
  serializedData = output<ISerializeMap>();
  containerClick = output<ContainerClick>();
  clearState$ = input<Subject<void>>();
  icons: InternalSlot[] = [];
  ready = false;
  showEditLayout = false;
  mapContainer!: Container;

  
  private readonly canvas = viewChild<BaseMapComponent>('canvas');

  private readonly sub: Subscription = new Subscription();

  constructor(private readonly mapIndoorService: MapService) {}

  ngOnInit(): void {
    this.loadInternalAssets()
      .then(() => {
        return this.mapIndoorService.getInternalSlots().subscribe(() => {
          this.ready = true;
        });
      })
      .catch((error) => console.error(error));

    const elements$ = this.elements();
    if (elements$) {
      this.sub.add(
        elements$.subscribe((data) => {
          this.slots = data;
          this.mapIndoorService.setMapSlots(data);
        }),
      );
    }

    const filter$ = this.getFilters();
    if (filter$) {
      this.sub.add(
        filter$.subscribe((data) => {
          this.mapIndoorService.setFilter(data);
        }),
      );
    }
    this.mapIndoorService.setMapStates(this.statesBox());
    this.mapIndoorService.setMaps(this.map());
    this.mapIndoorService.setMapSize(this.mapSize());
    this.mapIndoorService
      .getInternalIcons()
      .pipe(
        tap((icons) => {
          this.icons = icons;
        }),
        switchMap(() => from(this.loadInternalIcons())),
      )
      .subscribe();
    const subject = this.serialize();
    const updateElementSub = this.updateElement();

    if (subject) {
      this.sub.add(subject.subscribe(() => this.serializeMap()));
    }
    if (updateElementSub) {
      this.sub.add(updateElementSub.subscribe((data) => this.updateElementFromView(data)));
    }
  }

  ngAfterViewInit(): void {
    const boxEvent = this.stateBoxEvent();

    if (boxEvent) {
      this.waitForReadyAndElements()
        .then(({ elements }) => {
          if (elements.length > 0) {
            return this.sub?.add(
              boxEvent.subscribe((data) => {
                this.setSlotDecoration(data).catch(console.error);
              }),
            );
          }
          return [];
        })
        .catch((err) => console.error('Error waiting for ready and elements:', err));
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  updateElementFromView(data: ContainerClick): void {
    if (hasValue(data)) {
      this.canvas()?.updateElement(data);
    }
  }

  loadInternalAssets(): Promise<(string | undefined)[]> {
    const assets = internalSlots.map(({ data: src, id: alias }): UnresolvedAsset => ({ alias, src }));
    return loadAssets(assets);
  }

  loadInternalIcons() {
    const assets = this.icons.map(({ data: src, id: alias }): UnresolvedAsset => ({ alias, src }));
    return loadAssets(assets);
  }

  onLegendClick() {
    this.legendClick.emit();
  }

  onContainerClick(data: ContainerClick) {
    this.containerClick.emit(data);
  }

  onShowEditLayout(c: Container) {
    this.showEditLayout = true;
    this.mapContainer = c;
    this.mapIndoorService.setMapScale({ scaleX: this.mapContainer.scale.x, scaleY: this.mapContainer.scale.y });
  }

  onCancel() {
    this.showEditLayout = false;
  }

  onSubmit(ev: LayoutProperties) {
    this.showEditLayout = false;
    this.mapIndoorService.setMapScale({ scaleX: ev.scaleX, scaleY: ev.scaleY });
  }

  serializeMap() {
    this.canvas()?.serializeMap();
  }

  public onSerializedData(event: ISerializeMap) {
    this.serializedData.emit(event);
  }

  async setSlotDecoration(data: SessionInfo<string>[]) {
    try {
      const canvasInstance = (await this.waitForReadyAndElements()).canvas;
      canvasInstance.setSlotsDecoration(data);
    } catch (err) {
      console.error(err);
    }
  }

  async waitForReadyAndElements(timeout = 5000): Promise<{ canvas: BaseMapComponent; elements: IMapData[] }> {
    const start = Date.now();

    const waitForCanvasReady = (): Promise<BaseMapComponent> =>
      new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          const canvasInstance = this.canvas();
          const isReady = this.ready;

          if (canvasInstance && isReady) {
            clearInterval(interval);
            resolve(canvasInstance);
          }
          if (Date.now() - start > timeout) {
            clearInterval(interval);
            reject(new Error('Canvas is not available after waiting'));
          }
        }, 50);
      });

    const waitForElementsReady = (): Promise<IMapData[]> =>
      new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          const elementsObs = this.elements?.();
          if (!elementsObs) {
            if (Date.now() - start > timeout) {
              clearInterval(interval);
              reject(new Error('Observable elements() not available after waiting'));
            }
            return;
          }

          elementsObs.pipe(take(1)).subscribe({
            next: (elements) => {
              if (elements && elements.length > 0) {
                clearInterval(interval);
                resolve(elements);
              } else if (Date.now() - start > timeout) {
                clearInterval(interval);
                resolve([]);
              }
            },
            error: (err) => {
              clearInterval(interval);
              reject(new Error(err as string));
            },
          });
        }, 50);
      });

    const canvas = await waitForCanvasReady();
    const elements = await waitForElementsReady();
    return { canvas, elements };
  }
  */
}
