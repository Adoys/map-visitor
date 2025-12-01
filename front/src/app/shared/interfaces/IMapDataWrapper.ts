import { IDataBackground } from './IDataBackground';
import { IMapBackground } from './IMapBackground';
import { IMapData } from './IMapData';

export interface IMapDataWrapper {
  _id: string;
  name: string;
  shapes: IMapData[];
  background: IDataBackground;
  maps: IMapBackground[];
}
