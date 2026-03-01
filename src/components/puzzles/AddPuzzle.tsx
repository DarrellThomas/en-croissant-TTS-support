import {
  Alert,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { resolve } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { copyFile } from "@tauri-apps/plugin-fs";
import { type Dispatch, type SetStateAction, useState } from "react";
import { useTranslation } from "react-i18next";
import useSWRImmutable from "swr/immutable";
import { commands, type PuzzleDatabaseInfo } from "@/bindings";
import { getDefaultPuzzleDatabases } from "@/utils/db";
import { getPuzzlesDir } from "@/utils/directories";
import { formatBytes, formatNumber } from "@/utils/format";
import { getPuzzleDatabases } from "@/utils/puzzles";
import FileInput from "../common/FileInput";
import ProgressButton from "../common/ProgressButton";

function AddPuzzle({
  puzzleDbs,
  opened,
  setOpened,
  setPuzzleDbs,
}: {
  puzzleDbs: PuzzleDatabaseInfo[];
  opened: boolean;
  setOpened: (opened: boolean) => void;
  setPuzzleDbs: Dispatch<SetStateAction<PuzzleDatabaseInfo[]>>;
}) {
  const { t } = useTranslation();
  const { data: dbs, error } = useSWRImmutable(
    "default_puzzle_databases",
    getDefaultPuzzleDatabases,
  );

  const [localFile, setLocalFile] = useState<string | null>(null);
  const [localFilename, setLocalFilename] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function importLocal() {
    if (!localFile || !localFilename) return;
    setLocalError(null);
    try {
      const puzzlesDir = await getPuzzlesDir();
      const dest = await resolve(puzzlesDir, localFilename);
      await copyFile(localFile, dest);
      setPuzzleDbs(await getPuzzleDatabases());
      setOpened(false);
      setLocalFile(null);
      setLocalFilename(null);
    } catch (e) {
      setLocalError(String(e));
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title={t("Databases.Add.Title")}
    >
      <Tabs defaultValue="web">
        <Tabs.List>
          <Tabs.Tab value="web">{t("Databases.Add.Web")}</Tabs.Tab>
          <Tabs.Tab value="local">{t("Common.Local")}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="web" pt="xs">
          <ScrollArea.Autosize mah={500} offsetScrollbars>
            <Stack>
              {dbs?.map((db, i) => (
                <PuzzleDbCard
                  puzzleDb={db}
                  databaseId={i}
                  key={i}
                  setPuzzleDbs={setPuzzleDbs}
                  initInstalled={puzzleDbs.some(
                    (e) => e.title.replace(".db3", "") === db.title,
                  )}
                />
              ))}
              {error && (
                <Alert
                  icon={<IconAlertCircle size="1rem" />}
                  title={t("Common.Error")}
                  color="red"
                >
                  {t("Databases.Add.ErrorFetch")}
                </Alert>
              )}
            </Stack>
          </ScrollArea.Autosize>
        </Tabs.Panel>
        <Tabs.Panel value="local" pt="xs">
          <Stack>
            <FileInput
              label={t("Puzzle.Database")}
              description="Click to select a .db3 puzzle database file"
              onClick={async () => {
                const selected = await open({
                  multiple: false,
                  filters: [
                    {
                      name: "Puzzle database",
                      extensions: ["db3"],
                    },
                  ],
                });
                if (!selected || typeof selected === "object") return;
                setLocalFile(selected);
                const filename = selected.split(/(\\|\/)/g).pop() ?? null;
                setLocalFilename(filename);
              }}
              filename={localFilename}
            />
            {localError && (
              <Alert color="red" icon={<IconAlertCircle size="1rem" />}>
                {localError}
              </Alert>
            )}
            <Button fullWidth disabled={!localFile} onClick={importLocal}>
              {t("Common.Install")}
            </Button>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}

function PuzzleDbCard({
  setPuzzleDbs,
  puzzleDb,
  databaseId,
  initInstalled,
}: {
  setPuzzleDbs: Dispatch<SetStateAction<PuzzleDatabaseInfo[]>>;
  puzzleDb: PuzzleDatabaseInfo & { downloadLink: string };
  databaseId: number;
  initInstalled: boolean;
}) {
  const { t } = useTranslation();
  const [inProgress, setInProgress] = useState<boolean>(false);

  async function downloadDatabase(id: number, url: string, name: string) {
    setInProgress(true);
    const puzzlesDir = await getPuzzlesDir();
    const path = await resolve(puzzlesDir, `${name}.db3`);
    await commands.downloadFile(`puzzle_db_${id}`, url, path, null, null, null);
    setPuzzleDbs(await getPuzzleDatabases());
  }

  return (
    <Paper withBorder radius="md" p={0} key={puzzleDb.title}>
      <Group wrap="nowrap" gap={0} grow>
        <Box p="md" flex={1}>
          <Text tt="uppercase" c="dimmed" fw={700} size="xs">
            {t("Puzzle.Database")}
          </Text>
          <Text fw="bold" mb="xs">
            {puzzleDb.title}
          </Text>

          <Text size="xs" c="dimmed">
            {puzzleDb.description}
          </Text>
          <Divider />
          <Group wrap="nowrap" grow my="md">
            <Stack gap={0} align="center">
              <Text tt="uppercase" c="dimmed" fw={700} size="xs">
                {t("Common.Size")}
              </Text>
              <Text size="xs">{formatBytes(puzzleDb.storageSize)}</Text>
            </Stack>
            <Stack gap={0} align="center">
              <Text tt="uppercase" c="dimmed" fw={700} size="xs">
                {t("Puzzle.Puzzles")}
              </Text>
              <Text size="xs">{formatNumber(puzzleDb.puzzleCount)}</Text>
            </Stack>
          </Group>
          <ProgressButton
            id={`puzzle_db_${databaseId}`}
            initInstalled={initInstalled}
            labels={{
              completed: t("Common.Installed"),
              action: t("Common.Install"),
              inProgress: t("Common.Downloading"),
              finalizing: t("Common.Extracting"),
            }}
            onClick={() => {
              if (!puzzleDb.downloadLink) return;
              downloadDatabase(
                databaseId,
                puzzleDb.downloadLink,
                puzzleDb.title,
              );
            }}
            inProgress={inProgress}
            setInProgress={setInProgress}
          />
        </Box>
      </Group>
    </Paper>
  );
}

export default AddPuzzle;
