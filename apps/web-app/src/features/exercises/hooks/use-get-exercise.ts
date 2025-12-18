import { useQuery } from "@tanstack/react-query";
import { getExercise } from "../network/get-exercise";

function useGetExercise(id: string) {
  const query = useQuery({
    queryKey: ["exercise", id],
    queryFn: async () => getExercise(id),
  });

  return query;
}

export { useGetExercise };
