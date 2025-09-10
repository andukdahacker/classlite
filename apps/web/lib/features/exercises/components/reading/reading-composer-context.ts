"use client";

import { Content } from "@tiptap/react";
import { createContext } from "react";
import {
  ReadingExercise,
  ReadingExerciseType,
  ReadingTask,
} from "../../../../schema/types";

interface ReadingComposerContextProps {
  name: string;
  setName: (value: string) => void;
  description?: string;
  setDescription: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
  content: Content;
  tasks: ReadingExercise["tasks"];
  setContent: (content: Content) => void;
  addTask: (type: ReadingExerciseType) => void;
  removeTask: (index: number) => void;
  editTask<T extends ReadingTask>(index: number, task: T): void;
}

export const ReadingComposerContext =
  createContext<ReadingComposerContextProps>({
    name: "Untitled exercise",
    setName: () => {},
    description: "",
    setDescription: () => {},
    content: "",
    title: "",
    tasks: [],
    setTitle: () => {},
    setContent: () => {},
    addTask: () => {},
    removeTask: () => {},
    editTask: () => {},
  });
