import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [userRole, setUserRole] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      return parsedUser.user_role || "student"; // Default to student
    }
    return "student";
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUserRole(parsedUser.user_role || "student");
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, userRole, setUserRole, userId: user?.user_id }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
