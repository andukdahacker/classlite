"use client";

import type { Content } from "@tiptap/react";
import type { Exercise, WritingExercise } from "@workspace/types";
import { createContext } from "react";

import type { WritingExerciseType } from "@workspace/types";

interface WritingComposerContextProps {
  name: string;
  setName: (value: string) => void;
  exercise?: Exercise;
  type: WritingExerciseType;
  setType: (type: WritingExerciseType) => void;
  writingFile: WritingExercise["file"] | null;
  setWritingFile: (file: WritingExercise["file"] | null) => void;
  title: Content;
  setTitle: (title: Content) => void;
}

export const WritingComposerContext =
  createContext<WritingComposerContextProps>({
    name: "Untitled exercise",
    setName: () => {},
    exercise: undefined,
    type: "Task 1",
    setType: () => {},
    writingFile: null,
    setWritingFile: () => {},
    title: "",
    setTitle: () => {},
  });
