import type { SVGProps } from "react";

export default function ZenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="1.5rem"
      height="1.5rem"
      fill="currentColor"
      {...props}
    >
      {/* Zen meditation figure — adapted from 019-zen.svg (Flaticon) */}
      <path d="M256 96a48 48 0 1 0 0-96 48 48 0 0 0 0 96z" />
      <path d="M410 264c-14-14-36-14-50 0l-56 56-24-24V200c0-26-22-48-48-48h-8l-72 72-50-50c-14-14-36-14-50 0s-14 36 0 50l74 74c7 7 16 10 25 10s18-3 25-10l47-47v47l-81 81c-14 14-14 36 0 50 7 7 16 10 25 10s18-3 25-10l57-57 57 57c7 7 16 10 25 10s18-3 25-10c14-14 14-36 0-50l-81-81v-47l47 47c7 7 16 10 25 10s18-3 25-10l56-56c14-14 14-36 0-50z" />
      <path d="M256 448c-13 0-24 11-24 24v16c0 13 11 24 24 24s24-11 24-24v-16c0-13-11-24-24-24z" />
    </svg>
  );
}
