import { useQuery } from "@tanstack/react-query";
import { getStudentClass } from "../network/get-student-class";

function useGetStudentClass(classId: string) {
  const query = useQuery({
    queryKey: ["studentClass"],
    queryFn: () => getStudentClass({ classId }),
  });

  return query;
}

export { useGetStudentClass };
