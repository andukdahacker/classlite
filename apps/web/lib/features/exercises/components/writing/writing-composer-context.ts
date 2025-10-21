"use client";

import { Content } from "@tiptap/react";
import { Exercise, WritingExercise } from "@workspace/types";
import { createContext } from "react";

import { WritingExerciseType } from "@workspace/types";

interface WritingComposerContextProps {
  name: string;
  setName: (value: string) => void;
  description?: string;
  setDescription: (value: string) => void;
  content: Content;
  setContent: (content: Content) => void;
  exercise?: Exercise;
  type: WritingExerciseType;
  setType: (type: WritingExerciseType) => void;
  writingFile: WritingExercise["file"] | null;
  setWritingFile: (file: WritingExercise["file"] | null) => void;
  title: string;
  setTitle: (title: string) => void;
  duration: number | null;
  setDuration: (duration: number | null) => void;
}

export const WritingComposerContext =
  createContext<WritingComposerContextProps>({
    name: "Untitled exercise",
    setName: () => {},
    description: "",
    setDescription: () => {},
    content: "",
    setContent: () => {},
    exercise: undefined,
    type: "Task 1",
    setType: () => {},
    writingFile: null,
    setWritingFile: () => {},
    title: "",
    setTitle: () => {},
    duration: null,
    setDuration: () => {},
  });
