import { ActionIcon, Card, CloseButton, Divider, Group, Tooltip } from "@mantine/core";
import { IconArrowsExchange, IconFlipVertical } from "@tabler/icons-react";
import type { Piece } from "chessops";
import { useCallback, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import { TreeStateContext } from "../common/TreeStateContext";
import FenInput from "../panels/info/FenInput";
import classes from "./EditingCard.module.css";
import PiecesGrid from "./PiecesGrid";

function swapPieceColors(c: string): string {
  if (c >= "A" && c <= "Z") return c.toLowerCase();
  if (c >= "a" && c <= "z") return c.toUpperCase();
  return c;
}

function invertFen(fen: string): string {
  const parts = fen.split(" ");
  const ranks = parts[0].split("/");
  const inverted = ranks
    .reverse()
    .map((rank) => rank.split("").map(swapPieceColors).join(""))
    .join("/");
  const sideToMove = parts[1] === "w" ? "b" : "w";
  return [inverted, sideToMove, "-", "-", "0", "1"].join(" ");
}

function mirrorFen(fen: string): string {
  const parts = fen.split(" ");
  const ranks = parts[0].split("/");
  const mirrored = ranks
    .reverse()
    .map((rank) => rank.split("").map(swapPieceColors).join(""))
    .join("/");
  return [mirrored, parts[1], "-", "-", "0", "1"].join(" ");
}

function EditingCard({
  boardRef,
  setEditingMode,
  selectedPiece,
  setSelectedPiece,
}: {
  boardRef: React.MutableRefObject<HTMLDivElement | null>;
  setEditingMode: (editing: boolean) => void;
  selectedPiece: Piece | null;
  setSelectedPiece: (piece: Piece | null) => void;
}) {
  const { t } = useTranslation();
  const store = useContext(TreeStateContext)!;
  const fen = useStore(store, (s) => s.currentNode().fen);
  const headers = useStore(store, (s) => s.headers);
  const setFen = useStore(store, (s) => s.setFen);

  const handleInvert = useCallback(() => {
    setFen(invertFen(fen));
  }, [fen, setFen]);

  const handleMirror = useCallback(() => {
    setFen(mirrorFen(fen));
  }, [fen, setFen]);

  return (
    <Card
      shadow="md"
      style={{ position: "relative", overflow: "visible" }}
      className={classes.card}
      withBorder
    >
      <CloseButton
        style={{ position: "absolute", top: 10, right: 15 }}
        onClick={() => setEditingMode(false)}
      />
      <FenInput currentFen={fen} />
      <Divider my="md" />
      <Group gap="xs" mb="sm">
        <Tooltip label={t("BoardEditor.SwapColors", { defaultValue: "Swap colors & side to move" })}>
          <ActionIcon variant="default" onClick={handleInvert}>
            <IconArrowsExchange size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t("BoardEditor.MirrorPosition", { defaultValue: "Mirror position (keep side to move)" })}>
          <ActionIcon variant="default" onClick={handleMirror}>
            <IconFlipVertical size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <PiecesGrid
        fen={fen}
        boardRef={boardRef}
        onPut={(newFen) => {
          setFen(newFen);
        }}
        selectedPiece={selectedPiece}
        onSelectPiece={setSelectedPiece}
        orientation={headers.orientation}
      />
    </Card>
  );
}

export default EditingCard;
