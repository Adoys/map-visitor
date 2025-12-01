export interface Base64File {
  data: string;
  filename: string;
}
export type Base64Image = Base64File & { width: number; height: number };
