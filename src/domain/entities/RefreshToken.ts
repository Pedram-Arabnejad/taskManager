export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly token: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
  ) {}

  static create(props: {
    id?: string;
    token: string;
    userId: string;
    expiresAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      props.id || crypto.randomUUID(),
      props.token,
      props.userId,
      props.expiresAt,
      new Date(),
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
