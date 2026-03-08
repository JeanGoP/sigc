export class User {
  constructor(
    public id: string,
    public username: string,
    public password: string,
    public fullName: string,
    public email: string,
    public role: string,
    public token?: string,
    public tenantId?: string,
    public mustChangePassword: boolean = false,
    public telephonyEnabled: boolean = false
  ) {}
}
