import { AppShell } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  createRootRouteWithContext,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { TauriEvent } from "@tauri-apps/api/event";
import {
  Menu,
  MenuItem,
  PredefinedMenuItem,
  Submenu,
} from "@tauri-apps/api/menu";
import { appLogDir, resolve, resolveResource } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask, message, open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { platform } from "@tauri-apps/plugin-os";
import { exit, relaunch } from "@tauri-apps/plugin-process";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import { check } from "@tauri-apps/plugin-updater";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "react-i18next";
import useSWRImmutable from "swr/immutable";
import { match } from "ts-pattern";
import type { Dirs } from "@/App";
import AboutModal from "@/components/About";
import { DocViewer } from "@/components/DocViewer";
import { SideBar } from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { activeTabAtom, nativeBarAtom, tabsAtom } from "@/state/atoms";
import { keyMapAtom } from "@/state/keybinds";
import { openFile } from "@/utils/files";
import { createTab } from "@/utils/tabs";

type MenuGroup = {
  label: string;
  options: MenuAction[];
};

type MenuAction = {
  id?: string;
  label: string;
  shortcut?: string;
  action?: () => void;
  item?:
    | "Hide"
    | "Copy"
    | "Cut"
    | "Paste"
    | "SelectAll"
    | "Undo"
    | "Redo"
    | "Quit";
  submenu?: MenuAction[];
};

async function createMenu(menuActions: MenuGroup[]) {
  const items = await Promise.all(
    menuActions.map(async (group) => {
      const submenuItems = await Promise.all(
        group.options.map(async (option) => {
          return match(option.label)
            .with("divider", () =>
              PredefinedMenuItem.new({
                item: "Separator",
              }),
            )
            .otherwise(async () => {
              if (option.item) {
                return PredefinedMenuItem.new({
                  text: option.label,
                  item: option.item,
                });
              }

              if (option.submenu) {
                const children = await Promise.all(
                  option.submenu.map((sub) =>
                    MenuItem.new({
                      id: sub.id,
                      text: sub.label,
                      action: sub.action,
                    }),
                  ),
                );
                return Submenu.new({
                  text: option.label,
                  items: children,
                });
              }

              return MenuItem.new({
                id: option.id,
                text: option.label,
                accelerator: option.shortcut,
                action: option.action,
              });
            });
        }),
      );

      return Submenu.new({
        text: group.label,
        items: submenuItems,
      });
    }),
  );

  return Menu.new({
    items: items,
  });
}

export const Route = createRootRouteWithContext<{
  loadDirs: () => Promise<Dirs>;
}>()({
  component: RootLayout,
});

