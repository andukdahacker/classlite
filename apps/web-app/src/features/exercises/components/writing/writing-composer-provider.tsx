import type {
  Exercise,
  WritingExercise,
  WritingExerciseType,
} from "@workspace/types";
import { type PropsWithChildren, useState } from "react";
import { WritingComposerContext } from "./writing-composer-context";

interface WritingComposerProviderProps {
  exercise?: Exercise;
  writingExercise?: WritingExercise;
}

function WritingComposerProvider({
  children,
  exercise,
  writingExercise,
}: PropsWithChildren<WritingComposerProviderProps>) {
  const [name, setName] = useState(exercise?.name ?? "");
  const [type, setType] = useState<WritingExerciseType>(
    writingExercise?.type ?? "Task 1",
  );
  const [writingFile, setWritingFile] = useState<
    WritingExercise["file"] | null
  >(writingExercise?.file ?? null);
  const [title, setTitle] = useState(writingExercise?.title ?? "");

  return (
    <WritingComposerContext.Provider
      value={{
        name,
        setName,
        exercise,
        type,
        setType,
        writingFile,
        setWritingFile,
        title,
        setTitle,
      }}
    >
      {children}
    </WritingComposerContext.Provider>
  );
}

export { WritingComposerProvider };
