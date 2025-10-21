import { Content } from "@tiptap/react";
import {
  Exercise,
  WritingExercise,
  WritingExerciseType,
} from "@workspace/types";
import { PropsWithChildren, useState } from "react";
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
  const [description, setDescription] = useState("");
  const [content, setContent] = useState<Content>(writingExercise?.title ?? "");
  const [type, setType] = useState<WritingExerciseType>(
    writingExercise?.type ?? "Task 1",
  );
  const [writingFile, setWritingFile] = useState<
    WritingExercise["file"] | null
  >(writingExercise?.file ?? null);
  const [title, setTitle] = useState(writingExercise?.title ?? "");
  const [duration, setDuration] = useState<number | null>(
    writingExercise?.duration ?? null,
  );

  return (
    <WritingComposerContext.Provider
      value={{
        name,
        setName,
        description,
        setDescription,
        content,
        setContent,
        exercise,
        type,
        setType,
        writingFile,
        setWritingFile,
        title,
        setTitle,
        duration,
        setDuration,
      }}
    >
      {children}
    </WritingComposerContext.Provider>
  );
}

export { WritingComposerProvider };
