import { MapState } from './MapState';

export interface IMapInfo<T> {
  section: string;
  bank: string;
  box_id: string;
  states: MapState<T>;
  icon?: string;
}

export interface IMapInfoWrapper<T> {
  id: string;
  sessions: SessionInfo<T>[];
}

export enum ISessionType {
  SLOT = 'SLOT',
  TABLE = 'TABLE',
}

export type SessionInfo<T> = IMapInfo<T> & {
  box_internal_id?: string;
  box_type: ISessionType;
};
