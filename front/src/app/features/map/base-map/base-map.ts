import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Application, Container, FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { LoginService } from '../../login/login.service';
import { PointOfInterestModalComponent } from '../point-of-interest-modal/point-of-interest-modal.component';

type MapPointType = 'interest' | 'info' | 'current-info';

interface MapPoint {
  id: string;
  label: string;
  description: string;
  type: MapPointType;
  x: number;
  y: number;
}

interface PointMenuOption {
  label: string;
  type: Exclude<MapPointType, 'current-info'>;
}

@Component({
  selector: 'base-map',
  imports: [CommonModule],
  templateUrl: './base-map.html',
  styleUrl: './base-map.scss',
})
export class BaseMapComponent implements AfterViewInit, OnDestroy {
  private readonly mapHost = viewChild.required<ElementRef<HTMLDivElement>>('mapHost');
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly auth = inject(LoginService);
  private readonly messageService = inject(MessageService);
  private readonly dialogService = inject(DialogService);

  protected readonly contextOptions: PointMenuOption[] = [
    { label: 'Crear punto de interes', type: 'interest' },
    { label: 'Crear punto de informacion', type: 'info' },
  ];

  protected showContextMenu = false;
  protected contextMenuPosition = { x: 0, y: 0 };
  protected isReady = false;

  private readonly app = new Application();
  private readonly viewport = new Container({ label: 'viewport' });
  private readonly mapLayer = new Container({ label: 'map-layer' });
  private readonly pointsLayer = new Container({ label: 'points-layer' });

  private resizeObserver?: ResizeObserver;
  private mapWidth = 1600;
  private mapHeight = 900;
  private nextPointId = 5;
  private isDragging = false;
  private dragStartPointer = { x: 0, y: 0 };
  private dragStartViewport = { x: 0, y: 0 };
  private contextWorldPosition = { x: 0, y: 0 };
  private hasFittedViewport = false;

  private readonly basePoints: MapPoint[] = [
    {
      id: 'interest-1',
      label: 'Recepcion historica',
      description: 'Espacio principal del edificio con informacion de bienvenida.',
      type: 'interest',
      x: 360,
      y: 240,
    },
    {
      id: 'interest-2',
      label: 'Mirador central',
      description: 'Punto de interes con una vista general del recinto.',
      type: 'interest',
      x: 1120,
      y: 290,
    },
    {
      id: 'info-1',
      label: 'Punto de informacion norte',
      description: 'Puesto de informacion y ayuda al visitante.',
      type: 'info',
      x: 520,
      y: 650,
    },
    {
      id: 'info-2',
      label: 'Punto de informacion sur',
      description: 'Puesto de atencion al visitante junto a la salida.',
      type: 'info',
      x: 1040,
      y: 640,
    },
  ];

  ngAfterViewInit(): void {
    this.initPixiApp().catch((error) => {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Mapa no disponible',
        detail: 'No se pudo inicializar la vista del mapa.',
      });
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.app.destroy(true, { children: true, texture: false });
  }

  protected get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  protected get isInfoPointUser(): boolean {
    return this.auth.userRole() === 'screen';
  }

  protected get roleLabel(): string {
    if (this.isAdmin) {
      return 'Administrador';
    }

    if (this.isInfoPointUser) {
      return 'Punto de informacion';
    }

    return 'Visitante';
  }

  protected addPointFromContextMenu(type: Exclude<MapPointType, 'current-info'>): void {
    const point: MapPoint = {
      id: `${type}-${this.nextPointId++}`,
      label: type === 'interest' ? 'Nuevo punto de interes' : 'Nuevo punto de informacion',
      description:
        type === 'interest'
          ? 'Punto de interes pendiente de completar.'
          : 'Punto de informacion pendiente de completar.',
      type,
      x: this.contextWorldPosition.x,
      y: this.contextWorldPosition.y,
    };

    this.basePoints.push(point);
    this.renderPoints();
    this.hideContextMenu();

    this.messageService.add({
      severity: 'success',
      summary: 'Elemento creado',
      detail:
        type === 'interest'
          ? 'Se ha colocado un nuevo punto de interes en el mapa.'
          : 'Se ha colocado un nuevo punto de informacion en el mapa.',
    });
  }

  protected hideContextMenu(): void {
    this.showContextMenu = false;
  }

  updateElement(): void {}

  serializeMap(): void {}

  setSlotsDecoration(): void {}