function RootLayout() {
  const isNative = useAtomValue(nativeBarAtom);
  const navigate = useNavigate();

  const [, setTabs] = useAtom(tabsAtom);
  const [, setActiveTab] = useAtom(activeTabAtom);

  const { t } = useTranslation();

  const openNewFile = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "PGN file", extensions: ["pgn"] }],
    });
    if (typeof selected === "string") {
      navigate({ to: "/" });
      openFile(selected, setTabs, setActiveTab);
    }
  }, [navigate, setActiveTab, setTabs]);

  const createNewTab = useCallback(() => {
    navigate({ to: "/" });
    createTab({
      tab: { name: t("Tab.NewTab"), type: "new" },
      setTabs,
      setActiveTab,
    });
  }, [navigate, setActiveTab, setTabs, t]);

  const openDemo = useCallback(
    async (lang: string, label: string) => {
      try {
        const p = await resolveResource(`docs/demos/tts-demo-${lang}.pgn`);
        const pgn = await readTextFile(p);
        navigate({ to: "/" });
        createTab({
          tab: { name: `TTS Demo (${label})`, type: "analysis" },
          setTabs,
          setActiveTab,
          pgn,
        });
      } catch (e) {
        console.error("Failed to open demo:", e);
      }
    },
    [navigate, setTabs, setActiveTab],
  );

  const checkForUpdates = useCallback(async () => {
    const update = await check();
    if (update) {
      const yes = await ask("Do you want to install the new version now?", {
        title: "New version available",
      });
      if (yes) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } else {
      await message("No updates available");
    }
  }, []);

  const openSettings = useCallback(async () => {
    navigate({ to: "/settings" });
  }, [navigate]);

  const [keyMap] = useAtom(keyMapAtom);

  useHotkeys(keyMap.NEW_TAB.keys, createNewTab);
  useHotkeys(keyMap.OPEN_FILE.keys, openNewFile);
  const [opened, setOpened] = useState(false);
  const [docResource, setDocResource] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("");

  const isMacOS = platform() === "macos";

  const aboutOption = {
    label: t("Menu.Help.About"),
    id: "about",
    action: () => setOpened(true),
  };

  const checkForUpdatesOption = {
    label: t("Menu.Help.CheckUpdate"),
    id: "check_for_updates",
    action: checkForUpdates,
  };

  const appMenu: MenuGroup = {
    label: "Application Menu",
    options: [
      {
        label: t("Menu.Application.About", {
          defaultValue: t("Menu.Help.About"),
        }),
        id: aboutOption.id,
        action: aboutOption.action,
      },
      checkForUpdatesOption,
      { label: "divider" },
      {
        label: t("SideBar.Settings") + "...",
        id: "settings",
        shortcut: "cmd+,",
        action: openSettings,
      },
      {
        label: t("Menu.Application.Hide"),
        item: "Hide",
      },
      { label: "divider" },
      {
        label: t("Menu.Application.Quit", {
          defaultValue: t("Menu.File.Exit"),
        }),
        item: "Quit",
      },
    ],
  };

  const macOSEditMenu: MenuGroup = {
    label: t("Menu.Edit"),
    options: [
      {
        label: t("Menu.Edit.Undo"),
        item: "Undo",
      },
      {
        label: t("Menu.Edit.Redo"),
        item: "Redo",
      },
      { label: "divider" },
      {
        label: t("Menu.Edit.Copy"),
        item: "Copy",
      },
      {
        label: t("Menu.Edit.Cut"),
        item: "Cut",
      },
      {
        label: t("Menu.Edit.Paste"),
        item: "Paste",
      },
      { label: "divider" },
      {
        label: t("Menu.Edit.SelectAll"),
        item: "SelectAll",
      },
    ],
  };

  const menuActions: MenuGroup[] = useMemo(
    () => [
      ...(isMacOS ? [appMenu] : []),
      {
        label: t("Menu.File"),
        options: [
          {
            label: t("Menu.File.NewTab"),
            id: "new_tab",
            shortcut: keyMap.NEW_TAB.keys,
            action: createNewTab,
          },
          {
            label: t("Menu.File.OpenFile"),
            id: "open_file",
            shortcut: keyMap.OPEN_FILE.keys,
            action: openNewFile,
          },
          ...(!isMacOS
            ? [
                {
                  label: t("Menu.File.Exit"),
                  id: "exit",
                  action: () => exit(0),
                },
              ]
            : []),
        ],
      },
      ...(!isMacOS ? [] : [macOSEditMenu]),
      {
        label: t("Menu.View"),
        options: [
          {
            label: t("Menu.View.Reload"),
            id: "reload",
            shortcut: "Ctrl+R",
            action: () => location.reload(),
          },
        ],
      },
      {
        label: "TTS",
        options: [
          {
            label: "Getting Started",
            id: "tts_getting_started",
            submenu: [
              {
                label: "TTS Guide (English)",
                id: "tts_guide_en",
                action: () => {
                  setDocTitle("TTS Guide (English)");
                  setDocResource("docs/tts/tts-guide.md");
                },
              },
              {
                label: "TTS Guide (Fran\u00e7ais)",
                id: "tts_guide_fr",
                action: () => {
                  setDocTitle("TTS Guide (Fran\u00e7ais)");
                  setDocResource("docs/tts/tts-guide-fr.md");
                },
              },
              {
                label: "TTS Guide (Espa\u00f1ol)",
                id: "tts_guide_es",
                action: () => {
                  setDocTitle("TTS Guide (Espa\u00f1ol)");
                  setDocResource("docs/tts/tts-guide-es.md");
                },
              },
              {
                label: "TTS Guide (Deutsch)",
                id: "tts_guide_de",
                action: () => {
                  setDocTitle("TTS Guide (Deutsch)");
                  setDocResource("docs/tts/tts-guide-de.md");
                },
              },
              {
                label: "TTS\u30ac\u30a4\u30c9 (\u65e5\u672c\u8a9e)",
                id: "tts_guide_ja",
                action: () => {
                  setDocTitle("TTS\u30ac\u30a4\u30c9 (\u65e5\u672c\u8a9e)");
                  setDocResource("docs/tts/tts-guide-ja.md");
                },
              },
              {
                label:
                  "\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0441\u0442\u0432\u043e TTS (\u0420\u0443\u0441\u0441\u043a\u0438\u0439)",
                id: "tts_guide_ru",
                action: () => {
                  setDocTitle(
                    "\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0441\u0442\u0432\u043e TTS (\u0420\u0443\u0441\u0441\u043a\u0438\u0439)",
                  );
                  setDocResource("docs/tts/tts-guide-ru.md");
                },
              },
              {
                label: "TTS\u6307\u5357 (\u4e2d\u6587)",
                id: "tts_guide_zh",
                action: () => {
                  setDocTitle("TTS\u6307\u5357 (\u4e2d\u6587)");
                  setDocResource("docs/tts/tts-guide-zh.md");
                },
              },
              {
                label: "TTS \uAC00\uC774\uB4DC (\uD55C\uAD6D\uC5B4)",
                id: "tts_guide_ko",
                action: () => {
                  setDocTitle("TTS \uAC00\uC774\uB4DC (\uD55C\uAD6D\uC5B4)");
                  setDocResource("docs/tts/tts-guide-ko.md");
                },
              },
            ],
          },
          {
            label: "TTS Demo",
            id: "tts_demo",
            submenu: [
              {
                label: "English",
                id: "tts_demo_en",
                action: () => openDemo("en", "English"),
              },
              {
                label: "Fran\u00e7ais",
                id: "tts_demo_fr",
                action: () => openDemo("fr", "Fran\u00e7ais"),
              },
              {
                label: "Espa\u00f1ol",
                id: "tts_demo_es",
                action: () => openDemo("es", "Espa\u00f1ol"),
              },
              {
                label: "Deutsch",
                id: "tts_demo_de",
                action: () => openDemo("de", "Deutsch"),
              },
              {
                label: "\u65e5\u672c\u8a9e",
                id: "tts_demo_ja",
                action: () => openDemo("ja", "\u65e5\u672c\u8a9e"),
              },
              {
                label: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
                id: "tts_demo_ru",
                action: () =>
                  openDemo("ru", "\u0420\u0443\u0441\u0441\u043a\u0438\u0439"),
              },
              {
                label: "\u4e2d\u6587",
                id: "tts_demo_zh",
                action: () => openDemo("zh", "\u4e2d\u6587"),
              },
              {
                label: "\uD55C\uAD6D\uC5B4",
                id: "tts_demo_ko",
                action: () => openDemo("ko", "\uD55C\uAD6D\uC5B4"),
              },
            ],
          },
          {
            label: "TTS Settings",
            id: "tts_settings",
            action: () => {
              navigate({ to: "/settings", search: { tab: "sound" } });
            },
          },
        ],
      },
      {
        label: t("Menu.Help"),
        options: [
          {
            label: "En Parlant~ Docs",
            id: "documentation",
            action: () => {
              setDocTitle("En Parlant~ Docs");
              setDocResource("docs/README.md");
            },
          },
          {
            label: "License (GPL-3.0)",
            id: "license",
            action: () => {
              setDocTitle("License (GPL-3.0)");
              setDocResource("docs/LICENSE");
            },
          },
          { label: "divider" },
          {
            label: t("Menu.Help.ClearSavedData"),
            id: "clear_saved_data",
            action: () => {
              ask("Are you sure you want to clear all saved data?", {
                title: "Clear data",
              }).then((res) => {
                if (res) {
                  localStorage.clear();
                  sessionStorage.clear();
                  location.reload();
                }
              });
            },
          },
          {
            label: t("Menu.Help.OpenLogs"),
            id: "logs",
            action: async () => {
              const path = await resolve(await appLogDir(), "en-parlant.log");
              notifications.show({
                title: "Logs",
                message: `Opened logs in ${path}`,
              });
              await shellOpen(path);
            },
          },
          { label: "divider" },
          ...(!isMacOS ? [checkForUpdatesOption, aboutOption] : []),
        ],
      },
    ],
    [t, checkForUpdates, createNewTab, keyMap, openNewFile, openDemo],
  );

  const { data: menu } = useSWRImmutable(["menu", menuActions], () =>
    createMenu(menuActions),
  );

  useEffect(() => {
    if (!menu) return;
    if (isNative || import.meta.env.VITE_PLATFORM !== "win32") {
      menu.setAsAppMenu();
      getCurrentWindow().setDecorations(true);
    } else {
      Menu.new().then((m) => m.setAsAppMenu());
      getCurrentWindow().setDecorations(false);
    }
  }, [menu, isNative]);

  useEffect(() => {
    const unlisten = getCurrentWindow().listen(
      TauriEvent.DRAG_DROP,
      (event) => {
        const payload = event.payload as { paths: string[] };
        if (payload?.paths) {
          const pgnFiles = payload.paths.filter((path) =>
            path.toLowerCase().endsWith(".pgn"),
          );

          if (pgnFiles.length > 0) {
            navigate({ to: "/" });
            for (const file of pgnFiles) {
              openFile(file, setTabs, setActiveTab);
            }
          }
        }
      },
    );

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [navigate, setTabs, setActiveTab]);

  return (
    <AppShell
      navbar={{
        width: "3rem",
        breakpoint: 0,
      }}
      header={
        isNative || import.meta.env.VITE_PLATFORM !== "win32"
          ? undefined
          : {
              height: "2.25rem",
            }
      }
      styles={{
        main: {
          height: "100vh",
          userSelect: "none",
        },
      }}
    >
      <AboutModal opened={opened} setOpened={setOpened} />
      <DocViewer
        resource={docResource}
        title={docTitle}
        onClose={() => setDocResource(null)}
      />
      {!isNative && import.meta.env.VITE_PLATFORM === "win32" && (
        <AppShell.Header>
          <TopBar menuActions={menuActions} />
        </AppShell.Header>
      )}
      <AppShell.Navbar>
        <SideBar />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
