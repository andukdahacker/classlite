import { useQuery } from "@tanstack/react-query";
import { getAssignment } from "../network/get-assignment";

function useGetAssignment(id: string) {
  const query = useQuery({
    queryKey: ["assignment", id],
    queryFn: async () => await getAssignment(id),
  });

  return query;
}

export default useGetAssignment;
