import { ColorSource, Container, PointData } from 'pixi.js';
import { IMapDataMeta } from '../../../shared/interfaces/IMapData';
import { IStateBox } from '../../../shared/interfaces/IStateBox';
import { MapState } from '../../../shared/interfaces/MapState';


export type ActionCallback = () => void;

export interface ActionConfig {
  callback: ActionCallback;
}

export type EventType = 'back' | 'slots';

export type ActionByType = Record<EventType, Record<string, ActionConfig>>;

export type ButtonActions = 'zoomAll' | 'zoomIn' | 'zoomOut';

export interface IMenuItem {
  id: string;
  icon: string;
  option: string;
  disabled?: boolean;
}

export type IMenu = Record<string, IMenuItem[]>;

export type MapMode = 'edit' | 'view';

export interface ContainerDescriptorData {
  assetId: string;
  label: string;
  x: number;
  y: number;
  angle: number;
  anchor: PointData;
}

export interface ContainerDescriptor {
  label: string;
  data: ContainerDescriptorData[];
  scale: number;
}

export interface SelectedElement {
  type: 'back' | 'slots';
  container: Container;
  isMultiSlot: boolean;
  slotContainer: Container;
  rootContainer: Container;
  previousElementSelected: { element: SelectedElement | null; sameParent: boolean } | null;
}

export interface LayoutProperties {
  scaleX: number;
  scaleY: number;
}

export interface CanvasStatus {
  states: MapState<IStateBox>;
  containers: Container[];
  elementsMap: Map<string, IMapDataMeta>;
}

export interface SpriteTint {
  color: ColorSource;
  sprite: Container;
  alpha: number;
}
