export type UserRole = 'admin' | 'screen';

export interface User {
  id: number;
  userId: string;
  email: string;
  role: UserRole;
  password: string;
}
