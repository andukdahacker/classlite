import { useQuery } from "@tanstack/react-query";
import getUserList from "../network/get-user-list";

function useGetUserList() {
  const query = useQuery({
    queryKey: ["users"],
    queryFn: () => getUserList(),
  });

  return query;
}

export { useGetUserList };
