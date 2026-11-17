import type { Role } from '../../../domain/entities/user';
import type { User } from '../../../domain/entities/user';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/**
 * The only place a user is turned into JSON. `passwordHash` is not part of the
 * shape at all, so it cannot leak by accident.
 */
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email.value,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
