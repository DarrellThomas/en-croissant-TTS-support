import {
  ActionIcon,
  Box,
  Center,
  Collapse,
  Flex,
  Group,
  InputWrapper,
  RangeSlider,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useHotkeys } from "@mantine/hooks";
import { IconDotsVertical } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useAtom, useSetAtom } from "jotai";
import { DataTable } from "mantine-datatable";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { useStore } from "zustand";
import type { GameQuery, GameSort, NormalizedGame, Outcome } from "@/bindings";
import { activeTabAtom, tabsAtom } from "@/state/atoms";
import { query_games } from "@/utils/db";
import { createTab } from "@/utils/tabs";
import { DatabaseViewStateContext } from "./DatabaseViewStateContext";
import GameCard from "./GameCard";
import GridLayout from "./GridLayout";
import { PlayerSearchInput } from "./PlayerSearchInput";
import { SideInput } from "./SideInput";
import classes from "./styles.module.css";

const FULL_ELO_RANGE: [number, number] = [0, 3000];

function toStoredEloRange(range: [number, number]): [number, number] | undefined {
  return range[0] === FULL_ELO_RANGE[0] && range[1] === FULL_ELO_RANGE[1] ? undefined : range;
}

function getQuickEloRange(query: GameQuery): [number, number] {
  if (
    query.sides === "Any" &&
    query.player1 === undefined &&
    query.player2 === undefined &&
    query.range2 === undefined
  ) {
    return query.range1 ?? FULL_ELO_RANGE;
  }
  return FULL_ELO_RANGE;
}

function shouldDeferEloCount(query: GameQuery): boolean {
  return (
    query.sides === "Any" &&
    query.player1 === undefined &&
    query.player2 === undefined &&
    query.tournament_id === undefined &&
    query.outcome === undefined &&
    query.start_date === undefined &&
    query.end_date === undefined &&
    query.range1 !== undefined &&
    query.range2 === undefined
  );
}

