export interface Smtp {
  id?: number;
  host: string;
  port: number;
  security: string;
  username: string;
  password: string;
  email: string;
}
