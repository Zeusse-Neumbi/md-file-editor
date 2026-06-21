import { Group, Panel, Separator } from "react-resizable-panels";
import type { ReactNode } from "react";

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftSize?: number;
  minLeftSize?: number;
  minRightSize?: number;
}

export function SplitPane({
  left,
  right,
  defaultLeftSize = 50,
  minLeftSize = 20,
  minRightSize = 20,
}: SplitPaneProps) {
  return (
    <Group orientation="horizontal" className="flex-1 overflow-hidden">
      <Panel defaultSize={defaultLeftSize} minSize={minLeftSize}>
        {left}
      </Panel>
      <Separator className="w-[4px] bg-border hover:bg-accent cursor-col-resize transition-colors" />
      <Panel defaultSize={100 - defaultLeftSize} minSize={minRightSize}>
        {right}
      </Panel>
    </Group>
  );
}
