import { ActionIcon, Group } from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { memo, useCallback, useContext } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useStore } from "zustand";
import { practiceStateAtom } from "@/state/atoms";
import { keyMapAtom } from "@/state/keybinds";
import { TreeStateContext } from "./TreeStateContext";

function MoveControls({ readOnly }: { readOnly?: boolean }) {
  const store = useContext(TreeStateContext)!;
  const next = useStore(store, (s) => s.goToNext);
  const previous = useStore(store, (s) => s.goToPrevious);
  const start = useStore(store, (s) => s.goToStart);
  const end = useStore(store, (s) => s.goToEnd);
  const deleteMove = useStore(store, (s) => s.deleteMove);
  const startBranch = useStore(store, (s) => s.goToBranchStart);
  const endBranch = useStore(store, (s) => s.goToBranchEnd);
  const nextBranch = useStore(store, (s) => s.nextBranch);
  const previousBranch = useStore(store, (s) => s.previousBranch);
  const nextBranching = useStore(store, (s) => s.nextBranching);
  const previousBranching = useStore(store, (s) => s.previousBranching);

  const practiceState = useAtomValue(practiceStateAtom);
  const blocked = practiceState.phase === "waiting";

  const guard = useCallback(
    (fn: () => void) => () => {
      if (!blocked) fn();
    },
    [blocked],
  );

  const keyMap = useAtomValue(keyMapAtom);
  useHotkeys(keyMap.PREVIOUS_MOVE.keys, guard(previous));
  useHotkeys(keyMap.NEXT_MOVE.keys, guard(next));
  useHotkeys(keyMap.GO_TO_START.keys, guard(start));
  useHotkeys(keyMap.GO_TO_END.keys, guard(end));
  useHotkeys(
    keyMap.DELETE_MOVE.keys,
    readOnly ? () => {} : guard(() => deleteMove()),
  );
  useHotkeys(keyMap.GO_TO_BRANCH_START.keys, guard(startBranch));
  useHotkeys(keyMap.GO_TO_BRANCH_END.keys, guard(endBranch));
  useHotkeys(keyMap.NEXT_BRANCH.keys, guard(nextBranch));
  useHotkeys(keyMap.PREVIOUS_BRANCH.keys, guard(previousBranch));
  useHotkeys(keyMap.NEXT_BRANCHING.keys, guard(nextBranching));
  useHotkeys(keyMap.PREVIOUS_BRANCHING.keys, guard(previousBranching));

  return (
    <Group grow gap="xs">
      <ActionIcon
        variant="default"
        size="lg"
        onClick={guard(start)}
        disabled={blocked}
      >
        <IconChevronsLeft />
      </ActionIcon>
      <ActionIcon
        variant="default"
        size="lg"
        onClick={guard(previous)}
        disabled={blocked}
      >
        <IconChevronLeft />
      </ActionIcon>
      <ActionIcon
        variant="default"
        size="lg"
        onClick={guard(next)}
        disabled={blocked}
      >
        <IconChevronRight />
      </ActionIcon>
      <ActionIcon
        variant="default"
        size="lg"
        onClick={guard(end)}
        disabled={blocked}
      >
        <IconChevronsRight />
      </ActionIcon>
    </Group>
  );
}

export default memo(MoveControls);
