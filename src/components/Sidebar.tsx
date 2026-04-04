"use no memo";
import { AppShellSection, Stack, Tooltip, UnstyledButton } from "@mantine/core";
import {
  type Icon,
  IconChess,
  IconCpu,
  IconDatabase,
  IconFiles,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import cx from "clsx";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { zenModeAtom } from "@/state/atoms";
import ZenIcon from "./ZenIcon";
import classes from "./Sidebar.module.css";

// "Language" in every supported language — always readable
const LANGUAGE_TOOLTIP = [
  "Language",
  "Idioma",
  "भाषा",
  "Язык",
  "Sprache",
  "Langue",
  "Język",
  "Lingua",
  "Мова",
  "Dil",
  "언어",
  "语言",
  "語言",
  "Språk",
].join(" · ");

interface NavbarLinkProps {
  icon: Icon;
  label: string;
  url: string;
  active?: boolean;
}

function NavbarLink({ url, icon: Icon, label }: NavbarLinkProps) {
  const match = useMatchRoute();
  return (
    <Tooltip label={label} position="right">
      <Link
        to={url}
        className={cx(classes.link, {
          [classes.active]: match({ to: url, fuzzy: true }) !== false,
        })}
      >
        <Icon size="1.5rem" stroke={1.5} />
      </Link>
    </Tooltip>
  );
}

function LanguageNavLink() {
  const match = useMatchRoute();
  const onSettingsRoute = match({ to: "/settings", fuzzy: true }) !== false;
  const isActive =
    onSettingsRoute && new URLSearchParams(window.location.search).get("tab") === "language";
  return (
    <Tooltip label={LANGUAGE_TOOLTIP} position="right" multiline w={280}>
      <Link
        to="/settings"
        search={{ tab: "language" }}
        className={cx(classes.link, {
          [classes.active]: isActive,
        })}
      >
        <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>🌐</span>
      </Link>
    </Tooltip>
  );
}

const linksdata = [
  { icon: IconChess, label: "Board", url: "/" },
  { icon: IconUser, label: "User", url: "/accounts" },
  { icon: IconFiles, label: "Files", url: "/files" },
  {
    icon: IconDatabase,
    label: "Databases",
    url: "/databases",
  },
  { icon: IconCpu, label: "Engines", url: "/engines" },
];

export function SideBar() {
  const { t } = useTranslation();
  const [zenMode, setZenMode] = useAtom(zenModeAtom);

  const links = linksdata.map((link) => (
    <NavbarLink {...link} label={t(`SideBar.${link.label}`)} key={link.label} />
  ));

  return (
    <>
      <AppShellSection grow>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </AppShellSection>
      <AppShellSection>
        <Stack justify="center" gap={0}>
          <Tooltip label="Zen Mode (Shift+Z, Esc to exit)" position="right">
            <UnstyledButton
              className={cx(classes.link, { [classes.active]: zenMode })}
              onClick={() => setZenMode((z) => !z)}
            >
              <ZenIcon />
            </UnstyledButton>
          </Tooltip>
          <LanguageNavLink />
          <NavbarLink icon={IconSettings} label={t("SideBar.Settings")} url="/settings" />
        </Stack>
      </AppShellSection>
    </>
  );
}
