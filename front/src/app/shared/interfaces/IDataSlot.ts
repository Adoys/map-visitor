import { ETypeSlot } from './ETypeSlot';
import { IMapDataType } from './IMapDataType';
import { InternalSlot } from './internal-slot';

export interface IDataSlotValue {
  numSlot?: number;
  type?: ETypeSlot;
  internalSlot?: InternalSlot;
}

export type IDataSlot = Record<IMapDataType, IDataSlotValue>;

export interface InternalSlotData {
  repeat: number;
  type: ETypeSlot;
  label: string;
  id: string;
  assetId: string;
  scale: number;
}
