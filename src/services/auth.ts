import { users } from '@app/Data/users_example';
import { User } from '@app/models/auth/User.model';
// import { firebaseAuth } from '@app/firebase';
import { IUser } from '@app/types/user';
import { saveObjectToLocalStorage } from '@app/utils/localStorageHandler';
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
        email,
        password,
        id: '1',
        username: 'admin_user',
        role: 'admin',
      },
    };

    addUser(result.user);

    return result;
  } catch (error) {
    throw error;
  }
};

const addUser = (newUser: IUser)=> {
  users.push(newUser);
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      userId: number;
      username: string;
      passwordHash: string | null;
      fullName: string | null;
      isActive: boolean;
      createdAt: string;
      roles: string[];
    };
  };
  statusCode: number;
  errors: string[];
}

export const loginWithEmail = async (username: string, password: string): Promise<User | null> => {
  try {
    const response = await fetch('https://localhost:7013/api/Auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data: LoginResponse = await response.json();

    if (data.success) {
      // Guardar el token en localStorage con la clave correcta
      localStorage.setItem('userAccess', JSON.stringify({
        id: data.data.user.userId.toString(),
        username: data.data.user.username,
        email: data.data.user.username,
        role: data.data.user.roles[0],
        token: data.data.token
      }));
      
      // Crear y retornar el objeto User
      return new User(
        data.data.user.userId.toString(),
        data.data.user.username,
        '', // No guardamos el password
        data.data.user.username, // Usamos username como email
        data.data.user.roles[0], // Tomamos el primer rol
        data.data.token // Incluimos el token
      );
    }
    
    return null;
  } catch (error) {
    console.error('Error en login:', error);
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
