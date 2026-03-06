import {
  Anchor,
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const API_KEY_KEYS = ["tts-api-key", "tts-google-api-key"];

const RECENT_FILES_KEYS = ["recent-files", "sessions"];

function clearRecentFiles() {
  for (const key of RECENT_FILES_KEYS) {
    localStorage.removeItem(key);
  }
}

function clearApiKeys() {
  for (const key of API_KEY_KEYS) {
    localStorage.removeItem(key);
  }
}

function clearUserData() {
  // Remove everything except API keys and recent files
  const keysToKeep = new Set([...API_KEY_KEYS, ...RECENT_FILES_KEYS]);
  const allKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) allKeys.push(key);
  }
  for (const key of allKeys) {
    if (!keysToKeep.has(key)) {
      localStorage.removeItem(key);
    }
  }
  sessionStorage.clear();
}

function clearAll() {
  localStorage.clear();
  sessionStorage.clear();
}

function ClearDataModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        next.delete("all");
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.has("all")) {
      setSelected(new Set());
    } else {
      setSelected(new Set(["all", "recent", "userdata", "apikeys"]));
    }
  };

  const handleClear = () => {
    if (selected.has("all")) {
      clearAll();
    } else {
      if (selected.has("recent")) clearRecentFiles();
      if (selected.has("apikeys")) clearApiKeys();
      if (selected.has("userdata")) clearUserData();
    }
    onClose();
    location.reload();
  };

  return (
    <Modal
      centered
      opened={opened}
      onClose={onClose}
      title={t("ClearData.Title")}
    >
      <Stack gap="md">
        <Text size="sm">{t("ClearData.Description")}</Text>

        <Stack gap="xs">
          <Checkbox
            label={t("ClearData.RecentFiles")}
            checked={selected.has("recent")}
            onChange={() => toggle("recent")}
          />
          <Checkbox
            label={t("ClearData.UserData")}
            checked={selected.has("userdata")}
            onChange={() => toggle("userdata")}
          />
          <Text size="xs" c="dimmed" pl="xl">
            {t("ClearData.UserDataDesc")}
          </Text>
          <Checkbox
            label={t("ClearData.ApiKeys")}
            checked={selected.has("apikeys")}
            onChange={() => toggle("apikeys")}
          />
          <Checkbox
            label={t("ClearData.All")}
            checked={selected.has("all")}
            onChange={toggleAll}
            fw={700}
          />
        </Stack>

        <Text size="xs" c="dimmed">
          {t("ClearData.ManageNote")}{" "}
          <Anchor
            size="xs"
            onClick={() => {
              onClose();
              navigate({ to: "/databases" });
            }}
          >
            {t("SideBar.Databases")}
          </Anchor>{" "}
          {t("ClearData.Or")}{" "}
          <Anchor
            size="xs"
            onClick={() => {
              onClose();
              navigate({ to: "/engines" });
            }}
          >
            {t("SideBar.Engines")}
          </Anchor>{" "}
          {t("ClearData.Pages")}
        </Text>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t("Common.Cancel")}
          </Button>
          <Button
            color="red"
            disabled={selected.size === 0}
            onClick={handleClear}
          >
            {t("ClearData.Confirm")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default ClearDataModal;
