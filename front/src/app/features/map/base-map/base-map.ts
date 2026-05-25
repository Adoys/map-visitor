import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  NgZone,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Application, Container, FederatedPointerEvent, Graphics, Sprite, Texture } from 'pixi.js';
import { GeneralSettingsService } from '../../company-settings/general-settings/general-settings.service';
import { LoginService } from '../../login/login.service';
import { PointOfInterestModalComponent } from '../point-of-interest-modal/point-of-interest-modal.component';
import { MapPointsService, MapPointPayload } from '../map-points.service';
import { SelectInfoPointUserModalComponent } from '../select-info-point-user-modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../user-modal/user.service';
import { User } from '../../user-modal/models/users';

type MapPointType = 'interest' | 'info' | 'current-info';

interface MapPoint {
  id: string;
  label: string;
  description: string;
  type: MapPointType;
  x: number;
  y: number;
  userId?: number;
  persisted?: boolean;
}

interface PointMenuOption {
  label: string;
  action: 'create-interest' | 'create-info' | 'change-map-image' | 'delete-point';
}

interface LoadedMarkerIcons {
  interest: Texture | null;
  info: Texture | null;
}

interface LoadedMapAssets {
  background: Texture | null;
  markers: LoadedMarkerIcons;
}

@Component({
  selector: 'base-map',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './base-map.html',
  styleUrl: './base-map.scss',
})
export class BaseMapComponent implements AfterViewInit, OnDestroy {
  // Usuarios de punto de información
  protected infoPointUsers: User[] = [];
  protected usedInfoPointUserIds: Set<number> = new Set();
  protected selectedInfoPointUserId: number | null = null;
  private readonly userService = inject(UserService);
  private readonly mapPointsService = inject(MapPointsService);
  private readonly translate = inject(TranslateService);
  private readonly mapHost = viewChild.required<ElementRef<HTMLDivElement>>('mapHost');
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly auth = inject(LoginService);
  private readonly settings = inject(GeneralSettingsService);
  private readonly messageService = inject(MessageService);
  private readonly dialogService = inject(DialogService);
  private readonly mapImageInput = viewChild<ElementRef<HTMLInputElement>>('mapImageInput');

  private readonly mapContextOptions: PointMenuOption[] = [
    { label: 'MAP.CREATE_INTEREST', action: 'create-interest' },
    { label: 'MAP.CREATE_INFO', action: 'create-info' },
    { label: 'MAP.CHANGE_IMAGE', action: 'change-map-image' },
  ];
  private readonly pointContextOptions: PointMenuOption[] = [
    { label: 'MAP.DELETE_POINT', action: 'delete-point' },
  ];

  protected showContextMenu = false;
  protected contextMenuPosition = { x: 0, y: 0 };
  protected isReady = false;

  private readonly app = new Application();
  private readonly viewport = new Container({ label: 'viewport' });
  private readonly mapLayer = new Container({ label: 'map-layer' });
  private readonly pointsLayer = new Container({ label: 'points-layer' });

  private resizeObserver?: ResizeObserver;
  private readonly defaultMapWidth = 1600;
  private readonly defaultMapHeight = 900;
  private mapWidth = this.defaultMapWidth;
  private mapHeight = this.defaultMapHeight;
  private nextPointId = 5;
  private mapBackgroundTexture: Texture | null = null;
  private hasConfiguredMapSize = false;
  private markerIcons: LoadedMarkerIcons = { interest: null, info: null };
  private isDragging = false;
  private blockNextTap = false;
  private dragStartPointer = { x: 0, y: 0 };
  private dragStartViewport = { x: 0, y: 0 };
  private contextWorldPosition = { x: 0, y: 0 };
  private contextPointId: string | null = null;
  private hasFittedViewport = false;
  private activePointerType = 'mouse';
  private longPressTimeout: ReturnType<typeof setTimeout> | null = null;
  private longPressScreenPosition = { x: 0, y: 0 };
  private draggedPointId: string | null = null;
  private pointDragMoved = false;
  private pointDragSaving = false;

