import { useEffect, useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./resizable";

interface WorkbenchLayoutProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function WorkbenchLayout({ leftPane, rightPane }: WorkbenchLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");

  const direction = isMobile ? "vertical" : "horizontal";
  const defaultLeftSize = isTablet ? 60 : 55;
  const defaultRightSize = isTablet ? 40 : 45;

  return (
    <ResizablePanelGroup
      direction={direction}
      autoSaveId="grading-workbench"
      className="min-h-0 flex-1"
    >
      <ResizablePanel defaultSize={defaultLeftSize} minSize={30}>
        {leftPane}
      </ResizablePanel>
      {!isMobile && <ResizableHandle withHandle />}
      <ResizablePanel defaultSize={defaultRightSize} minSize={25}>
        {rightPane}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
