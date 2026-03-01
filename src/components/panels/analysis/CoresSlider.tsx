import { SegmentedControl, useMantineTheme } from "@mantine/core";

export default function CoresSlider(props: {
  value: number;
  setValue: (v: number) => void;
  color?: string;
}) {
  const theme = useMantineTheme();
  const maxCores = navigator.hardwareConcurrency;
  const values: number[] = [];
  for (let v = 1; v <= maxCores; v *= 2) {
    values.push(v);
  }
  if (values[values.length - 1] !== maxCores) {
    values.push(maxCores);
  }

  return (
    <SegmentedControl
      size="xs"
      color={props.color || theme.primaryColor}
      value={props.value.toString()}
      onChange={(v) => props.setValue(Number.parseInt(v))}
      data={values.map((v) => v.toString())}
    />
  );
}