  private readonly defaultBasePoints: MapPoint[] = [
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
  private basePoints: MapPoint[] = [];

  constructor() {
    effect(() => {
      this.settings.settings();

      if (!this.isReady) {
        return;
      }

      this.refreshMapAssets().catch(console.error);
    });
  }

  ngAfterViewInit(): void {
    this.loadMapPoints()
      .then(() => this.initPixiApp())
      .catch((error) => {
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

  protected get interestMarkerIconSrc(): string | null {
    return this.settings.getTouristMarkerIcon();
  }

  protected get infoMarkerIconSrc(): string | null {
    return this.settings.getInfoMarkerIcon();
  }

  protected get contextOptions(): PointMenuOption[] {
    return this.contextPointId ? this.pointContextOptions : this.mapContextOptions;
  }

  protected async onContextMenuAction(action: PointMenuOption['action']): Promise<void> {
    if (!this.isAdmin) {
      this.hideContextMenu();
      return;
    }

    if (action === 'delete-point') {
      this.deleteContextPoint();
      return;
    }

    if (action === 'change-map-image') {
      this.hideContextMenu();
      this.mapImageInput()?.nativeElement.click();
      return;
    }

    const type = action === 'create-interest' ? 'interest' : 'info';

    if (type === 'info') {
      const users = await firstValueFrom(this.userService.findAll());
      this.infoPointUsers = users.filter((u) => u.role === 'screen');
      this.usedInfoPointUserIds = new Set(
        this.basePoints.filter((p) => p.type === 'info' && p.userId != null).map((p) => p.userId as number)
      );
      const disponibles = this.infoPointUsers.filter((u) => !this.usedInfoPointUserIds.has(u.id));

      if (disponibles.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: this.translate.instant('MAP.NO_INFO_USERS'),
          detail: this.translate.instant('MAP.NO_INFO_USERS_DETAIL'),
        });
        this.hideContextMenu();
        return;
      }

      const ref = this.dialogService.open(SelectInfoPointUserModalComponent, {
        header: this.translate.instant('MAP.INFO_POINTS_TITLE'),
        width: '30rem',
        data: { users: disponibles },
      });

      if (!ref) {
        this.hideContextMenu();
        return;
      }

      const selectedUser = await firstValueFrom(ref.onClose);
      if (!selectedUser) {
        this.hideContextMenu();
        return;
      }

      if (this.basePoints.some((p) => p.type === 'info' && p.userId === selectedUser.id)) {
        this.messageService.add({
          severity: 'warn',
          summary: this.translate.instant('MAP.DUPLICATE_INFO'),
          detail: this.translate.instant('MAP.DUPLICATE_INFO_DETAIL'),
        });
        this.hideContextMenu();
        return;
      }

      try {
        const created = await firstValueFrom(
          this.mapPointsService.create({
            label: selectedUser.userId,
            description: `Usuario de punto de información: ${selectedUser.userId}`,
            type: 'info',
            x: this.contextWorldPosition.x,
            y: this.contextWorldPosition.y,
            userId: selectedUser.id,
          })
        );

        const point: MapPoint = {
          id: String(created.id),
          label: created.label,
          description: created.description,
          type: created.type,
          x: Number(created.x),
          y: Number(created.y),
          userId: created.userId,
          persisted: true,
        };

        this.basePoints.push(point);
        this.renderPoints();
        this.hideContextMenu();
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('MAP.ELEMENT_CREATED'),
          detail: this.translate.instant('MAP.INFO_ADDED'),
        });
      } catch (error) {
        console.error(error);
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('MAP.SAVE_ERROR'),
          detail: this.translate.instant('MAP.INFO_SAVE_ERROR_DETAIL'),
        });
      }
      return;
    }

    // Para interest, flujo normal
    const payload: MapPointPayload = {
      label: type === 'interest' ? 'Nuevo punto de interes' : 'Nuevo punto de informacion',
      description:
        type === 'interest'
          ? 'Punto de interes pendiente de completar.'
          : 'Punto de informacion pendiente de completar.',
      type: type as 'interest' | 'info',
      x: this.contextWorldPosition.x,
      y: this.contextWorldPosition.y,
    };

    try {
      const createdPoint = await firstValueFrom(this.mapPointsService.create(payload));
      const point: MapPoint = {
        id: String(createdPoint.id),
        label: createdPoint.label,
        description: createdPoint.description,
        type: createdPoint.type,
        x: Number(createdPoint.x),
        y: Number(createdPoint.y),
        persisted: true,
      };

      this.basePoints.push(point);
      this.renderPoints();
      this.hideContextMenu();
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('MAP.ELEMENT_CREATED'),
        detail: this.translate.instant(type === 'interest' ? 'MAP.INTEREST_ADDED' : 'MAP.INFO_ADDED'),
      });
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('MAP.SAVE_ERROR'),
        detail: this.translate.instant('MAP.POINT_SAVE_ERROR_DETAIL'),
      });
    }
  }

  protected zoomIn(): void {
    this.zoomAtScreenPoint(1.15);
  }

  protected zoomOut(): void {
    this.zoomAtScreenPoint(0.85);
  }

  protected resetZoom(): void {
    this.fitMapToViewport();
  }

  protected async onMapImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Archivo no valido',
        detail: 'Selecciona una imagen para el mapa.',
      });
      input.value = '';
      return;
    }

    try {
      await firstValueFrom(this.settings.uploadMapImage(file));
      this.messageService.add({
        severity: 'success',
        summary: 'Mapa actualizado',
        detail: 'La imagen del mapa se ha actualizado correctamente.',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error al subir la imagen',
        detail: 'No se pudo guardar la nueva imagen del mapa.',
      });
    } finally {
      input.value = '';
    }
  }

  protected hideContextMenu(): void {
    this.showContextMenu = false;
    this.contextPointId = null;
  }

  updateElement(): void { }

  serializeMap(): void { }

  setSlotsDecoration(): void { }

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

    await this.refreshMapAssets();
    this.registerStageEvents();
    this.setupResizeHandling();
    this.fitMapToViewport();

    this.isReady = true;
  }

  private createMapBackground(): void {
    this.mapLayer.removeChildren();
    const themedBackgroundColor = this.getThemeBackgroundColor();

    if (this.mapBackgroundTexture) {
      const background = new Graphics();
      background.roundRect(0, 0, this.mapWidth, this.mapHeight, 28);
      background.fill(themedBackgroundColor);

      const sprite = new Sprite(this.mapBackgroundTexture);
      const imageSize = this.hasConfiguredMapSize
        ? { width: this.mapWidth, height: this.mapHeight }
        : this.getContainedImageSize(
          this.mapBackgroundTexture.width,
          this.mapBackgroundTexture.height,
          this.mapWidth,
          this.mapHeight
        );

      sprite.anchor.set(0);
      sprite.width = imageSize.width;
      sprite.height = imageSize.height;
      sprite.position.set(
        (this.mapWidth - imageSize.width) / 2,
        (this.mapHeight - imageSize.height) / 2
      );

      const border = new Graphics();
      border.roundRect(0, 0, this.mapWidth, this.mapHeight, 28);
      border.stroke({ color: 0xcbd5e1, width: 4 });

      this.mapLayer.addChild(background, sprite, border);
      return;
    }

    const base = new Graphics();
    base.roundRect(0, 0, this.mapWidth, this.mapHeight, 28);
    base.fill(themedBackgroundColor);
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

    this.mapLayer.addChild(base, corridor, roomA, roomB, roomC, roomD);
  }

  private getThemeBackgroundColor(): number {
    const backgroundColor = this.settings.settings()?.backgroundColor ?? '#f8fafc';
    const normalized = backgroundColor.trim();

    if (/^#[0-9a-f]{6}$/i.test(normalized)) {
      return Number.parseInt(normalized.slice(1), 16);
    }

    if (/^#[0-9a-f]{3}$/i.test(normalized)) {
      const [r, g, b] = normalized.slice(1).split('');
      return Number.parseInt(`${r}${r}${g}${g}${b}${b}`, 16);
    }

    return 0xf8fafc;
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

    if (this.isInfoPointUser && !this.basePoints.some((point) => this.isLoggedInfoPoint(point))) {
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
      cursor: this.canDragPoint(point) ? 'grab' : 'pointer',
    });

    const ring = new Graphics();
    const pin = new Graphics();
    const inner = new Graphics();
    const markerTexture = this.getMarkerTexture(point.type);

    const isLoggedInfoPoint = this.isLoggedInfoPoint(point);
    if (point.type === 'current-info') {
      ring.circle(0, 0, 32).fill({ color: 0xfef08a, alpha: 0.85 });
      ring.stroke({ color: 0xf59e0b, width: 4 });
    } else if (isLoggedInfoPoint) {
      ring.circle(0, 0, 26).fill({ color: 0xf87171, alpha: 0.22 });
      ring.stroke({ color: 0xdc2626, width: 2.5 });
    } else {
      ring.circle(0, 0, point.type === 'interest' ? 24 : 22).fill({
        color: point.type === 'interest' ? 0xffedd5 : 0xdbeafe,
        alpha: 0.72,
      });
    }

    if (markerTexture) {
      const icon = new Sprite(markerTexture);
      const size = point.type === 'current-info' ? 42 : 34;
      icon.anchor.set(0.5);
      icon.width = size;
      icon.height = size;
      marker.addChild(ring, icon);
    } else {
      if (point.type === 'interest') {
        pin.circle(0, 0, 15).fill(0xea580c);
        pin.stroke({ color: 0x7c2d12, width: 2 });
        inner.star(0, 0, 5, 8).fill(0xfffbeb);
      } else if (point.type === 'current-info') {
        pin.circle(0, 0, 16).fill(0x2563eb);
        pin.stroke({ color: 0xffffff, width: 3 });
        inner.circle(0, 0, 6).fill(0xffffff);
      } else {
        pin.circle(0, 0, 14).fill(0x0284c7);
        pin.stroke({ color: 0x0f172a, width: 2 });
        inner.rect(-4, -7, 8, 14).fill(0xe0f2fe);
      }

      marker.addChild(ring, pin, inner);
    }

    if (this.canDragPoint(point)) {
      marker.on('pointerdown', (event: FederatedPointerEvent) => {
        if (event.button !== 0 || this.pointDragSaving) {
          return;
        }

        event.stopPropagation();
        this.hideContextMenu();
        this.draggedPointId = point.id;
        this.pointDragMoved = false;
        this.blockNextTap = false;
        this.clearLongPressTimer();
      });
    }

    marker.on('pointertap', (event: FederatedPointerEvent) => {
      if (event.button !== 0 || this.blockNextTap) {
        this.blockNextTap = false;
        return;
      }

      event.stopPropagation();
      this.handlePointClick(point);
    });

    return marker;
  }

  private isLoggedInfoPoint(point: MapPoint): boolean {
    const loggedUserId = this.auth.getUserId();
    return point.type === 'info' && point.userId != null && loggedUserId != null && Number(point.userId) === loggedUserId;
  }

  private canDragPoint(point: MapPoint): boolean {
    return this.isAdmin && point.persisted === true && point.type !== 'current-info';
  }

  private async handlePointClick(point: MapPoint): Promise<void> {
    // Si es punto de interés normal
    if (point.type === 'interest') {
      let header = point.label;
      try {
        const languageCode = localStorage.getItem('lang') || 'es';
        const content = await firstValueFrom(this.mapPointsService.getContent(point.id, languageCode));
        header = content.translation?.title || point.label;
      } catch (error) {
        console.error('No se pudo cargar el título del punto de interés:', error);
      }

      this.dialogService.open(PointOfInterestModalComponent, {
        header,
        width: '52rem',
        modal: true,
        closable: true,
        styleClass: 'poi-dialog',
        data: point,
      });
      return;
    }

    // Si es punto de información logueado
    if (this.isLoggedInfoPoint(point)) {
      this.messageService.add({
        severity: 'info',
        summary: this.translate.instant('MAP.YOU_ARE_HERE'),
        detail: this.translate.instant('MAP.YOU_ARE_HERE'),
      });
      return;
    }

    // Si es cualquier otro punto de información
    if (point.type === 'info') {
      this.messageService.add({
        severity: 'info',
        summary: this.translate.instant('MAP.INFO_SCREEN'),
        detail: this.translate.instant('MAP.INFO_SCREEN'),
      });
      return;
    }

    // Si es el punto de posición actual
    if (point.type === 'current-info') {
      this.messageService.add({
        severity: 'info',
        summary: this.translate.instant('MAP.YOU_ARE_HERE'),
        detail: this.translate.instant('MAP.YOU_ARE_HERE'),
      });
      return;
    }
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

    if (this.draggedPointId) {
      return;
    }

    this.activePointerType = event.pointerType ?? 'mouse';
    this.isDragging = true;
    this.blockNextTap = false;
    this.dragStartPointer = { x: event.global.x, y: event.global.y };
    this.dragStartViewport = { x: this.viewport.x, y: this.viewport.y };

    if (this.isAdmin && this.activePointerType !== 'mouse') {
      this.longPressScreenPosition = { x: event.global.x, y: event.global.y };
      this.clearLongPressTimer();
      this.longPressTimeout = setTimeout(() => {
        this.isDragging = false;
        this.blockNextTap = true;
        this.openContextMenuAt(
          this.longPressScreenPosition.x,
          this.longPressScreenPosition.y
        );
      }, 550);
    }
  };

  private readonly onPointerMove = (event: FederatedPointerEvent) => {
    if (this.draggedPointId) {
      const draggedPoint = this.basePoints.find((point) => point.id === this.draggedPointId);
      if (!draggedPoint) {
        this.draggedPointId = null;
        return;
      }

      const nextPosition = this.getClampedWorldCoordinates(event.global.x, event.global.y);
      const distance = Math.hypot(draggedPoint.x - nextPosition.x, draggedPoint.y - nextPosition.y);
      if (distance > 1) {
        this.pointDragMoved = true;
        this.blockNextTap = true;
      }

      draggedPoint.x = nextPosition.x;
      draggedPoint.y = nextPosition.y;
      this.renderPoints();
      return;
    }

    if (!this.isDragging) {
      return;
    }

    const deltaX = event.global.x - this.dragStartPointer.x;
    const deltaY = event.global.y - this.dragStartPointer.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > 8) {
      this.blockNextTap = true;
      this.clearLongPressTimer();
    }

    this.viewport.position.set(
      this.dragStartViewport.x + deltaX,
      this.dragStartViewport.y + deltaY
    );
  };

  private readonly onPointerUp = () => {
    if (this.draggedPointId) {
      const draggedPoint = this.basePoints.find((point) => point.id === this.draggedPointId) ?? null;
      const shouldPersist = this.pointDragMoved && draggedPoint?.persisted;
      const draggedPointId = this.draggedPointId;

      this.draggedPointId = null;
      this.pointDragMoved = false;

      if (shouldPersist && draggedPoint) {
        this.pointDragSaving = true;
        firstValueFrom(
          this.mapPointsService.updatePosition(draggedPointId, {
            x: draggedPoint.x,
            y: draggedPoint.y,
          })
        )
          .catch((error) => {
            console.error('No se pudo mover el punto en el servidor:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translate.instant('MAP.SAVE_ERROR'),
              detail: this.translate.instant('MAP.POINT_SAVE_ERROR_DETAIL'),
            });
          })
          .finally(() => {
            this.pointDragSaving = false;
          });
      }

      return;
    }

    this.isDragging = false;
    this.clearLongPressTimer();
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
    event.preventDefault();

    if (!this.isAdmin) {
      this.hideContextMenu();
      return;
    }

    const hostRect = this.mapHost().nativeElement.getBoundingClientRect();
    this.openContextMenuAt(event.clientX - hostRect.left, event.clientY - hostRect.top);
  }

  private deleteContextPoint(): void {
    if (!this.contextPointId) {
      this.hideContextMenu();
      return;
    }

    const pointIndex = this.basePoints.findIndex((point) => point.id === this.contextPointId);
    if (pointIndex === -1) {
      this.hideContextMenu();
      return;
    }

    const [deletedPoint] = this.basePoints.splice(pointIndex, 1);
    this.renderPoints();
    this.hideContextMenu();

    if (deletedPoint.persisted) {
      firstValueFrom(this.mapPointsService.delete(deletedPoint.id)).catch((error) => {
        console.error('No se pudo eliminar el punto en el servidor:', error);
      });
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Punto eliminado',
      detail:
        deletedPoint.type === 'interest'
          ? 'Se ha eliminado el punto de interes.'
          : 'Se ha eliminado el punto de informacion.',
    });
  }

  private toWorldCoordinates(screenX: number, screenY: number) {
    return {
      x: (screenX - this.viewport.x) / this.viewport.scale.x,
      y: (screenY - this.viewport.y) / this.viewport.scale.y,
    };
  }

  private getClampedWorldCoordinates(screenX: number, screenY: number) {
    const position = this.toWorldCoordinates(screenX, screenY);

    return {
      x: Math.min(this.mapWidth, Math.max(0, position.x)),
      y: Math.min(this.mapHeight, Math.max(0, position.y)),
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

  private async loadMapPoints(): Promise<void> {
    try {
      const points = await firstValueFrom(this.mapPointsService.findAll());
      this.basePoints = points.map((mapPoint) => ({
        id: String(mapPoint.id),
        label: mapPoint.label,
        description: mapPoint.description,
        type: mapPoint.type,
        x: Number(mapPoint.x),
        y: Number(mapPoint.y),
        userId: mapPoint.userId,
        persisted: true,
      }));
    } catch (error) {
      console.error('No se pudieron cargar los puntos del mapa:', error);
      this.basePoints = [...this.defaultBasePoints];
    }
  }

  private async refreshMapAssets(): Promise<void> {
    const assets = await this.loadMapAssets();
    this.mapBackgroundTexture = assets.background;
    this.markerIcons = assets.markers;
    this.updateMapDimensions();
    this.createMapBackground();
    this.renderPoints();
  }

  private updateMapDimensions(): void {
    const settings = this.settings.settings();
    const configuredWidth = this.getPositiveNumber(settings?.mapWidth);
    const configuredHeight = this.getPositiveNumber(settings?.mapHeight);
    const naturalWidth = this.getPositiveNumber(this.mapBackgroundTexture?.width);
    const naturalHeight = this.getPositiveNumber(this.mapBackgroundTexture?.height);

    if (configuredWidth && configuredHeight) {
      this.mapWidth = configuredWidth;
      this.mapHeight = configuredHeight;
      this.hasConfiguredMapSize = true;
      return;
    }

    this.hasConfiguredMapSize = false;

    if (this.mapBackgroundTexture && naturalWidth && naturalHeight) {
      if (configuredWidth) {
        this.mapWidth = configuredWidth;
        this.mapHeight = Math.round(configuredWidth * (naturalHeight / naturalWidth));
        return;
      }

      if (configuredHeight) {
        this.mapHeight = configuredHeight;
        this.mapWidth = Math.round(configuredHeight * (naturalWidth / naturalHeight));
        return;
      }

      this.mapWidth = naturalWidth;
      this.mapHeight = naturalHeight;
      return;
    }

    this.mapWidth = configuredWidth ?? this.defaultMapWidth;
    this.mapHeight = configuredHeight ?? this.defaultMapHeight;
  }

  private getPositiveNumber(value: unknown): number | null {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return null;
    }

    return numericValue;
  }

  private getContainedImageSize(
    imageWidth: number,
    imageHeight: number,
    containerWidth: number,
    containerHeight: number
  ) {
    const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);

    return {
      width: imageWidth * scale,
      height: imageHeight * scale,
    };
  }

  private async loadMapAssets(): Promise<LoadedMapAssets> {
    const [background, markers] = await Promise.all([
      this.loadTextureSafely(this.settings.getMapImage(), 'map-background'),
      this.loadMarkerIcons(),
    ]);

    return { background, markers };
  }

  private getMarkerTexture(type: MapPointType): Texture | null {
    if (type === 'interest') {
      return this.markerIcons.interest;
    }

    return this.markerIcons.info;
  }

  private async loadMarkerIcons(): Promise<LoadedMarkerIcons> {
    const [interest, info] = await Promise.all([
      this.loadTextureSafely(this.settings.getTouristMarkerIcon(), 'interest-marker-icon'),
      this.loadTextureSafely(this.settings.getInfoMarkerIcon(), 'info-marker-icon'),
    ]);

    return { interest, info };
  }

  private async loadTextureSafely(src: string | null, alias: string): Promise<Texture | null> {
    if (!src) {
      return null;
    }

    try {
      return await this.loadTextureFromImage(this.addCacheBuster(src), alias);
    } catch (error) {
      console.error('Error loading map asset', error);
      return null;
    }
  }

  private loadTextureFromImage(src: string, label: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        image.crossOrigin = 'anonymous';
      }

      image.onload = () => {
        const texture = Texture.from(image, true);
        texture.label = label;
        resolve(texture);
      };
      image.onerror = () => reject(new Error(`No se pudo cargar la imagen ${label}: ${src}`));
      image.src = src;
    });
  }

  private addCacheBuster(src: string): string {
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      return src;
    }

    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}v=${Date.now()}`;
  }

  private openContextMenuAt(screenX: number, screenY: number): void {
    if (!this.isAdmin) {
      this.hideContextMenu();
      return;
    }

    const hostRect = this.mapHost().nativeElement.getBoundingClientRect();
    this.contextMenuPosition = {
      x: screenX,
      y: screenY,
    };
    this.contextWorldPosition = this.toWorldCoordinates(screenX, screenY);
    this.contextPointId =
      this.getEditablePointAt(this.contextWorldPosition.x, this.contextWorldPosition.y)?.id ?? null;
    this.showContextMenu = true;
  }

  private getEditablePointAt(worldX: number, worldY: number): MapPoint | null {
    const hitRadius = 38;

    return (
      this.basePoints.find((point) => Math.hypot(point.x - worldX, point.y - worldY) <= hitRadius) ?? null
    );
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
  }

  private zoomAtScreenPoint(scaleFactor: number): void {
    const host = this.mapHost().nativeElement;
    const point = {
      x: host.clientWidth / 2,
      y: host.clientHeight / 2,
    };
    const worldPoint = this.toWorldCoordinates(point.x, point.y);
    const currentScale = this.viewport.scale.x;
    const newScale = Math.min(2.5, Math.max(0.45, currentScale * scaleFactor));

    this.viewport.scale.set(newScale);
    this.viewport.position.set(
      point.x - worldPoint.x * newScale,
      point.y - worldPoint.y * newScale
    );
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