  private async initPixiApp(): Promise<void> {
    const host = this.mapHost().nativeElement;

    await this.app.init({
      antialias: true,
      backgroundAlpha: 0,
      eventMode: 'static',
    });

    this.app.canvas.classList.add('pixi-map-canvas');
    host.appendChild(this.app.canvas);

    this.viewport.addChild(this.mapLayer);
    this.viewport.addChild(this.pointsLayer);
    this.app.stage.addChild(this.viewport);

    this.createMapBackground();
    this.renderPoints();
    this.registerStageEvents();
    this.setupResizeHandling();
    this.fitMapToViewport();

    this.isReady = true;
  }

  private createMapBackground(): void {
    this.mapLayer.removeChildren();

    const base = new Graphics();
    base.roundRect(0, 0, this.mapWidth, this.mapHeight, 28);
    base.fill(0xf8fafc);
    base.stroke({ color: 0xcbd5e1, width: 4 });

    const corridor = new Graphics();
    corridor.roundRect(140, 120, 1320, 170, 20);
    corridor.roundRect(280, 350, 1030, 140, 20);
    corridor.roundRect(180, 590, 1250, 120, 20);
    corridor.fill(0xe2e8f0);

    const roomA = new Graphics();
    roomA.roundRect(140, 320, 220, 220, 18);
    roomA.fill(0xdbeafe);

    const roomB = new Graphics();
    roomB.roundRect(1240, 320, 220, 220, 18);
    roomB.fill(0xfef3c7);

    const roomC = new Graphics();
    roomC.roundRect(540, 540, 240, 180, 18);
    roomC.fill(0xdcfce7);

    const roomD = new Graphics();
    roomD.roundRect(840, 540, 240, 180, 18);
    roomD.fill(0xfae5e9);

    const title = new Text({
      text: 'Mapa de visitantes',
      style: {
        fill: 0x0f172a,
        fontSize: 32,
        fontFamily: 'Georgia',
        fontWeight: '600',
      },
    });
    title.position.set(56, 32);

    const subtitle = new Text({
      text: 'Explora puntos de interes e informacion',
      style: {
        fill: 0x475569,
        fontSize: 18,
        fontFamily: 'Georgia',
      },
    });
    subtitle.position.set(58, 74);

    this.mapLayer.addChild(base, corridor, roomA, roomB, roomC, roomD, title, subtitle);
  }

  private renderPoints(): void {
    this.pointsLayer.removeChildren();

    this.getVisiblePoints().forEach((point) => {
      const marker = this.createMarker(point);
      this.pointsLayer.addChild(marker);
    });
  }

  private getVisiblePoints(): MapPoint[] {
    const points = [...this.basePoints];

    if (this.isInfoPointUser) {
      points.push({
        id: 'current-screen-position',
        label: 'Tu punto de informacion',
        description: 'Esta es la posicion del punto de informacion desde el que estas viendo el mapa.',
        type: 'current-info',
        x: 790,
        y: 445,
      });
    }

    return points;
  }

  private createMarker(point: MapPoint): Container {
    const marker = new Container({
      label: point.id,
      x: point.x,
      y: point.y,
      eventMode: 'static',
      cursor: 'pointer',
    });

    const ring = new Graphics();
    const pin = new Graphics();
    const inner = new Graphics();

    if (point.type === 'interest') {
      ring.circle(0, 0, 24).fill({ color: 0xffedd5, alpha: 0.6 });
      pin.circle(0, 0, 15).fill(0xea580c);
      pin.stroke({ color: 0x7c2d12, width: 2 });
      inner.star(0, 0, 5, 8).fill(0xfffbeb);
    } else if (point.type === 'current-info') {
      ring.circle(0, 0, 28).fill({ color: 0xfef08a, alpha: 0.85 });
      ring.stroke({ color: 0xf59e0b, width: 3 });
      pin.circle(0, 0, 16).fill(0x2563eb);
      pin.stroke({ color: 0xffffff, width: 3 });
      inner.circle(0, 0, 6).fill(0xffffff);
    } else {
      ring.circle(0, 0, 22).fill({ color: 0xdbeafe, alpha: 0.7 });
      pin.circle(0, 0, 14).fill(0x0284c7);
      pin.stroke({ color: 0x0f172a, width: 2 });
      inner.rect(-4, -7, 8, 14).fill(0xe0f2fe);
    }

    const label = new Text({
      text: point.label,
      style: {
        fill: 0x0f172a,
        fontSize: 15,
        fontFamily: 'Arial',
        fontWeight: point.type === 'current-info' ? '700' : '500',
      },
    });
    label.anchor.set(0.5, 0);
    label.position.set(0, 28);

    marker.addChild(ring, pin, inner, label);
    marker.on('pointertap', (event: FederatedPointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      event.stopPropagation();
      this.handlePointClick(point);
    });

    return marker;
  }

