import { useQuery } from "@tanstack/react-query";
import getClassListByUser from "../network/get-class-list-by-user";

function useGetClassListByUser(userId: string) {
  const query = useQuery({
    queryKey: ["userClass"],
    queryFn: () => getClassListByUser({ userId }),
  });

  return query;
}

export default useGetClassListByUser;
