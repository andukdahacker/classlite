import { useQuery } from "@tanstack/react-query";
import { getClass } from "../network/get-class";

function useGetClass(id: string) {
  const query = useQuery({
    queryKey: ["class", id],
    queryFn: () => getClass(id),
  });

  return query;
}

export { useGetClass };
