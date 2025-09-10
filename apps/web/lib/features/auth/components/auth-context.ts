"use client";

import { Center, User } from "@/lib/schema/types";
import React from "react";

interface AuthContextProps {
  center?: Center;
  user?: User;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = React.createContext<AuthContextProps>({
  center: undefined,
  user: undefined,
  isAuthenticated: false,
  isLoading: true,
});
