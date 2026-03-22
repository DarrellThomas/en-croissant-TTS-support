import {
  ActionIcon,
  Collapse,
  Divider,
  Group,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { IconChevronDown, IconClock } from "@tabler/icons-react";
import { atom, useAtom } from "jotai";
import { memo, useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { TreeStateContext } from "@/components/common/TreeStateContext";
import { ANNOTATION_INFO, type Annotation, isBasicAnnotation } from "@/utils/annotation";
import { getNodeAtPath } from "@/utils/treeReducer";
import AnnotationEditor from "./AnnotationEditor";

const SymbolButton = memo(function SymbolButton({
  curAnnotations,
  annotation,
}: {
  curAnnotations: Annotation[];
  annotation: Annotation;
}) {
  const { t } = useTranslation();

  const store = useContext(TreeStateContext)!;
  const setAnnotation = useStore(store, (s) => s.setAnnotation);
  const { translationKey, name, color } = ANNOTATION_INFO[annotation];
  const isActive = curAnnotations.includes(annotation);
  const theme = useMantineTheme();
  return (
    <Tooltip label={translationKey ? t(`Annotate.${translationKey}`) : name} position="bottom">
      <ActionIcon
        onClick={() => setAnnotation(annotation)}
        variant={isActive ? "filled" : "default"}
        color={isBasicAnnotation(annotation) ? color : theme.primaryColor}
      >
        <Text>{annotation}</Text>
      </ActionIcon>
    </Tooltip>
  );
});

function formatClockValue(seconds: number | undefined): string {
  if (seconds === undefined) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function parseClockValue(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return undefined;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return undefined;
}

function ClockEditor() {
  const { t } = useTranslation();
  const store = useContext(TreeStateContext)!;
  const root = useStore(store, (s) => s.root);
  const position = useStore(store, (s) => s.position);
  const setClock = useStore(store, (s) => s.setClock);
  const currentNode = getNodeAtPath(root, position);
  const isRoot = position.length === 0;

  const [inputValue, setInputValue] = useState(() => formatClockValue(currentNode.clock));

  useEffect(() => {
    setInputValue(formatClockValue(currentNode.clock));
  }, [currentNode.clock, position]);

  const handleBlur = useCallback(() => {
    const parsed = parseClockValue(inputValue);
    setClock(parsed);
    setInputValue(formatClockValue(parsed));
  }, [inputValue, setClock]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleBlur();
      }
    },
    [handleBlur],
  );

  if (isRoot) return null;

  return (
    <TextInput
      size="xs"
      leftSection={<IconClock size={14} />}
      placeholder={t("Annotate.ClockPlaceholder", { defaultValue: "h:mm:ss" })}
      value={inputValue}
      onChange={(e) => setInputValue(e.currentTarget.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}

const showMoreSymbolsAtom = atom(false);

const BASIC = ["!!", "!", "!?", "?!", "?", "??"] as const;
const ADVANTAGE = ["+-", "±", "⩲", "=", "∞", "⩱", "∓", "-+"] as const;
const EXTRA = ["N", "↑↑", "↑", "→", "⇆", "=∞", "⊕", "∆", "□", "⨀", "⊗"] as const;

function AnnotationPanel() {
  const store = useContext(TreeStateContext)!;
  const root = useStore(store, (s) => s.root);
  const position = useStore(store, (s) => s.position);
  const currentNode = getNodeAtPath(root, position);
  const [showMoreSymbols, setShowMoreSymbols] = useAtom(showMoreSymbolsAtom);

  return (
    <Stack h="100%" gap={0} py="sm">
      <Stack gap={0}>
        <Group grow px="sm">
          {BASIC.map((annotation) => {
            return (
              <SymbolButton
                key={annotation}
                curAnnotations={currentNode.annotations}
                annotation={annotation}
              />
            );
          })}
        </Group>
        <Divider
          label={
            <ActionIcon
              mx="auto"
              onClick={() => setShowMoreSymbols(!showMoreSymbols)}
              color="dimmed"
              style={{
                transition: "transform 0.2s",
                transform: showMoreSymbols ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <IconChevronDown size="1rem" />
            </ActionIcon>
          }
        />
      </Stack>

      <Collapse in={showMoreSymbols} px="sm">
        <Stack mb="md">
          <Group grow>
            {ADVANTAGE.map((annotation) => (
              <SymbolButton
                key={annotation}
                curAnnotations={currentNode.annotations}
                annotation={annotation}
              />
            ))}
          </Group>
          <Group grow>
            {EXTRA.map((annotation) => (
              <SymbolButton
                key={annotation}
                curAnnotations={currentNode.annotations}
                annotation={annotation}
              />
            ))}
          </Group>
        </Stack>
      </Collapse>

      <Group px="sm" mb="xs">
        <ClockEditor />
      </Group>

      <ScrollArea offsetScrollbars pl="sm">
        <AnnotationEditor />
      </ScrollArea>
    </Stack>
  );
}

export default AnnotationPanel;
