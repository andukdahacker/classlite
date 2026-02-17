import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./resizable";
import { useMediaQuery } from "../hooks/use-media-query";

interface WorkbenchLayoutProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  overlay?: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function WorkbenchLayout({
  leftPane,
  rightPane,
  overlay,
  containerRef,
}: WorkbenchLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");

  const direction = isMobile ? "vertical" : "horizontal";
  const defaultLeftSize = isTablet ? 60 : 55;
  const defaultRightSize = isTablet ? 40 : 45;

  return (
    <div ref={containerRef} className="relative min-h-0 flex-1">
      {overlay && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {overlay}
        </div>
      )}
      <ResizablePanelGroup
        direction={direction}
        autoSaveId="grading-workbench"
        className="min-h-0 h-full"
      >
        <ResizablePanel defaultSize={defaultLeftSize} minSize={30}>
          {leftPane}
        </ResizablePanel>
        {!isMobile && <ResizableHandle withHandle />}
        <ResizablePanel defaultSize={defaultRightSize} minSize={25}>
          {rightPane}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
