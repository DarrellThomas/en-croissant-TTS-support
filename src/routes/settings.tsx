import { createFileRoute } from "@tanstack/react-router";
import { getVersion } from "@tauri-apps/api/app";
import SettingsPage from "@/components/settings/SettingsPage";

type SettingsSearch = {
  tab?: string;
};

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  validateSearch: (search: Record<string, unknown>): SettingsSearch => ({
    tab: (search.tab as string) || undefined,
  }),
  loader: async ({ context: { loadDirs } }) => ({
    dirs: await loadDirs(),
    version: await getVersion(),
  }),
});
