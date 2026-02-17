import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Split context: value changes on hover, setter is stable
const HighlightValueContext = createContext<string | null>(null);
const HighlightSetterContext = createContext<
  (id: string | null, debounce?: boolean) => void
>(() => {});

export function HighlightProvider({ children }: { children: React.ReactNode }) {
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setHighlighted = useCallback(
    (id: string | null, debounce = true) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (debounce) {
        timerRef.current = setTimeout(() => {
          setHighlightedItemId(id);
          timerRef.current = null;
        }, 50);
      } else {
        setHighlightedItemId(id);
      }
    },
    [],
  );

  // Clean up pending debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <HighlightSetterContext.Provider value={setHighlighted}>
      <HighlightValueContext.Provider value={highlightedItemId}>
        {children}
      </HighlightValueContext.Provider>
    </HighlightSetterContext.Provider>
  );
}

export function useHighlightValue(): string | null {
  return useContext(HighlightValueContext);
}

export function useHighlightSetter(): (
  id: string | null,
  debounce?: boolean,
) => void {
  return useContext(HighlightSetterContext);
}

export function useHighlightState() {
  return {
    highlightedItemId: useHighlightValue(),
    setHighlightedItemId: useHighlightSetter(),
  };
}