function GameTable() {
  const { t } = useTranslation();
  const store = useContext(DatabaseViewStateContext)!;

  const file = useStore(store, (s) => s.database?.file)!;
  const query = useStore(store, (s) => s.games.query);
  const setQuery = useStore(store, (s) => s.setGamesQuery);
  const openedSettings = useStore(store, (s) => s.games.isFilterExpanded);
  const toggleOpenedSettings = useStore(store, (s) => s.toggleGamesOpenedSettings);

  const selectedGame = useStore(store, (s) => s.games.selectedGame);
  const setSelectedGame = useStore(store, (s) => s.setGamesSelectedGame);

  const navigate = useNavigate();

  const [, setTabs] = useAtom(tabsAtom);
  const setActiveTab = useSetAtom(activeTabAtom);
  const deferCount = shouldDeferEloCount(query);
  const gamesQuery: GameQuery = deferCount
    ? {
        ...query,
        options: {
          ...query.options!,
          skipCount: true,
        },
      }
    : query;

  const { data, error, isLoading, mutate } = useSWR(["games", file, gamesQuery], () =>
    query_games(file, gamesQuery),
  );
  const { data: countData, isLoading: isCountLoading } = useSWR(
    deferCount && data !== undefined
      ? ["games-count", file, query]
      : null,
    () =>
      query_games(file, {
        ...query,
        options: {
          ...query.options!,
          page: 1,
          pageSize: 0,
          skipCount: false,
        },
      }),
  );

  const games = data?.data ?? [];
  const count = deferCount ? countData?.count : data?.count;
  const quickEloRange = getQuickEloRange(query);

  const applyFilterQuery = (patch: Partial<GameQuery>) => {
    setSelectedGame(undefined);
    setQuery({
      ...query,
      ...patch,
      options: {
        ...query.options!,
        ...patch.options,
        page: 1,
      },
    });
  };

  useHotkeys([
    [
      "ArrowUp",
      () => {
        setSelectedGame(
          selectedGame === undefined || selectedGame === null
            ? undefined
            : selectedGame === 0
              ? 0
              : selectedGame - 1,
        );
      },
    ],
    [
      "ArrowDown",
      () => {
        setSelectedGame(
          selectedGame === undefined || selectedGame === null
            ? 0
            : selectedGame === games.length - 1
              ? games.length - 1
              : selectedGame + 1,
        );
      },
    ],
  ]);

  return (
    <GridLayout
      search={
        <Flex style={{ gap: 20 }}>
          <Box style={{ flexGrow: 1 }}>
            <Stack gap="sm">
              <InputWrapper label="Quick ELO Search">
                <RangeSlider
                  step={10}
                  min={0}
                  max={3000}
                  marks={[
                    { value: 1000, label: "1000" },
                    { value: 2000, label: "2000" },
                    { value: 3000, label: "3000" },
                  ]}
                  value={quickEloRange}
                  onChangeEnd={(value) =>
                    applyFilterQuery({
                      sides: "Any",
                      range1: toStoredEloRange(value),
                      range2: undefined,
                    })
                  }
                />
                <Text size="xs" c="dimmed" mt={6}>
                  Matches games where either player&apos;s ELO falls inside the selected window.
                </Text>
              </InputWrapper>
              <Group grow>
                <PlayerSearchInput
                  value={query?.player1 ?? undefined}
                  setValue={(value) => applyFilterQuery({ player1: value })}
                  rightSection={
                    <SideInput
                      sides={query.sides!}
                      setSides={(value) => applyFilterQuery({ sides: value })}
                      label="Player"
                    />
                  }
                  label="Player"
                  file={file}
                />
                <PlayerSearchInput
                  value={query?.player2 ?? undefined}
                  setValue={(value) => applyFilterQuery({ player2: value })}
                  rightSection={
                    <SideInput
                      sides={query.sides!}
                      setSides={(value) => applyFilterQuery({ sides: value })}
                      label="Opponent"
                    />
                  }
                  label="Opponent"
                  file={file}
                />
              </Group>
            </Stack>
            <Collapse in={openedSettings} mx={10}>
              <Stack mt="md">
                <Group grow>
                  <InputWrapper label="ELO">
                    <RangeSlider
                      step={10}
                      min={0}
                      max={3000}
                      marks={[
                        { value: 1000, label: "1000" },
                        { value: 2000, label: "2000" },
                        { value: 3000, label: "3000" },
                      ]}
                      value={query.range1 ?? FULL_ELO_RANGE}
                      onChangeEnd={(value) =>
                        applyFilterQuery({ range1: toStoredEloRange(value) })
                      }
                    />
                  </InputWrapper>

                  <InputWrapper label="ELO">
                    <RangeSlider
                      step={10}
                      min={0}
                      max={3000}
                      marks={[
                        { value: 1000, label: "1000" },
                        { value: 2000, label: "2000" },
                        { value: 3000, label: "3000" },
                      ]}
                      value={query.range2 ?? FULL_ELO_RANGE}
                      onChangeEnd={(value) =>
                        applyFilterQuery({ range2: toStoredEloRange(value) })
                      }
                    />
                  </InputWrapper>
                </Group>
                <Select
                  label="Result"
                  value={query.outcome}
                  onChange={(value) =>
                    applyFilterQuery({
                      ...query,
                      outcome: (value as Outcome | null) ?? undefined,
                    })
                  }
                  clearable
                  placeholder="Select result"
                  data={[
                    { label: "White wins", value: "1-0" },
                    { label: "Black wins", value: "0-1" },
                    { label: "Draw", value: "1/2-1/2" },
                  ]}
                />
                <Group>
                  <DateInput
                    label="From"
                    placeholder="Start date"
                    clearable
                    valueFormat="YYYY-MM-DD"
                    value={query.start_date ? dayjs(query.start_date, "YYYY.MM.DD").toDate() : null}
                    onChange={(value) =>
                      applyFilterQuery({
                        ...query,
                        start_date: value ? dayjs(value).format("YYYY.MM.DD") : undefined,
                      })
                    }
                  />
                  <DateInput
                    label="To"
                    placeholder="End date"
                    clearable
                    valueFormat="YYYY-MM-DD"
                    value={query.end_date ? dayjs(query.end_date, "YYYY.MM.DD").toDate() : null}
                    onChange={(value) =>
                      applyFilterQuery({
                        ...query,
                        end_date: value ? dayjs(value).format("YYYY.MM.DD") : undefined,
                      })
                    }
                  />
                </Group>
              </Stack>
            </Collapse>
          </Box>
          <ActionIcon style={{ flexGrow: 0 }} onClick={() => toggleOpenedSettings()}>
            <IconDotsVertical size="1rem" />
          </ActionIcon>
        </Flex>
      }
      table={
        <DataTable<NormalizedGame>
          withTableBorder
          highlightOnHover
          records={games}
          fetching={isLoading}
          onRowDoubleClick={({ record }) => {
            createTab({
              tab: {
                name: `${record.white} - ${record.black}`,
                type: "analysis",
              },
              setTabs,
              setActiveTab,
              pgn: record.moves,
              headers: record,
            });
            navigate({ to: "/" });
          }}
          columns={[
            {
              accessor: "white",
              render: ({ white, white_elo }) => (
                <div>
                  <Text size="sm" fw={500}>
                    {white}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {white_elo === 0 ? "Unrated" : white_elo}
                  </Text>
                </div>
              ),
            },
            {
              accessor: "black",
              render: ({ black, black_elo }) => (
                <div>
                  <Text size="sm" fw={500}>
                    {black}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {black_elo === 0 ? "Unrated" : black_elo}
                  </Text>
                </div>
              ),
            },
            { accessor: "date", sortable: true },
            {
              accessor: "result",
              render: ({ result }) => result?.replaceAll("1/2", "½"),
            },
            { accessor: "ply_count", title: "Plies", sortable: true },
            { accessor: "event" },
            { accessor: "site" },
          ]}
          rowClassName={(_, i) => (i === selectedGame ? classes.selected : "")}
          noRecordsText={
            error
              ? `${t("Common.Error")}: ${error instanceof Error ? error.message : String(error)}`
              : "No games found"
          }
          totalRecords={count ?? undefined}
          recordsPerPage={query.options?.pageSize ?? 25}
          page={query.options?.page ?? 1}
          renderPagination={
            deferCount && count === undefined
              ? ({ state, Controls }) => (
                  <Group justify="space-between" wrap="wrap" w="100%">
                    <Text size="sm" c="dimmed">
                      {isCountLoading
                        ? `Showing ${state.recordsLength ?? 0} results on this page. Counting total...`
                        : `Showing ${state.recordsLength ?? 0} results on this page.`}
                    </Text>
                    <Controls.PageSizeSelector />
                  </Group>
                )
              : undefined
          }
          onPageChange={(page) =>
            setQuery({
              ...query,
              options: {
                ...query.options!,
                page,
              },
            })
          }
          onRecordsPerPageChange={(value) =>
            applyFilterQuery({
              ...query,
              options: { ...query.options!, pageSize: value },
            })
          }
          sortStatus={{
            columnAccessor: query.options?.sort || "date",
            direction: query.options?.direction || "desc",
          }}
          onSortStatusChange={(value) =>
            applyFilterQuery({
              ...query,
              options: {
                ...query.options!,
                sort: value.columnAccessor as GameSort,
                direction: value.direction,
              },
            })
          }
          recordsPerPageOptions={[10, 25, 50]}
          onRowClick={({ index }) => {
            setSelectedGame(index);
          }}
        />
      }
      preview={
        selectedGame !== undefined && selectedGame !== null && games[selectedGame] ? (
          <GameCard game={games[selectedGame]} file={file} mutate={mutate} />
        ) : (
          <Center h="100%">
            <Text>{t("Databases.Game.NoSelection")}</Text>
          </Center>
        )
      }
    />
  );
}

export default GameTable;
