export type Nullable<T> = T | null;
export type Voidable<T> = T | void;
export type Indefinable<T> = T | undefined;
export type Numberable<T> = T | number;

export type PickProps<T, K extends keyof T> = Pick<T, K>;
