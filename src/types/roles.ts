// src/types/roles.ts
export enum Role {
  ADMIN = 'ADMIN',
  RH = 'RH',
  USER = 'USER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}