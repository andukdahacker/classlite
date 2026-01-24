import React, { createContext, useContext, useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/core/client";
import type { TenantData, UpdateCenterInput } from "@workspace/types";

interface TenantContextType {
  tenant: TenantData["center"] | null;
  isLoading: boolean;
  updateBranding: (input: UpdateCenterInput) => Promise<{ center: TenantData["center"], owner: TenantData["owner"] }>;
  uploadLogo: (file: File) => Promise<string>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["tenant", user?.centerId],
    queryFn: async () => {
      if (!user?.centerId) return null;
      const { data, error } = await client.GET("/api/v1/tenants/{id}", {
        params: { path: { id: user.centerId } },
      });
      if (error) throw error;
      return data.data;
    },
    enabled: !!user?.centerId,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateCenterInput) => {
      if (!user?.centerId) throw new Error("No centerId");
      const { data, error } = await client.PATCH("/api/v1/tenants/{id}", {
        params: { path: { id: user.centerId } },
        body: input,
      });
      if (error) throw error;

      if (!data.data) throw new Error("No data");

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", user?.centerId] });
    },
  });

  const uploadLogo = async (file: File) => {
    if (!user?.centerId) throw new Error("No centerId");

    const formData = new FormData();
    formData.append("file", file);

    const baseUrl = import.meta.env.PROD
      ? "https://api.classlite.app"
      : "http://localhost:4000";

    const response = await fetch(
      `${baseUrl}/api/v1/tenants/${user.centerId}/logo`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      },
    );

    if (!response.ok) throw new Error("Failed to upload logo");
    const result = await response.json();

    queryClient.invalidateQueries({ queryKey: ["tenant", user?.centerId] });
    return result.data.logoUrl;
  };

  // CSS Variable injection
  useEffect(() => {
    if (data?.center?.brandColor) {
      document.documentElement.style.setProperty(
        "--primary",
        hexToHslVariables(data.center.brandColor),
      );
    }
  }, [data?.center?.brandColor]);

  return (
    <TenantContext.Provider
      value={{
        tenant: data?.center ?? null,
        isLoading,
        updateBranding: (input) => updateMutation.mutateAsync(input),
        uploadLogo,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

// Helper to convert hex to shadcn-compatible HSL variables if needed
// For now, let's keep it simple and just set the hex if tailwind handles it
// But shadcn usually expects HSL components for variables like --primary
function hexToHslVariables(hex: string): string {
  // Simple implementation for now - might need refinement for full shadcn theme support
  // This is a placeholder for the logic to convert #RRGGBB to "H S% L%"
  return hex; // Tailwinds v4/modern might handle hex directly in variables better
}
