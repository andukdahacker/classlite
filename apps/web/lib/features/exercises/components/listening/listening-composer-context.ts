"use client";

import {
  Exercise,
  ListeningExercise,
  ListeningExerciseTask,
  ListeningExerciseType,
} from "@workspace/types";
import { createContext } from "react";

export type ListeningComposerState = {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  listeningFile: string | null;
  setListeningFile: (file: string | null) => void;
  tasks: ListeningExerciseTask[];
  addTask: (type: ListeningExerciseType) => void;
  exercise: Exercise | null;
  reorderTasks: (from: number, to: number) => void;
};

export const ListeningComposerContext = createContext<ListeningComposerState>({
  name: "",
  setName: () => {},
  description: "",
  setDescription: () => {},
  listeningFile: null,
  setListeningFile: () => {},
  tasks: [],
  addTask: () => {},
  exercise: null,
  reorderTasks: () => {},
});