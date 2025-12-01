import { ElementRef } from '@angular/core';
import { Actions, Interpolations } from 'pixi-actions';
import {
  Application,
  Assets,
  ColorSource,
  Container,
  EventBoundary,
  FederatedMouseEvent,
  Point,
  Rectangle,
  RenderTexture,
  Renderer,
  Sprite,
  Texture,
  UnresolvedAsset,
} from 'pixi.js';

import { hasValue } from './utilities';
import { AreaBounds, Coordinates, Dimensions, ObjectWithDimensions } from '../interfaces/pixi';
import { ContainerDescriptor, SpriteTint } from '../interfaces/map';
import { Nullable } from 'primeng/ts-helpers';
import { IFilterSlot } from '../interfaces/IFilterSlot';
import { IMapDataMeta } from '../interfaces/IMapData';
import { SessionInfo } from '../interfaces/IMapInfo';
import { IStateBox } from '../interfaces/IStateBox';

const getAspectRatio = <T>({ height, width }: ObjectWithDimensions<T>) => {
  return width / height;
};

export const fitBackgroundToArea = (mapSprite: Sprite, dimensions: Dimensions, originalScale: number) => {
  const { width: areaWidth, height: areaHeight } = dimensions;
  const textureWidth = mapSprite.texture.width;
  const textureHeight = mapSprite.texture.height;

  const scaleX = areaWidth / textureWidth;
  const scaleY = areaHeight / textureHeight;

  mapSprite.scale.set(scaleX > originalScale ? scaleX : originalScale, scaleY > originalScale ? scaleY : originalScale);
};

export const getNewDimensions = <T, U>(
  objectWithDimensions: ObjectWithDimensions<T>,
  containerWithDimensions: ObjectWithDimensions<U>,
) => {
  const objectRatio = getAspectRatio(objectWithDimensions);
  const containerRatio = getAspectRatio(containerWithDimensions);
  const ratio = objectRatio < containerRatio ? objectRatio : containerRatio;

  if (ratio > 1) {
    return {
      width: containerWithDimensions.width,
      height: containerWithDimensions.width / ratio,
    };
  }

  return {
    width: containerWithDimensions.height * ratio,
    height: containerWithDimensions.height,
  };
};

export const loadAssets = async (assets: UnresolvedAsset[]) => {
  for (const asset of assets) {
    const alias = asset.alias?.toString() ?? '';
    Assets.add(asset);

    await Assets.load<Texture>(asset).then(() => {
      const theAsset = Assets.get<Texture>(alias);
      if (hasValue(theAsset)) {
        theAsset.label = alias?.length > 0 ? alias : theAsset.label;
      }
      return;
    });
  }

  return assets.flatMap(({ alias }) => (Array.isArray(alias) ? alias : [alias]));
};

export const addMapSprite = (container: Container, map: Sprite) => {
  map.label = 'map';
  container.label = 'map-container';

  map.position = { x: 0, y: 0 };
  map.anchor.set(0, 0);

  container.getChildByLabel('map')?.destroy();
  container.addChild(map);
  return container;
};

export const setSpriteTexture = <T>({
  screen,
  sprite,
  texture,
}: {
  texture: Texture;
  sprite: Sprite;
  screen: ObjectWithDimensions<T>;
}) => {
  sprite.texture = texture;
  sprite.width = texture.width;
  sprite.height = texture.height;

  const scale = Math.min(screen.width / sprite.width, screen.height / sprite.height);
  sprite.scale.set(scale);
};

export const onPanning = (e: FederatedMouseEvent, position: Coordinates, container: Container) => {
  const tempPosition = {
    x: container.x + e.clientX - position.x,
    y: container.y + e.clientY - position.y,
  };
  /*
  const minX = -container.width + 250;
  const minY = -container.height + 250;
  const maxX = app.canvas.width - 250;
  const maxY = app.canvas.height - 250;

  container.x = Math.max(minX, Math.min(tempPosition.x, maxX));
  container.y = Math.max(minY, Math.min(tempPosition.y, maxY));
  */
  container.x = tempPosition.x;
  container.y = tempPosition.y;
};

export const updateZooming = ({
  scaleFactor,
  container,
  point,
  localPos,
}: {
  scaleFactor: number;
  container: Container;
  point: Coordinates;
  localPos: Coordinates;
}) => {
  const minScale = 0.1;
  const maxScale = 10;

  let newScaleX = container.scale.x * scaleFactor;
  let newScaleY = container.scale.y * scaleFactor;

  newScaleX = Math.max(minScale, Math.min(newScaleX, maxScale));
  newScaleY = Math.max(minScale, Math.min(newScaleY, maxScale));

  const targetX = point.x - localPos.x * newScaleX;
  const targetY = point.y - localPos.y * newScaleY;

  const duration = 0.1;

  const scaleAction = Actions.scaleTo(container, newScaleX, newScaleY, duration, Interpolations.linear);
  const moveAction = Actions.moveTo(container, targetX, targetY, duration, Interpolations.linear);

  Actions.parallel(scaleAction, moveAction).play();
};

