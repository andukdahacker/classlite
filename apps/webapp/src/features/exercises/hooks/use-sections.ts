import client from "@/core/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  QuestionSection,
  Question,
  Exercise,
  CreateQuestionSectionInput,
  UpdateQuestionSectionInput,
  CreateQuestionInput,
  UpdateQuestionInput,
} from "@workspace/types";
import { exercisesKeys } from "./use-exercises";

export const useSections = (exerciseId?: string) => {
  const queryClient = useQueryClient();

  const invalidateExercise = () => {
    if (exerciseId) {
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.detail(exerciseId),
      });
    }
  };

  const createSectionMutation = useMutation({
    mutationFn: async (input: CreateQuestionSectionInput) => {
      const { data, error } = await client.POST(
        "/api/v1/exercises/{exerciseId}/sections",
        {
          params: { path: { exerciseId: exerciseId! } },
          body: input,
        },
      );
      if (error) throw error;
      return data?.data as QuestionSection;
    },
    onSuccess: invalidateExercise,
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({
      sectionId,
      input,
    }: {
      sectionId: string;
      input: UpdateQuestionSectionInput;
    }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/exercises/{exerciseId}/sections/{sectionId}",
        {
          params: {
            path: { exerciseId: exerciseId!, sectionId },
          },
          body: input,
        },
      );
      if (error) throw error;
      return data?.data as QuestionSection;
    },
    onSuccess: invalidateExercise,
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await client.DELETE(
        "/api/v1/exercises/{exerciseId}/sections/{sectionId}",
        {
          params: {
            path: { exerciseId: exerciseId!, sectionId },
          },
        },
      );
      if (error) throw error;
    },
    onSuccess: invalidateExercise,
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (sectionIds: string[]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reorder endpoint not yet in generated API types
      const { data, error } = await (client as any).PATCH(
        `/api/v1/exercises/${exerciseId}/sections/reorder`,
        { body: { sectionIds } },
      );
      if (error) throw error;
      return data?.data as QuestionSection[];
    },
    onMutate: async (sectionIds: string[]) => {
      await queryClient.cancelQueries({
        queryKey: exercisesKeys.detail(exerciseId!),
      });

      const previous = queryClient.getQueryData<Exercise>(
        exercisesKeys.detail(exerciseId!),
      );

      if (previous?.sections) {
        const sectionMap = new Map(
          previous.sections.map((s) => [s.id, s]),
        );
        const reordered = sectionIds
          .map((id) => sectionMap.get(id))
          .filter(Boolean) as QuestionSection[];

        queryClient.setQueryData<Exercise>(
          exercisesKeys.detail(exerciseId!),
          { ...previous, sections: reordered },
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          exercisesKeys.detail(exerciseId!),
          context.previous,
        );
      }
    },
    onSettled: () => {
      invalidateExercise();
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async ({
      sectionId,
      input,
    }: {
      sectionId: string;
      input: CreateQuestionInput;
    }) => {
      const { data, error } = await client.POST(
        "/api/v1/exercises/{exerciseId}/sections/{sectionId}/questions",
        {
          params: {
            path: { exerciseId: exerciseId!, sectionId },
          },
          body: input,
        },
      );
      if (error) throw error;
      return data?.data as Question;
    },
    onSuccess: invalidateExercise,
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({
      sectionId,
      questionId,
      input,
    }: {
      sectionId: string;
      questionId: string;
      input: UpdateQuestionInput;
    }) => {
      const { data, error } = await client.PATCH(
        "/api/v1/exercises/{exerciseId}/sections/{sectionId}/questions/{questionId}",
        {
          params: {
            path: { exerciseId: exerciseId!, sectionId, questionId },
          },
          body: input,
        },
      );
      if (error) throw error;
      return data?.data as Question;
    },
    onSuccess: invalidateExercise,
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async ({
      sectionId,
      questionId,
    }: {
      sectionId: string;
      questionId: string;
    }) => {
      const { error } = await client.DELETE(
        "/api/v1/exercises/{exerciseId}/sections/{sectionId}/questions/{questionId}",
        {
          params: {
            path: { exerciseId: exerciseId!, sectionId, questionId },
          },
        },
      );
      if (error) throw error;
    },
    onSuccess: invalidateExercise,
  });

  return {
    createSection: createSectionMutation.mutateAsync,
    isCreatingSection: createSectionMutation.isPending,
    updateSection: updateSectionMutation.mutateAsync,
    isUpdatingSection: updateSectionMutation.isPending,
    deleteSection: deleteSectionMutation.mutateAsync,
    isDeletingSection: deleteSectionMutation.isPending,
    reorderSections: reorderSectionsMutation.mutateAsync,
    isReorderingSections: reorderSectionsMutation.isPending,
    createQuestion: createQuestionMutation.mutateAsync,
    isCreatingQuestion: createQuestionMutation.isPending,
    updateQuestion: updateQuestionMutation.mutateAsync,
    isUpdatingQuestion: updateQuestionMutation.isPending,
    deleteQuestion: deleteQuestionMutation.mutateAsync,
    isDeletingQuestion: deleteQuestionMutation.isPending,
  };
};
