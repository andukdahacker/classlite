import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/core/client";
import type {
  Course,
  CreateCourseInput,
  UpdateCourseInput,
  CreateClassInput,
  UpdateClassInput,
  AddStudentToClassInput,
  ClassStudent,
  ClassSchedule,
  CreateClassScheduleInput,
  UpdateClassScheduleInput,
} from "@workspace/types";

export const useCourses = (centerId?: string | null) => {
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ["courses", centerId],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/logistics/courses/");
      if (error) throw error;
      return data.data as Course[];
    },
    enabled: !!centerId,
  });

  const createCourseMutation = useMutation({
    mutationFn: async (input: CreateCourseInput) => {
      const { data, error } = await client.POST("/api/v1/logistics/courses/", {
        body: input,
      });
      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", centerId] });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateCourseInput;
    }) => {
      // @ts-ignore
      const { data, error } = await client.PATCH(
        "/api/v1/logistics/courses/{id}",
        {
          params: { path: { id } },
          body: input,
        },
      );
      if (error) throw error;
      return data.data as Course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", centerId] });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.DELETE("/api/v1/logistics/courses/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", centerId] });
    },
  });

  return {
    courses: coursesQuery.data ?? [],
    isLoading: coursesQuery.isLoading,
    createCourse: createCourseMutation.mutateAsync,
    updateCourse: updateCourseMutation.mutateAsync,
    deleteCourse: deleteCourseMutation.mutateAsync,
  };
};

export const useClasses = (centerId?: string) => {
  const queryClient = useQueryClient();

  const classesQuery = useQuery({
    queryKey: ["classes", centerId],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/logistics/classes/");
      if (error) throw error;
      return data.data;
    },
    enabled: !!centerId,
  });

  const createClassMutation = useMutation({
    mutationFn: async (input: CreateClassInput) => {
      // @ts-ignore
      const { data, error } = await client.POST("/api/v1/logistics/classes/", {
        body: input,
      });
      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", centerId] });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateClassInput;
    }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/logistics/classes/{id}",
        {
          params: { path: { id } },
          body: input,
        },
      );
      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", centerId] });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.DELETE("/api/v1/logistics/classes/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", centerId] });
    },
  });

  return {
    classes: classesQuery.data ?? [],
    isLoading: classesQuery.isLoading,
    createClass: createClassMutation.mutateAsync,
    updateClass: updateClassMutation.mutateAsync,
    deleteClass: deleteClassMutation.mutateAsync,
  };
};

export const useRoster = (classId?: string, centerId?: string) => {
  const queryClient = useQueryClient();

  const rosterQuery = useQuery({
    queryKey: ["roster", classId],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await client.GET(
        "/api/v1/logistics/classes/{id}/students",
        {
          params: { path: { id: classId! } },
        },
      );
      if (error) throw error;
      return data.data as ClassStudent[];
    },
    enabled: !!classId,
  });

  const addStudentMutation = useMutation({
    mutationFn: async (input: AddStudentToClassInput) => {
      const { error } = await client.POST(
        "/api/v1/logistics/classes/{id}/students",
        {
          params: { path: { id: classId! } },
          body: input,
        },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", classId] });
      queryClient.invalidateQueries({ queryKey: ["classes", centerId] });
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      // @ts-ignore
      const { error } = await client.DELETE(
        "/api/v1/logistics/classes/{id}/students/{studentId}",
        {
          params: { path: { id: classId!, studentId } },
        },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", classId] });
      queryClient.invalidateQueries({ queryKey: ["classes", centerId] });
    },
  });

  return {
    roster: rosterQuery.data ?? [],
    isLoading: rosterQuery.isLoading,
    addStudent: addStudentMutation.mutateAsync,
    removeStudent: removeStudentMutation.mutateAsync,
  };
};

export const useSchedules = (classId?: string, centerId?: string) => {
  const queryClient = useQueryClient();

  const schedulesQuery = useQuery({
    queryKey: ["schedules", classId],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/logistics/schedules/", {
        params: { query: { classId } },
      });
      if (error) throw error;
      return data?.data as ClassSchedule[];
    },
    enabled: !!classId,
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (input: CreateClassScheduleInput) => {
      const { data, error } = await client.POST("/api/v1/logistics/schedules/", {
        body: input,
      });
      if (error) throw error;
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", classId] });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateClassScheduleInput;
    }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/logistics/schedules/{id}",
        {
          params: { path: { id } },
          body: input,
        },
      );
      if (error) throw error;
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", classId] });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.DELETE("/api/v1/logistics/schedules/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", classId] });
    },
  });

  return {
    schedules: schedulesQuery.data ?? [],
    isLoading: schedulesQuery.isLoading,
    createSchedule: createScheduleMutation.mutateAsync,
    updateSchedule: updateScheduleMutation.mutateAsync,
    deleteSchedule: deleteScheduleMutation.mutateAsync,
    isCreating: createScheduleMutation.isPending,
    isDeleting: deleteScheduleMutation.isPending,
  };
};
