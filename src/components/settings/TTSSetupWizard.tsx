import {
  Alert,
  Button,
  Code,
  CopyButton,
  Group,
  Loader,
  Modal,
  Stack,
  Stepper,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconDownload,
  IconX,
} from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";
import { useCallback, useEffect, useState } from "react";
import { commands } from "@/bindings";
import { useProgress } from "@/hooks/useProgress";

interface DepCheck {
  ok: boolean;
  label: string;
  detail: string;
  fix_hint: string;
}

type Provider = "kittentts" | "opentts";

interface TTSSetupWizardProps {
  opened: boolean;
  onClose: () => void;
  provider: Provider;
  onReady?: () => void;
}

// --- KittenTTS wizard ---

function KittenTTSWizard({
  onClose,
  onReady,
}: {
  onClose: () => void;
  onReady?: () => void;
}) {
  const [active, setActive] = useState(0);
  const [checks, setChecks] = useState<Record<string, DepCheck | null>>({
    python: null,
    venv: null,
    packages: null,
    script: null,
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    setLoading("checking");
    setSetupError(null);
    try {
      const [python, venv, packages, script] = await Promise.all([
        invoke<DepCheck>("check_python_installed"),
        invoke<DepCheck>("check_kittentts_venv"),
        invoke<DepCheck>("check_kittentts_packages"),
        invoke<DepCheck>("check_kittentts_script"),
      ]);
      setChecks({ python, venv, packages, script });

      // Auto-advance to first failing step
      if (!python.ok) setActive(0);
      else if (!venv.ok) setActive(1);
      else if (!packages.ok) setActive(2);
      else if (!script.ok) setActive(3);
      else setActive(4); // all passed
    } catch (e) {
      console.error("Check failed:", e);
    } finally {
      setLoading(null);
    }
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const allPassed =
    checks.python?.ok &&
    checks.venv?.ok &&
    checks.packages?.ok &&
    checks.script?.ok;

  const handleSetupVenv = async () => {
    setLoading("venv");
    setSetupError(null);
    try {
      await invoke("setup_kittentts_venv");
      await runChecks();
    } catch (e) {
      setSetupError(String(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Stack gap="md">
      <Stepper active={active} onStepClick={setActive} size="sm">
        <Stepper.Step
          label="Python 3"
          description={checks.python?.ok ? checks.python.detail : "Required"}
          icon={stepIcon(checks.python)}
          color={stepColor(checks.python)}
        >
          <StepContent check={checks.python} loading={loading === "checking"}>
            {checks.python && !checks.python.ok && (
              <SudoHint command={checks.python.fix_hint} />
            )}
          </StepContent>
        </Stepper.Step>

        <Stepper.Step
          label="Virtual Environment"
          description={checks.venv?.ok ? "Found" : "Not created"}
          icon={stepIcon(checks.venv)}
          color={stepColor(checks.venv)}
        >
          <StepContent check={checks.venv} loading={loading === "checking"}>
            {checks.venv && !checks.venv.ok && (
              <Stack gap="xs">
                <Button
                  size="sm"
                  loading={loading === "venv"}
                  onClick={handleSetupVenv}
                >
                  Create Venv & Install Packages
                </Button>
                {setupError && (
                  <Alert color="red" icon={<IconX size={16} />}>
                    {setupError}
                  </Alert>
                )}
              </Stack>
            )}
          </StepContent>
        </Stepper.Step>

        <Stepper.Step
          label="Python Packages"
          description={checks.packages?.ok ? "Installed" : "Missing"}
          icon={stepIcon(checks.packages)}
          color={stepColor(checks.packages)}
        >
          <StepContent check={checks.packages} loading={loading === "checking"}>
            {checks.packages && !checks.packages.ok && (
              <Stack gap="xs">
                <Button
                  size="sm"
                  loading={loading === "venv"}
                  onClick={handleSetupVenv}
                >
                  Install Packages
                </Button>
                {setupError && (
                  <Alert color="red" icon={<IconX size={16} />}>
                    {setupError}
                  </Alert>
                )}
              </Stack>
            )}
          </StepContent>
        </Stepper.Step>

        <Stepper.Step
          label="Server Script"
          description={checks.script?.ok ? "Found" : "Missing"}
          icon={stepIcon(checks.script)}
          color={stepColor(checks.script)}
        >
          <StepContent check={checks.script} loading={loading === "checking"}>
            {checks.script && !checks.script.ok && (
              <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>
                The server script should be included with the application. Try
                reinstalling.
              </Alert>
            )}
          </StepContent>
        </Stepper.Step>

        <Stepper.Completed>
          <Stack gap="sm" mt="md" align="center">
            <ThemeIcon color="green" size="xl" radius="xl">
              <IconCheck size={24} />
            </ThemeIcon>
            <Text fw={500}>All dependencies are installed!</Text>
          </Stack>
        </Stepper.Completed>
      </Stepper>

      <Group justify="space-between" mt="md">
        <Button
          variant="subtle"
          onClick={runChecks}
          loading={loading === "checking"}
        >
          Re-check All
        </Button>
        <Group gap="xs">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
          {allPassed && onReady && (
            <Button
              color="green"
              onClick={() => {
                onReady();
                onClose();
              }}
            >
              Start Server
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  );
}

// --- OpenTTS wizard ---

function OpenTTSWizard({
  onClose,
  onReady,
}: {
  onClose: () => void;
  onReady?: () => void;
}) {
  const [active, setActive] = useState(0);
  const [checks, setChecks] = useState<Record<string, DepCheck | null>>({
    docker: null,
    running: null,
    image: null,
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    setLoading("checking");
    setSetupError(null);
    try {
      const [docker, running, image] = await Promise.all([
        invoke<DepCheck>("check_docker_installed"),
        invoke<DepCheck>("check_docker_running"),
        invoke<DepCheck>("check_opentts_image"),
      ]);
      setChecks({ docker, running, image });

      if (!docker.ok) setActive(0);
      else if (!running.ok) setActive(1);
      else if (!image.ok) setActive(2);
      else setActive(3); // all passed
    } catch (e) {
      console.error("Check failed:", e);
    } finally {
      setLoading(null);
    }
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const allPassed = checks.docker?.ok && checks.running?.ok && checks.image?.ok;

  const DOWNLOAD_ID = "opentts_image_download";
  const { progress: dlProgress, isActive: dlActive } = useProgress(DOWNLOAD_ID);

  const handleDownloadAndLoad = async () => {
    setLoading("download");
    setSetupError(null);
    try {
      const dataDir = await appDataDir();
      const tarballPath = await join(dataDir, "opentts-en.tar.gz");

      // Phase 1: Download tarball from R2 with progress tracking
      const result = await commands.downloadFile(
        DOWNLOAD_ID,
        "https://enparlant.redshed.ai/docker/opentts-en.tar.gz",
        tarballPath,
        null,
        false,
        null,
      );
      if (result.status === "error") {
        throw new Error(result.error);
      }

      // Phase 2: Load into Docker
      setLoading("loading");
      await invoke("setup_opentts_load", { tarballPath });

      await runChecks();
    } catch (e) {
      setSetupError(String(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Stack gap="md">
      <Stepper active={active} onStepClick={setActive} size="sm">
        <Stepper.Step
          label="Docker"
          description={checks.docker?.ok ? checks.docker.detail : "Required"}
          icon={stepIcon(checks.docker)}
          color={stepColor(checks.docker)}
        >
          <StepContent check={checks.docker} loading={loading === "checking"}>
            {checks.docker && !checks.docker.ok && (
              <SudoHint command={checks.docker.fix_hint} />
            )}
          </StepContent>
        </Stepper.Step>

        <Stepper.Step
          label="Docker Running"
          description={checks.running?.ok ? "Active" : "Not running"}
          icon={stepIcon(checks.running)}
          color={stepColor(checks.running)}
        >
          <StepContent check={checks.running} loading={loading === "checking"}>
            {checks.running && !checks.running.ok && (
              <SudoHint command={checks.running.fix_hint} />
            )}
          </StepContent>
        </Stepper.Step>

        <Stepper.Step
          label="OpenTTS Image"
          description={checks.image?.ok ? "Ready" : "Not found"}
          icon={stepIcon(checks.image)}
          color={stepColor(checks.image)}
        >
          <StepContent check={checks.image} loading={loading === "checking"}>
            {checks.image && !checks.image.ok && (
              <Stack gap="xs">
                <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>
                  The OpenTTS Docker image is ~1.5 GB. This may take a few
                  minutes to download.
                </Alert>
                {loading === "download" && dlActive && (
                  <Group gap="xs">
                    <IconDownload size={16} />
                    <Text size="sm">
                      Downloading... {Math.round(dlProgress)}%
                    </Text>
                  </Group>
                )}
                {loading === "loading" && (
                  <Group gap="xs">
                    <Loader size="sm" />
                    <Text size="sm">Loading image into Docker...</Text>
                  </Group>
                )}
                <Button
                  size="sm"
                  loading={loading === "download" || loading === "loading"}
                  onClick={handleDownloadAndLoad}
                  leftSection={<IconDownload size={16} />}
                >
                  Download & Install Image
                </Button>
                {setupError && (
                  <Alert color="red" icon={<IconX size={16} />}>
                    {setupError}
                  </Alert>
                )}
              </Stack>
            )}
          </StepContent>
        </Stepper.Step>

        <Stepper.Completed>
          <Stack gap="sm" mt="md" align="center">
            <ThemeIcon color="green" size="xl" radius="xl">
              <IconCheck size={24} />
            </ThemeIcon>
            <Text fw={500}>All dependencies are installed!</Text>
          </Stack>
        </Stepper.Completed>
      </Stepper>

      <Group justify="space-between" mt="md">
        <Button
          variant="subtle"
          onClick={runChecks}
          loading={loading === "checking"}
        >
          Re-check All
        </Button>
        <Group gap="xs">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
          {allPassed && onReady && (
            <Button
              color="green"
              onClick={() => {
                onReady();
                onClose();
              }}
            >
              Start Container
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  );
}

// --- Shared UI helpers ---

function stepIcon(check: DepCheck | null) {
  if (!check) return <Loader size={16} />;
  return check.ok ? <IconCheck size={16} /> : <IconX size={16} />;
}

function stepColor(check: DepCheck | null): string | undefined {
  if (!check) return undefined;
  return check.ok ? "green" : "red";
}

function StepContent({
  check,
  loading,
  children,
}: {
  check: DepCheck | null;
  loading: boolean;
  children: React.ReactNode;
}) {
  if (loading || !check) {
    return (
      <Group gap="xs" mt="sm">
        <Loader size="sm" />
        <Text size="sm" c="dimmed">
          Checking...
        </Text>
      </Group>
    );
  }

  return (
    <Stack gap="sm" mt="sm">
      <Group gap="xs">
        <ThemeIcon
          size="sm"
          color={check.ok ? "green" : "red"}
          variant="light"
          radius="xl"
        >
          {check.ok ? <IconCheck size={12} /> : <IconX size={12} />}
        </ThemeIcon>
        <Text size="sm">{check.label}</Text>
      </Group>
      {check.detail && (
        <Text size="xs" c="dimmed">
          {check.detail}
        </Text>
      )}
      {children}
    </Stack>
  );
}

function SudoHint({ command }: { command: string }) {
  return (
    <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>
      <Stack gap="xs">
        <Text size="sm">
          This requires running in a terminal with appropriate permissions:
        </Text>
        <Group gap="xs" align="center">
          <Code block style={{ flex: 1 }}>
            {command}
          </Code>
          <CopyButton value={command}>
            {({ copied, copy }) => (
              <Button
                size="xs"
                variant="light"
                color={copied ? "green" : undefined}
                onClick={copy}
                leftSection={
                  copied ? <IconCheck size={14} /> : <IconCopy size={14} />
                }
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </CopyButton>
        </Group>
        <Text size="xs" c="dimmed">
          After running the command, click "Re-check All" below.
        </Text>
      </Stack>
    </Alert>
  );
}

// --- Main modal ---

export default function TTSSetupWizard({
  opened,
  onClose,
  provider,
  onReady,
}: TTSSetupWizardProps) {
  const title = provider === "kittentts" ? "KittenTTS Setup" : "OpenTTS Setup";

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg">
      {provider === "kittentts" ? (
        <KittenTTSWizard onClose={onClose} onReady={onReady} />
      ) : (
        <OpenTTSWizard onClose={onClose} onReady={onReady} />
      )}
    </Modal>
  );
}
