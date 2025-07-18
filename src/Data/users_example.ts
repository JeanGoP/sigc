import { User } from "@app/models/auth/User.model";

export const users: User[] = [
    {
      id: "1",
      username: "admin",
      password: "123456",
      email: "egutierrez@sidecil.co",
      role: "admin",
    },
    {
      id: "2",
      username: "manager_user",
      password: "manager1234",
      email: "manager@example.com",
      role: "manager",
    },
    {
      id: "3",
      username: "client_user",
      password: "client1234",
      email: "client@example.com",
      role: "client",
    }
  ];