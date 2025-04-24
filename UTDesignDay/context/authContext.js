// this file handles everything with guests and users such as logging in, creating an account.
// creating an id for guests 

import React, { createContext, useState, useEffect, useContext, useRef} from "react";
import * as SecureStore from "expo-secure-store";
import {jwtDecode} from "jwt-decode"; 
import { useRouter } from "expo-router";
import uuid from 'react-native-uuid';
import { AppState } from "react-native";
import Toast from "react-native-toast-message";
import { getSocket, disconnectSocket } from "@/utils/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [guestId, setGuestId] = useState(null);
  // const hasLaunchedOnce = useRef(false);
  


  useEffect(() => {
    loadTokenAndGuest();
  }, []);

  // auto logout if token has expired.
  useEffect(() => {
    let interval;
    if (authToken) {
      const decodedToken = jwtDecode(authToken);
      const exp = decodedToken.exp * 1000;
      const timeLeft = exp - Date.now();

      if (timeLeft > 0) {
        interval = setTimeout(() => {
          console.log("Token expired. Logging out...");
          Toast.show({
            type: "info",
            text1: "Session Expired",
            text2: "Please log in again.",
          });
          logout();
        }, timeLeft);
      } else {
        logout();
      }
    }
    return () => clearTimeout(interval);
  }, [authToken]);

  // detect if user has been given admin access
  useEffect(() => {
    const socket = getSocket();
  
    if (!user) return;
  
    socket.on("userRoleChanged", (updatedUser) => {

      // check if the updated user is someone else
      if (updatedUser._id !== user._id) return;

      const newIsAdmin = updatedUser.role === "admin";
    
      setUser(updatedUser);
      setIsAdmin(newIsAdmin);
      setIsAdminMode(newIsAdmin);
    
      if (newIsAdmin) {
        Toast.show({
          type: "success",
          text1: "Access Updated",
          text2: "You have been granted admin access.",
        });
        router.replace("/dashboard");
      } else {
        Toast.show({
          type: "info",
          text1: "Access Updated",
          text2: "Admin access has been revoked.",
        });
        setIsAdminMode(false);

        router.replace("/"); 
      }
    });
  
    return () => {
      socket.off("userRoleChanged");
    };
  }, [user]);

  // app foreground/background token checker
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "active") {
        const storedToken = await SecureStore.getItemAsync("auth_token");
  
        if (storedToken) {
          const decoded = jwtDecode(storedToken);
          const exp = decoded.exp * 1000;
  
          if (Date.now() >= exp) {
            Toast.show({ type: "info", text1: "Session Expired", text2: "Please log in again." });
            logout();
          } else {
            setAuthToken(storedToken);
            // await fetchUserProfile(storedToken, true);
          }
        }
      }
    });
  
    return () => {
      subscription.remove();
    };
  }, []);

   // Load token from SecureStore when app starts
  const loadTokenAndGuest = async () => {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      setAuthToken(token);
      await fetchUserProfile(token);
    } else {
      //handle guest
      let id = await SecureStore.getItemAsync("guest_id");
      // console.log("current guest id:", id)
      if (!id) {
        // create guest id if none
        id = uuid.v4()
        await SecureStore.setItemAsync("guest_id", id);
        console.log("new guest id has been created")
      }
      setGuestId(id);
      // console.log("guest id has been set:", id)
    }
  };

  // fetch User Profile
  const fetchUserProfile = async (token) => {
    try {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id; 
      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data);
        setIsAdmin(data.role === "admin");
        setIsAdminMode(data.role === "admin");

        if (data.role === "admin") {
          router.replace("/dashboard");
        } else {
          router.replace("/");
        }

        // return data; // return the user data for further use if needed
        // }
        
      } else {
        await logout();
        // return null
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      await logout();
      // return null
    }
  };

  // register User
  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("new user created!");
        router.replace("/(auth)/login");
        return { success: true };
      } else {
        return { success: false, message: data.error || "User with that email already exists" };
      }
    } catch (error) {
      return { success: false, message: "Registration error" };
    }
  };

  // login User
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await SecureStore.setItemAsync("auth_token", data.token);
        setAuthToken(data.token);
        setUser(data.user);
        setIsAdmin(data.user.role === "admin");
        setIsAdminMode(data.user.role === "admin"); 

        
        if (data.user.role === "admin") {
          router.replace("/dashboard");
        } else {
          router.replace("/");
        }
        return { success: true };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      return { success: false, message: "Login error" };
    }
  };

  // logout User
  const logout = async () => {
    await fetch(`${API_URL}/session`, { method: "DELETE" }); 
    await SecureStore.deleteItemAsync("auth_token");
    setUser(null);
    setAuthToken(null);
    setIsAdmin(false);
    setIsAdminMode(false);
    disconnectSocket();

    await loadTokenAndGuest(); 
    router.replace("/");
    
  };

  return (
    <AuthContext.Provider value={{ user, authToken, isAdmin, isAdminMode, guestId, login, register, logout, setIsAdmin, setIsAdminMode }}>
      {children}
    </AuthContext.Provider>
  );
};

// custom kook to use authContext
export const useAuth = () => useContext(AuthContext);
