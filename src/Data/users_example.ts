import { User } from "@app/models/auth/User.model";

export const users: User[] = [
    {
      id: "1",
      username: "admin",
      password: "123456",
      fullName: "Administrador",
      email: "egutierrez@sidecil.co",
      role: "admin",
      mustChangePassword: false,
      telephonyEnabled: false,
    },
    {
      id: "2",
      username: "manager_user",
      password: "manager1234",
      fullName: "Manager User",
      email: "manager@example.com",
      role: "manager",
      mustChangePassword: false,
      telephonyEnabled: false,
    },
    {
      id: "3",
      username: "client_user",
      password: "client1234",
      fullName: "Client User",
      email: "client@example.com",
      role: "client",
      mustChangePassword: false,
      telephonyEnabled: false,
    }
  ];
