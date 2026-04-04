import { Input, type InputWrapperProps, Text } from "@mantine/core";
import type React from "react";

function FileInput({
  label,
  description,
  filename,
  placeholder,
  onClick,
  withAsterisk,
  disabled,
  rightSection,
  ...props
}: {
  label?: string;
  description?: string;
  filename: string | null;
  placeholder?: string;
  onClick: () => void;
  withAsterisk?: boolean;
  disabled?: boolean;
  rightSection?: React.ReactNode;
} & Omit<InputWrapperProps, "children">) {
  return (
    <Input.Wrapper withAsterisk={withAsterisk} label={label} description={description} {...props}>
      <Input
        component="button"
        type="button"
        onClick={onClick}
        disabled={disabled}
        rightSection={rightSection}
        pointer
      >
        <Text lineClamp={1} c={filename ? undefined : "dimmed"}>
          {filename || placeholder}
        </Text>
      </Input>
    </Input.Wrapper>
  );
}

export default FileInput;
