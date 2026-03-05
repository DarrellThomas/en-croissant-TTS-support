import { globalStyle } from "@vanilla-extract/css";
import { vars } from "@/styles/theme";

globalStyle(".recent-file-row:hover", {
  [vars.darkSelector]: {
    backgroundColor: "var(--mantine-color-dark-5)",
  },
  [vars.lightSelector]: {
    backgroundColor: "var(--mantine-color-gray-1)",
  },
});

globalStyle(".home-card", {
  transition: "transform 0.12s ease, box-shadow 0.12s ease",
  boxShadow: "var(--mantine-shadow-sm)",
  [vars.darkSelector]: {
    borderColor: vars.colors.dark[3],
  },
  [vars.lightSelector]: {
    borderColor: vars.colors.gray[4],
  },
});

globalStyle(".home-card:hover", {
  transform: "translateY(-2px)",
  boxShadow: "var(--mantine-shadow-md)",
});
