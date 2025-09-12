import { users } from "@app/Data/users_example";
import { User } from "@app/models/auth/User.model";
// import { firebaseAuth } from '@app/firebase';
import { IUser } from "@app/types/user";
import { saveObjectToLocalStorage } from "@app/utils/localStorageHandler";

const API_URL = import.meta.env.VITE_API_URL;
// import { createUserWithEmailAndPassword } from '@firebase/auth';
// import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
// import { GoogleAuthProvider } from 'firebase/auth';

// const provider = new GoogleAuthProvider();

// export const loginByAuth = async (email: string, password: string) => {
//   const token = 'I_AM_THE_TOKEN';
//   localStorage.setItem('token', token);
//   removeWindowClass('login-page');
//   removeWindowClass('hold-transition');
//   return token;
// };

// export const registerByAuth = async (email: string, password: string) => {
//   const token = 'I_AM_THE_TOKEN';
//   localStorage.setItem('token', token);
//   removeWindowClass('register-page');
//   removeWindowClass('hold-transition');
//   return token;
// };

export const registerWithEmail = async (email: string, password: string) => {
  try {
    // const result = await createUserWithEmailAndPassword(
    //   firebaseAuth,
    //   email,
    //   password
    // );
    const result = {
      user: {
        id: "1",
        username: "admin_user",
        password,
        fullName: "New User",
        email,
        role: "admin",
      },
    };

    addUser(result.user);

    return result;
  } catch (error) {
    throw error;
  }
};

const addUser = (newUser: IUser) => {
  users.push(newUser);
};

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: {
      creado: string; // ISO Date string
      email: string;
      expira: string; // ISO Date string
      fullName: string | null;
      isActive: boolean;
      role: string;
      token: string;
      userId: number;
      username: string;
    };
  };
  statusCode: number;
  errors: string[];
}

export const loginWithEmail = async (
  Username: string,
  Password: string
): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/api/v1/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
      body: JSON.stringify({
        Username,
        Password,
      }),
    });

    const data: LoginResponse = await response.json();
    console.log("Login exitoso:", data);

    if (data.success) {
      // Guardar el token en localStorage con la clave correcta
      localStorage.setItem(
        "userAccess",
        JSON.stringify({
          id: data.data.token.userId.toString(),
          username: data.data.token.username,
          fullName: data.data.token.fullName || "", // Usamos fullName si está disponible
          email: data.data.token.username,
          role: data.data.token.role,
          token: data.data.token,
        })
      );

      // Crear y retornar el objeto User
      return new User(
        data.data.token.userId.toString(),
        data.data.token.username,
        "", // No guardamos el password
        data.data.token.fullName || "", // Usamos fullName si está disponible 
        data.data.token.email, // Usamos username como email
        data.data.token.role, // Tomamos el primer rol
        data.data.token.token // Incluimos el token
      );
    }

    return null;
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};

// export const signInByGoogle = async () => {
//   try {
//     return await signInWithPopup(firebaseAuth, provider);
//   } catch (error) {
//     throw error;
//   }
// };
