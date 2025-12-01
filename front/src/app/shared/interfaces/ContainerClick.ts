import { IBoxInfo } from './IBoxInfo';
import { SlotData } from './IMapData';

export interface ContainerClick {
  group: IBoxInfo<string> | null;
  element: SlotData | null;
}
