import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useContext,
    useReducer
} from "react";
import { authService } from "../api";
import { AuthContextType, User } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthState {
  isLoading: boolean;
  isSignout: boolean;
  user: User | null;
}

interface AuthAction {
  type: "RESTORE_TOKEN" | "SIGN_IN" | "SIGN_UP" | "SIGN_OUT";
  payload?: any;
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "RESTORE_TOKEN":
      return {
        ...state,
        isLoading: false,
        user: action.payload,
      };
    case "SIGN_IN":
    case "SIGN_UP":
      return {
        ...state,
        isSignout: false,
        user: action.payload,
      };
    case "SIGN_OUT":
      return {
        ...state,
        isSignout: true,
        user: null,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, {
    isLoading: true,
    isSignout: false,
    user: null,
  });

  React.useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (user) {
          dispatch({ type: "RESTORE_TOKEN", payload: JSON.parse(user) });
        } else {
          // Mock user para desarrollo - permite ver todas las pantallas sin login
          const mockUser: User = {
            id: "mock-user-1",
            name: "Usuario Demo",
            email: "demo@proseapp.com",
            phone: "+54 9 123 456 7890",
            createdAt: new Date().toISOString(),
          };
          dispatch({ type: "RESTORE_TOKEN", payload: mockUser });
        }
      } catch (e) {
        console.error("Failed to restore token:", e);
        // Mock user como fallback
        const mockUser: User = {
          id: "mock-user-1",
          name: "Usuario Demo",
          email: "demo@proseapp.com",
          phone: "+54 9 123 456 7890",
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: "RESTORE_TOKEN", payload: mockUser });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (email: string, password: string) => {
        try {
          const response = await authService.signIn(email, password);
          await AsyncStorage.setItem("user", JSON.stringify(response.user));
          dispatch({ type: "SIGN_IN", payload: response.user });
        } catch (error) {
          throw error;
        }
      },
      signUp: async (name: string, email: string, password: string) => {
        try {
          const response = await authService.signUp(name, email, password);
          await AsyncStorage.setItem("user", JSON.stringify(response.user));
          dispatch({ type: "SIGN_UP", payload: response.user });
        } catch (error) {
          throw error;
        }
      },
      signOut: async () => {
        try {
          await authService.signOut();
          await AsyncStorage.removeItem("user");
          dispatch({ type: "SIGN_OUT" });
        } catch (error) {
          throw error;
        }
      },
      isLoading: state.isLoading,
      isSignout: state.isSignout,
      user: state.user,
    }),
    [state],
  );

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
