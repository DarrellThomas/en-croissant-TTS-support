import { Group, NumberInput, SegmentedControl } from "@mantine/core";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { match } from "ts-pattern";
import type { GoMode } from "@/bindings";
import TimeInput from "./TimeInput";

function GoModeInput({
  goMode,
  setGoMode,
  gameMode,
}: {
  goMode: GoMode | null;
  setGoMode: (v: GoMode) => void;
  gameMode?: boolean;
}) {
  const { t } = useTranslation();

  const prevValues = useRef<Record<string, number>>({
    Time: 8000,
    Depth: 20,
    Nodes: 1000000,
  });

  // Keep ref in sync with current value
  if (goMode && "c" in goMode && typeof goMode.c === "number") {
    prevValues.current[goMode.t] = goMode.c;
  }

  const timeTypes = ["Time", "Depth", "Nodes"];
  if (!gameMode) {
    timeTypes.push("Infinite");
  }

  return (
    <Group>
      <SegmentedControl
        data={timeTypes.map((v) => ({ value: v, label: t(`GoMode.${v}`) }))}
        value={goMode?.t || (gameMode ? "Time" : "Infinite")}
        onChange={(v) => {
          const newGo = match<string | null, GoMode>(v)
            .with("Depth", () => ({
              t: "Depth",
              c: prevValues.current.Depth,
            }))
            .with("Nodes", () => ({
              t: "Nodes",
              c: prevValues.current.Nodes,
            }))
            .with("Time", () => ({
              t: "Time",
              c: prevValues.current.Time,
            }))
            .otherwise(() => ({ t: "Infinite" }));

          setGoMode(newGo);
        }}
      />
      {match(goMode || { t: "Infinite" })
        .with({ t: "Depth" }, (v) => (
          <NumberInput
            min={1}
            value={v.c}
            onChange={(v) =>
              setGoMode({ t: "Depth", c: typeof v === "number" ? v : 1 })
            }
          />
        ))
        .with({ t: "Nodes" }, (v) => (
          <NumberInput
            min={1}
            value={v.c}
            onChange={(v) =>
              setGoMode({ t: "Nodes", c: typeof v === "number" ? v : 1 })
            }
          />
        ))
        .with({ t: "Time" }, (v) => (
          <TimeInput value={v.c} setValue={setGoMode} />
        ))
        .otherwise(() => null)}
    </Group>
  );
}

export default GoModeInput;
