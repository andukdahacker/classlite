"use client";

import { Loader2Icon } from "lucide-react";
import { useGetUser } from "../hooks/use-get-user";

interface UserDetailsProps {
  id: string;
}

function UserDetails({ id }: UserDetailsProps) {
  const { data, isPending, error } = useGetUser(id);

  if (isPending) {
    return <Loader2Icon className="animate-spin" />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>{data.email}</div>;
}

export { UserDetails };