  private handlePointClick(point: MapPoint): void {
    if (point.type === 'interest') {
      this.dialogService.open(PointOfInterestModalComponent, {
        header: point.label,
        width: '28rem',
        modal: true,
        closable: true,
        data: point,
      });
      return;
    }

    if (point.type === 'current-info') {
      this.messageService.add({
        severity: 'info',
        summary: 'Posicion actual',
        detail: 'Usted esta aqui.',
      });
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Punto de informacion',
      detail: 'Punto de informacion',
    });
  }

  private registerStageEvents(): void {
    const stage = this.app.stage;

    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;
    stage.on('pointerdown', this.onPointerDown);
    stage.on('pointerup', this.onPointerUp);
    stage.on('pointerupoutside', this.onPointerUp);
    stage.on('pointermove', this.onPointerMove);

    this.app.canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        this.hideContextMenu();
        this.zoomFromWheel(event);
      },
      { passive: false }
    );

    this.app.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.handleContextMenu(event);
    });

    this.app.canvas.addEventListener('pointerdown', () => {
      this.hideContextMenu();
    });
  }

  private readonly onPointerDown = (event: FederatedPointerEvent) => {
    if (event.button !== 0) {
      return;
    }

    this.isDragging = true;
    this.dragStartPointer = { x: event.global.x, y: event.global.y };
    this.dragStartViewport = { x: this.viewport.x, y: this.viewport.y };
  };

  private readonly onPointerMove = (event: FederatedPointerEvent) => {
    if (!this.isDragging) {
      return;
    }

    this.viewport.position.set(
      this.dragStartViewport.x + (event.global.x - this.dragStartPointer.x),
      this.dragStartViewport.y + (event.global.y - this.dragStartPointer.y)
    );
  };

  private readonly onPointerUp = () => {
    this.isDragging = false;
  };

  private zoomFromWheel(event: WheelEvent): void {
    const rect = this.app.canvas.getBoundingClientRect();
    const screenPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const worldPoint = this.toWorldCoordinates(screenPoint.x, screenPoint.y);
    const currentScale = this.viewport.scale.x;
    const scaleFactor = event.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(2.5, Math.max(0.45, currentScale * scaleFactor));

    this.viewport.scale.set(newScale);
    this.viewport.position.set(
      screenPoint.x - worldPoint.x * newScale,
      screenPoint.y - worldPoint.y * newScale
    );
  }

  private handleContextMenu(event: MouseEvent): void {
    if (!this.isAdmin) {
      this.showContextMenu = false;
      return;
    }

    const hostRect = this.mapHost().nativeElement.getBoundingClientRect();
    this.contextMenuPosition = {
      x: event.clientX - hostRect.left,
      y: event.clientY - hostRect.top,
    };
    this.contextWorldPosition = this.toWorldCoordinates(
      this.contextMenuPosition.x,
      this.contextMenuPosition.y
    );
    this.showContextMenu = true;
  }

  private toWorldCoordinates(screenX: number, screenY: number) {
    return {
      x: (screenX - this.viewport.x) / this.viewport.scale.x,
      y: (screenY - this.viewport.y) / this.viewport.scale.y,
    };
  }

  private setupResizeHandling(): void {
    const host = this.mapHost().nativeElement;

    this.resizeObserver = new ResizeObserver(() => {
      this.zone.runOutsideAngular(() => {
        this.app.renderer.resize(host.clientWidth, host.clientHeight);

        if (!this.hasFittedViewport) {
          this.fitMapToViewport();
          return;
        }

        this.app.stage.hitArea = this.app.screen;
      });
    });

    this.resizeObserver.observe(host);
    this.destroyRef.onDestroy(() => this.resizeObserver?.disconnect());
  }

  private fitMapToViewport(): void {
    const host = this.mapHost().nativeElement;
    const width = host.clientWidth;
    const height = host.clientHeight;

    if (!width || !height) {
      return;
    }

    this.app.renderer.resize(width, height);

    const padding = 56;
    const scale = Math.min(
      (width - padding * 2) / this.mapWidth,
      (height - padding * 2) / this.mapHeight
    );

    this.viewport.scale.set(scale);
    this.viewport.position.set(
      (width - this.mapWidth * scale) / 2,
      (height - this.mapHeight * scale) / 2
    );
    this.app.stage.hitArea = this.app.screen;
    this.hasFittedViewport = true;
  }
}

export { BaseMapComponent as BaseMap };
