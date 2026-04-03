export type UserRole = 'ADMIN' | 'SCREEN';

export interface User {
  id: number;
  userId: string;
  email: string;
  role: UserRole;
  password: string;
}
