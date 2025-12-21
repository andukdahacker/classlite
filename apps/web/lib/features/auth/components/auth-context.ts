"use client";

import type { Center, User } from "@workspace/types";
import React from "react";

interface AuthContextProps {
  center?: Center;
  user?: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  logOut: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextProps>({
  center: undefined,
  user: undefined,
  isAuthenticated: false,
  isLoading: true,
  logOut: async () => {},
});