export const zoomToZone = (
  containers: Container[],
  mapContainer: Container,
  overridePoint?: Coordinates,
  overrideLocalPos?: Coordinates,
) => {
  if (!hasValue(mapContainer) || containers.length === 0) return;

  const isSingle = containers.length === 1;
  const dimensions = getAreaDimensions(containers);
  const { width: mapWidth, height: mapHeight } = mapContainer;
  const contentCenter = getAreaCenter(dimensions);
  const point = overridePoint ?? getContainerCenter(mapContainer);
  const localPos = overrideLocalPos ?? contentCenter;

  const scaleBase = Math.min(mapWidth / dimensions.width, mapHeight / dimensions.height);
  const scaleFactor = isSingle ? scaleBase * 2 : scaleBase * 0.2;

  updateZooming({
    scaleFactor,
    container: mapContainer,
    point,
    localPos,
  });
};

export const getAreaCenter = ({ minX, minY, maxX, maxY }: AreaBounds): Point => {
  return new Point((minX + maxX) / 2, (minY + maxY) / 2);
};

export const getAreaDimensions = (containers: Container[]): AreaBounds => {
  const { minX, minY, maxX, maxY } = containers.reduce(
    (acc, container) => {
      const { x, y, width, height } = container.getBounds();
      return {
        minX: Math.min(acc.minX, x),
        minY: Math.min(acc.minY, y),
        maxX: Math.max(acc.maxX, x + width),
        maxY: Math.max(acc.maxY, y + height),
      };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  const width = maxX - minX;
  const height = maxY - minY;

  return { minX, minY, maxX, maxY, width, height };
};

export const isDropAllowed = (position: Coordinates, mapContainer: Container): boolean => {
  return true; // TEMPORAL until we decide if we want to restrict the drop area to the map boundaries. See Pedro vs Jose.
  const bounds = mapContainer.getLocalBounds();
  const boundsRect = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  if (boundsRect.contains(position.x, position.y)) return true;
  else return false;
};

export const onDragContainer = (
  event: FederatedMouseEvent,
  container: Container,
  offset: Coordinates,
  mapContainer: Container,
) => {
  const localPosition = mapContainer.toLocal(event.global);
  const desiredX = localPosition.x - offset.x;
  const desiredY = localPosition.y - offset.y;

  container.position.set(desiredX, desiredY);
};

export const zoomAll = (mapContainer: Container, app: Application) => {
  const rendererWidth = app.renderer?.width ?? 1;
  const rendererHeight = app.renderer?.height ?? 1;

  const bounds = mapContainer.getLocalBounds();

  const scale = Math.min(rendererWidth / bounds.width, rendererHeight / bounds.height);
  mapContainer.scale.set(scale);

  const offsetX = (rendererWidth - bounds.width * scale) / 2;
  const offsetY = (rendererHeight - bounds.height * scale) / 2;

  mapContainer.position.set(offsetX - bounds.x * scale, offsetY - bounds.y * scale);
};

export const rotateContainer = (container: Container, angle: number) => {
  container.angle = angle;
};

export const clampPositionWithinBounds = (
  child: Container,
  parent: Container,
  desiredX: number,
  desiredY: number,
): Coordinates => {
  const parentBounds = parent.getBounds();
  const childBounds = child.getBounds();

  const offsetXRight = childBounds.right - child.x;
  const offsetXLeft = childBounds.left - child.x;
  const offsetYBottom = childBounds.bottom - child.y;
  const offsetYTop = childBounds.top - child.y;

  const minX = parentBounds.left - offsetXLeft;
  const maxX = parentBounds.right - offsetXRight;
  const minY = parentBounds.top - offsetYTop;
  const maxY = parentBounds.bottom - offsetYBottom;

  return {
    x: Math.max(minX, Math.min(desiredX, maxX)),
    y: Math.max(minY, Math.min(desiredY, maxY)),
  };
};

export const containerToBase64 = async ({
  renderer,
  container,
}: {
  renderer?: Renderer;
  container: Container;
}): Promise<string> => {
  if (!renderer) {
    const app = new Application();
    await app.init();
    renderer = app.renderer;
  }

  const { height, width } = container;
  const renderTexture = RenderTexture.create({ width, height });

  renderer.render({ container, target: renderTexture });
  return await renderer.extract.base64({ target: renderTexture });
};

export const getTextureFromAsset = (assetId: string): Texture => {
  return Assets.get<Texture>(assetId);
};

export const containerBuilder = (descriptor: ContainerDescriptor, scale = 0.2): Container => {
  const c = new Container({ label: descriptor.label });

  const internalSprites = descriptor.data.map(({ assetId, label, x, y, angle, anchor }) => {
    return new Sprite({
      texture: getTextureFromAsset(assetId),
      label,
      anchor,
      x,
      y,
      angle,
      tint: 0x000000, // INFO: convert white icon into black
      interactive: true,
    });
  });
  c.addChild(...internalSprites);
  c.scale.set(scale * descriptor.scale);

  return c;
};

export const getContainerCenter = (container: ObjectWithDimensions) => {
  return {
    x: container.width / 2,
    y: container.height / 2,
  };
};

export const isSprite = (item: unknown) => item instanceof Sprite;
export const isContainer = (item: unknown) => item instanceof Container;
export const isBackgroundContainer = (container: Container) => container?.label === 'stage';
export const isRotateIcon = (container: Container) => container?.label === 'rotate';
export const isMultiSlotContainer = (container: Container) => (container?.parent?.children?.length ?? 0) > 1;

export const removeAllRotateIconsFrom = (c: Container) => {
  c.getChildrenByLabel('rotate', true).forEach((rotateIcon) => {
    rotateIcon.destroy();
  });
};

export const calculateAngle = (event: FederatedMouseEvent, container: Container, calcToRest: number): number => {
  const { x: mouseX, y: mouseY } = event.global;
  const centerGlobal = container.parent?.toGlobal(container.position);
  return Math.atan2(mouseY - (centerGlobal?.y ?? 0), mouseX - (centerGlobal?.x ?? 0)) - calcToRest;
};

export const onRotateContainer = (moveEvent: FederatedMouseEvent, initialAngle: number, container: Container) => {
  const angle = calculateAngle(moveEvent, container, initialAngle) * (180 / Math.PI);
  rotateContainer(container, angle);
};

export const getTopCenteredCoordinates = (
  baseContainer: Container,
  centeredContainer: Container,
  margin = 10,
): Coordinates => {
  const x = baseContainer.x + baseContainer.width / 2 - centeredContainer.width / 2;
  const y = baseContainer.y - centeredContainer.height - margin;
  return { x, y };
};

export const checkIntersection = (container: Container, coordinates: Coordinates) => {
  const mapContainerBoundary = new EventBoundary(container);
  return mapContainerBoundary.hitTest(coordinates.x, coordinates.y) !== null;
};

export const getDistance = (point1: Coordinates, point2: Coordinates) => {
  return Math.hypot(point1.x - point2.x, point1.y - point2.y);
};

export const applyTint = ({ alpha, color, sprite }: SpriteTint) => {
  sprite.tint = color;
  sprite.alpha = alpha;
};

export const createSessionEventParser =
  ({
    containers,
    elementsMap,
    getStateForSlot,
    filters,
  }: {
    containers: Container[];
    elementsMap: Map<string, IMapDataMeta>;
    getStateForSlot: (slot: SessionInfo<string>) => IStateBox | undefined;
    filters?: IFilterSlot[];
  }) =>
  (slot: SessionInfo<string>): Nullable<SpriteTint[]> => {
    const state = getStateForSlot(slot);
    if (!state) return null;

    const hasFilterWithoutBank = filters?.some((f) => !f.location.bank || f.location.bank === 0);
    const hasFilterWithoutSection = filters?.some((f) => !f.location.section || f.location.section === 0);

    const matchingContainers = containers
      .map((slotContainer) => slotContainer.children.find((f) => !isRotateIcon(f)))
      .filter(hasValue)
      .filter((f) => {
        if (state.state === 'uncard') {
          return true;
        }
        const meta = elementsMap.get(f.label);
        if (!meta) return false;

      //  const slotBank = meta.bank;
       // const slotSection = String(meta.section);

        if (hasValue(hasFilterWithoutBank) && !hasValue(hasFilterWithoutSection)) {
        //  return slotSection === slot.section;
        } else if (!hasValue(hasFilterWithoutBank) && hasValue(hasFilterWithoutSection)) {
        //  return slotBank === slot.bank;
        }

      //  return slotBank === slot.bank && slotSection === slot.section;
      return true;
      });

    const sprites = matchingContainers
      .flatMap((container) => container.children)
      .filter((child) => child.label === slot.box_id);

    const color: ColorSource = state.color.replace('#', '0x');
    return sprites.map((sprite) => ({
      sprite,
      color,
      alpha: state.alpha,
    }));
  };

export const roundTo = (decimals: number) => (num: number) => Math.round(num * 10 ** decimals) / 10 ** decimals;

export const resizeCanvasToContainer = (
  mapRef: ElementRef<HTMLDivElement>,
  app: Application,
  mapContainer: Container,
  viewDefault: { zoom: Coordinates; pan: Coordinates },
) => {
  const container = mapRef.nativeElement;
  if (!hasValue(container)) return;

  const width: number = container.clientWidth;
  const height: number = container.clientHeight;
  app.renderer.resize(width, height);
  resetView(mapContainer, viewDefault, app);
};

export const resetView = (
  mapContainer: Container,
  viewDefault: { zoom: Coordinates; pan: Coordinates },
  app: Application,
) => {
  mapContainer.scale.set(viewDefault.zoom.x, viewDefault.zoom.y);
  mapContainer.x = viewDefault.pan.x;
  mapContainer.y = viewDefault.pan.y;
  zoomAll(mapContainer, app);
};

export const getRelativeMousePosition = (event: FederatedMouseEvent, relativeTo: ElementRef<HTMLDivElement>) => {
  const rect = relativeTo.nativeElement.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

export const getAllSlotInContainer = (container: Container): Container[] => {
  return container.children.filter((f) => f.label !== 'map');
};
