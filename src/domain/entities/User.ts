import { Role } from '../enums/Role';

export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public password: string,
    public name: string,
    public role: Role,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: {
    id?: string;
    email: string;
    password: string;
    name: string;
    role?: Role;
  }): User {
    return new User(
      props.id || crypto.randomUUID(),
      props.email,
      props.password,
      props.name,
      props.role || Role.USER,
      new Date(),
      new Date(),
    );
  }

  isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }
}
