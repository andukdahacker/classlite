import { useQuery } from "@tanstack/react-query";
import { getCenterClassList } from "../network/get-center-class";

function useGetCenterClass(centerId: string) {
  const query = useQuery({
    queryKey: ["centerClass"],
    queryFn: () => getCenterClassList({ centerId }),
  });

  return query;
}

export { useGetCenterClass };
