import {
  Exercise,
  ListeningCompletionTask,
  ListeningExercise,
  ListeningExerciseTask,
  ListeningExerciseType,
  ListeningMultipleChoiceTask,
  ListeningTFNGTask,
  ListeningYNNGTask,
} from "@workspace/types";
import { PropsWithChildren, useState } from "react";
import { ListeningComposerContext } from "./listening-composer-context";

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
    listeningExercise?.tasks ?? [],
  );

  const [description, setDescription] = useState("");

  const [name, setName] = useState(exercise?.name ?? "");

  const [listeningFile, setListeningFile] = useState<
    ListeningExercise["file"] | null
  >(listeningExercise?.file ?? null);

  const addTask = (type: ListeningExerciseType) => {
    switch (type) {
      case "Multiple choice": {
        const multipleChoiceTask: ListeningMultipleChoiceTask = {
          order: tasks.length + 1,
          type: "Multiple choice",
          instructions: "",
          questions: [],
        };
        setTasks([...tasks, multipleChoiceTask]);
        break;
      }
      case "True/False/Not Given": {
        const task: ListeningTFNGTask = {
          order: tasks.length + 1,
          type: "True/False/Not Given",
          instructions: "",
          questions: [],
        };
        setTasks([...tasks, task]);
        break;
      }
      case "Yes/No/Not Given": {
        const task: ListeningYNNGTask = {
          order: tasks.length + 1,
          instructions: "",
          questions: [],
          type: "Yes/No/Not Given",
        };
        setTasks([...tasks, task]);
        break;
      }
      case "Completion": {
        const task: ListeningCompletionTask = {
          order: tasks.length + 1,
          type: "Completion",
          instructions: "",
          questions: [],
          content: "",
          taskType: "Typing",
        };
        setTasks([...tasks, task]);
        break;
      }
      default: {
        return;
      }
    }
  };

  const removeTask = (index: number) => {
    setTasks((tasks) => {
      const newArray = [...tasks];
      newArray.splice(index, 1);

      const remappedOrder: typeof newArray = newArray.map((e, i) => {
        return {
          ...e,
          order: i + 1,
        };
      });

      return remappedOrder;
    });
  };

  const duplicateTask = (index: number) => {
    setTasks((tasks) => {
      const newArray = [...tasks];
      const taskToDuplicate = newArray[index];
      if (taskToDuplicate) {
        newArray.splice(index + 1, 0, taskToDuplicate);
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

  const reorderTasks = (sourceIndex: number, destinationIndex: number) => {
    setTasks((tasks) => {
      const newArray = [...tasks];
      const [removed] = newArray.splice(sourceIndex, 1);
      if (removed) {
        newArray.splice(destinationIndex, 0, removed);
      }

      const remappedOrder: typeof newArray = newArray.map((e, i) => {
        return { ...e, order: i + 1 };
      });

      return remappedOrder;
    });
  };

  function editTask<T extends ListeningExerciseTask>(index: number, task: T) {
    setTasks((tasks) => {
      const newArray = [...tasks];

      newArray[index] = task;
      const remappedOrder: typeof newArray = newArray.map((e, i) => {
        return {
          ...e,
          order: i + 1,
        };
      });
      return remappedOrder;
    });
  }

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
        removeTask,
        duplicateTask,
        exercise: exercise ?? null,
        reorderTasks,
        editTask,
      }}
    >
      {children}
    </ListeningComposerContext.Provider>
  );
}

export { ListeningComposerProvider };
