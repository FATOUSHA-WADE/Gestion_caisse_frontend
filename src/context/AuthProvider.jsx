import { useState, useEffect, useRef } from "react";
import { AuthContext } from "./AuthContext";
import API from "../api/axios";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const hasTriedAuth = useRef(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (hasTriedAuth.current) return;
      hasTriedAuth.current = true;
      
      try {
        if (token) {
          const res = await API.get("/auth/me", { timeout: 5000 });
          const userData = res.data;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (error) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } else if (token) {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (updatedData) => {
    const currentUser = user || JSON.parse(localStorage.getItem("user"));
    if (!currentUser) return;
    
    const newUser = { ...currentUser, ...updatedData };
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, isOnline }}>
      {children}
    </AuthContext.Provider>
  );
}