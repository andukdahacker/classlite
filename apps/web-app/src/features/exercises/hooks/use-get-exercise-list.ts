import { useInfiniteQuery } from "@tanstack/react-query";
import { getExerciseList } from "../network/get-exercise-list";

function useGetExerciseList(searchString: string) {
  const query = useInfiniteQuery({
    queryKey: ["exerciseList", searchString],
    queryFn: async (value) => {
      return getExerciseList({
        take: 20,
        cursor: value.pageParam == "" ? undefined : value.pageParam,
        isPublic: false,
        searchString: searchString,
      });
    },
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage?.pageInfo.cursor,
  });

  return query;
}

export default useGetExerciseList;
