import { SlotData } from './IMapData';
import { MapState } from './MapState';

export interface IBoxInfo<T> {
  box_id?: string;
  uuid: string;
  bank: string;
  section: string;
  states?: MapState<T>;
  coordX: number;
  coordY: number;
  shapes?: SlotData[];
  rotate?: number;
}
