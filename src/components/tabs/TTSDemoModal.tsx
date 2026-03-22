import {
  Anchor,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { IconBrain, IconHeadphones, IconKey, IconSparkles } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { Trans, useTranslation } from "react-i18next";
import { activeTabAtom, tabsAtom } from "@/state/atoms";
import { createTab } from "@/utils/tabs";

const DEMO_LANGUAGES = [
  {
    code: "en",
    label: "English",
    flag: "\u{1F1EC}\u{1F1E7}",
    male: "Male",
    female: "Female",
  },
  {
    code: "fr",
    label: "Fran\u00E7ais",
    flag: "\u{1F1EB}\u{1F1F7}",
    male: "Masculin",
    female: "F\u00E9minin",
  },
  {
    code: "es",
    label: "Espa\u00F1ol",
    flag: "\u{1F1EA}\u{1F1F8}",
    male: "Masculino",
    female: "Femenino",
  },
  {
    code: "de",
    label: "Deutsch",
    flag: "\u{1F1E9}\u{1F1EA}",
    male: "M\u00E4nnlich",
    female: "Weiblich",
  },
  {
    code: "ja",
    label: "\u65E5\u672C\u8A9E",
    flag: "\u{1F1EF}\u{1F1F5}",
    male: "\u7537\u6027",
    female: "\u5973\u6027",
  },
  {
    code: "ru",
    label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
    flag: "\u{1F1F7}\u{1F1FA}",
    male: "\u041C\u0443\u0436\u0441\u043A\u043E\u0439",
    female: "\u0416\u0435\u043D\u0441\u043A\u0438\u0439",
  },
  {
    code: "zh",
    label: "\u4E2D\u6587",
    flag: "\u{1F1E8}\u{1F1F3}",
    male: "\u7537\u58F0",
    female: "\u5973\u58F0",
  },
  {
    code: "ko",
    label: "\uD55C\uAD6D\uC5B4",
    flag: "\u{1F1F0}\u{1F1F7}",
    male: "\uB0A8\uC131",
    female: "\uC5EC\uC131",
  },
  {
    code: "hi",
    label: "\u0939\u093F\u0928\u094D\u0926\u0940",
    flag: "\u{1F1EE}\u{1F1F3}",
    male: "\u092A\u0941\u0930\u0941\u0937",
    female: "\u092E\u0939\u093F\u0932\u093E",
  },
];

export default function TTSDemoModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [, setTabs] = useAtom(tabsAtom);
  const setActiveTab = useSetAtom(activeTabAtom);
  const navigate = useNavigate();

  async function openDemo(lang: string, label: string, gender: "male" | "female") {
    try {
      const res = await fetch(`https://enparlant.redshed.ai/pgn/demo/tts-demo-${lang}.pgn`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let pgn = await res.text();
      pgn = pgn.replace('[AudioSource "demo"]', `[AudioSource "demo"]\n[AudioGender "${gender}"]`);
      navigate({ to: "/" });
      createTab({
        tab: { name: `Demo \u2014 ${label}`, type: "analysis" },
        setTabs,
        setActiveTab,
        pgn,
      });
      onClose();
    } catch (e) {
      console.error("Failed to open demo:", e);
    }
  }

  const settingsClick = () => {
    navigate({ to: "/settings", search: { tab: "tts" } });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconHeadphones size={20} />
          <Text fw={600}>{t("TTSDemo.ModalTitle")}</Text>
        </Group>
      }
      size="xl"
    >
      <Stack gap="md">
        <Text size="md">
          <Trans i18nKey="TTSDemo.Intro" components={{ bold: <strong /> }} />
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          <Box
            p="sm"
            style={{
              borderRadius: "var(--mantine-radius-md)",
              border: "1px solid var(--mantine-color-default-border)",
            }}
          >
            <Group gap="xs" mb={4}>
              <IconBrain size={16} />
              <Text size="sm" fw={600}>
                {t("TTSDemo.FreeOption.Title")}
              </Text>
              <Badge size="xs" color="green" variant="light">
                {t("TTSDemo.FreeOption.Badge")}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              <Trans i18nKey="TTSDemo.FreeOption.Desc" components={{ bold: <strong /> }} />
            </Text>
          </Box>

          <Box
            p="sm"
            style={{
              borderRadius: "var(--mantine-radius-md)",
              border: "1px solid var(--mantine-color-default-border)",
            }}
          >
            <Group gap="xs" mb={4}>
              <IconKey size={16} />
              <Text size="sm" fw={600}>
                {t("TTSDemo.BYOK.Title")}
              </Text>
              <Badge size="xs" color="violet" variant="light">
                {t("TTSDemo.BYOK.Badge")}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              <Trans i18nKey="TTSDemo.BYOK.Desc" components={{ bold: <strong /> }} />
            </Text>
          </Box>
        </SimpleGrid>

        <Divider label={t("TTSDemo.PickLanguage")} labelPosition="center" />

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
          {DEMO_LANGUAGES.map((lang) => (
            <Box
              key={lang.code}
              p="sm"
              style={{
                borderRadius: "var(--mantine-radius-md)",
                border: "1px solid var(--mantine-color-default-border)",
              }}
            >
              <Group gap="xs" mb="xs">
                <Text size="lg">{lang.flag}</Text>
                <Text size="sm" fw={500}>
                  {lang.label}
                </Text>
              </Group>
              <Group gap="xs" grow>
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconSparkles size={12} />}
                  onClick={() => openDemo(lang.code, lang.label, "male")}
                >
                  {lang.male}
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="pink"
                  leftSection={<IconSparkles size={12} />}
                  onClick={() => openDemo(lang.code, lang.label, "female")}
                >
                  {lang.female}
                </Button>
              </Group>
            </Box>
          ))}
        </SimpleGrid>

        <Text size="xs" c="dimmed" ta="center">
          <Trans
            i18nKey="TTSDemo.SetupHint"
            components={{
              link: <Anchor size="xs" onClick={settingsClick} />,
            }}
          />
        </Text>
      </Stack>
    </Modal>
  );
}
