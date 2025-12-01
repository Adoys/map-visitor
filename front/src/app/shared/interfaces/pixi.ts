export interface Dimensions {
  width: number;
  height: number;
}
export type ObjectWithDimensions<T = object> = Dimensions & T;

export interface Coordinates {
  x: number;
  y: number;
}

export interface AreaBounds extends Dimensions {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
