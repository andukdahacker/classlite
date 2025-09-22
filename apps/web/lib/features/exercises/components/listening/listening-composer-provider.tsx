import {
  Exercise,
  ListeningExercise,
  ListeningExerciseTask,
  ListeningExerciseType,
} from "@workspace/types";
import { PropsWithChildren, useState } from "react";
import {
  ListeningComposerContext,
  ListeningComposerState,
} from "./listening-composer-context";

interface ListeningComposerProviderProps {
  exercise?: Exercise;
  listeningExercise?: ListeningExercise;
}

function ListeningComposerProvider({
  children,
  listeningExercise,
  exercise,
}: PropsWithChildren<ListeningComposerProviderProps>) {
  const [tasks, setTasks] = useState<ListeningExercise["tasks"]>(
    listeningExercise?.tasks ?? []
  );

  const [description, setDescription] = useState("");

  const [name, setName] = useState(exercise?.name ?? "");

  const [listeningFile, setListeningFile] = useState<string | null>(
    listeningExercise?.listeningFile ?? null
  );

  const addTask = (type: ListeningExerciseType) => {
    // TODO: Implement this
  };

  const reorderTasks = (sourceIndex: number, destinationIndex: number) => {
    setTasks((tasks) => {
      const newArray = [...tasks];
      const [removed] = newArray.splice(sourceIndex, 1);
      if (removed) {
        newArray.splice(destinationIndex, 0, removed);
      }

      const remappedOrder: typeof newArray = newArray.map((e, i) => {
        return {
          ...e,
          order: i + 1,
        };
      });

      return remappedOrder;
    });
  };

  return (
    <ListeningComposerContext.Provider
      value={{
        name,
        setName,
        description,
        setDescription,
        listeningFile,
        setListeningFile,
        tasks,
        addTask,
        exercise: exercise ?? null,
        reorderTasks,
      }}
    >
      {children}
    </ListeningComposerContext.Provider>
  );
}

export { ListeningComposerProvider };
