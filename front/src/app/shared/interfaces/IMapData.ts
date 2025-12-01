import { PickProps } from './generic';
import { IMapBackground } from './IMapBackground';
import { IMapDataType } from './IMapDataType';

export interface SlotData {
  id: string;
  index: number;
}

export interface IMapData {
  id: number;
  type: IMapDataType;
  x: number;
  y: number;
  label?: string;
}

export interface ISerializeMap {
  shapes: IMapData[];
  map: IMapBackground[];
  size: { width: number; height: number };
}

export type IMapDataMeta = PickProps<IMapData, 'label' | 'type' | 'id'>;
