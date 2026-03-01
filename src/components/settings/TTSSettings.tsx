import {
  Alert,
  Button,
  Group,
  NumberInput,
  PasswordInput,
  Select,
  Slider,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import {
  ttsApiKeyAtom,
  ttsAutoNarrateAtom,
  ttsEnabledAtom,
  ttsGoogleApiKeyAtom,
  ttsGoogleGenderAtom,
  ttsKittenTTSThreadsAtom,
  ttsKittenTTSUrlAtom,
  ttsKittenTTSVoiceAtom,
  ttsLanguageAtom,
  ttsLocalServerStatusAtom,
  ttsOpenTTSUrlAtom,
  ttsOpenTTSVoiceAtom,
  ttsProviderAtom,
  ttsSpeedAtom,
  ttsSystemVoiceAtom,
  ttsVoiceIdAtom,
  ttsVolumeAtom,
} from "@/state/atoms";
import {
  clearAudioCache,
  type ElevenLabsVoice,
  KITTENTTS_VOICES,
  listOpenTTSVoices,
  listSystemVoices,
  listVoices,
  type OpenTTSVoice,
  type SystemVoice,
  speakText,
  stopSpeaking,
} from "@/utils/tts";
import TTSSetupWizard from "./TTSSetupWizard";

interface DepCheck {
  ok: boolean;
  label: string;
  detail: string;
  fix_hint: string;
}

export function TTSEnabledSwitch() {
  const [enabled, setEnabled] = useAtom(ttsEnabledAtom);
  return (
    <Switch
      checked={enabled}
      onChange={(e) => setEnabled(e.currentTarget.checked)}
    />
  );
}

export function TTSAutoNarrateSwitch() {
  const [autoNarrate, setAutoNarrate] = useAtom(ttsAutoNarrateAtom);
  return (
    <Switch
      checked={autoNarrate}
      onChange={(e) => setAutoNarrate(e.currentTarget.checked)}
    />
  );
}

export function TTSProviderSelect() {
  const [provider, setProvider] = useAtom(ttsProviderAtom);
  return (
    <Select
      w="14rem"
      data={[
        { value: "elevenlabs", label: "ElevenLabs" },
        { value: "google", label: "Google Cloud" },
        { value: "kittentts", label: "KittenTTS (English Only)" },
        { value: "opentts", label: "OpenTTS (Self-Hosted)" },
        { value: "system", label: "System (OS Native)" },
      ]}
      value={provider}
      onChange={(v) => v && setProvider(v)}
      allowDeselect={false}
    />
  );
}

export function TTSSetupButton() {
  const [provider] = useAtom(ttsProviderAtom);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [depsMissing, setDepsMissing] = useState<boolean | null>(null);
  const [serverStatus, setServerStatus] = useAtom(ttsLocalServerStatusAtom);
  const [threads] = useAtom(ttsKittenTTSThreadsAtom);

  useEffect(() => {
    if (provider !== "kittentts" && provider !== "opentts") {
      setDepsMissing(null);
      setServerStatus("idle");
      return;
    }

    let cancelled = false;
    const checkAndStart = async () => {
      try {
        let depsOk = false;
        if (provider === "kittentts") {
          const [venv, packages] = await Promise.all([
            invoke<DepCheck>("check_kittentts_venv"),
            invoke<DepCheck>("check_kittentts_packages"),
          ]);
          depsOk = venv.ok && packages.ok;
          if (!cancelled) setDepsMissing(!depsOk);
        } else {
          const [docker, running, image] = await Promise.all([
            invoke<DepCheck>("check_docker_installed"),
            invoke<DepCheck>("check_docker_running"),
            invoke<DepCheck>("check_opentts_image"),
          ]);
          depsOk = docker.ok && running.ok && image.ok;
          if (!cancelled) setDepsMissing(!depsOk);
        }

        // Auto-start server if deps are ready
        if (depsOk && !cancelled) {
          setServerStatus("starting");
          try {
            if (provider === "kittentts") {
              await invoke("kittentts_start", { threads: threads || null });
            } else {
              await invoke("opentts_start");
            }
            if (!cancelled) setServerStatus("running");
          } catch (e) {
            console.error(`Auto-start ${provider} failed:`, e);
            if (!cancelled) setServerStatus("idle");
          }
        }
      } catch {
        if (!cancelled) setDepsMissing(true);
      }
    };

    checkAndStart();
    return () => {
      cancelled = true;
    };
  }, [provider, setServerStatus]);

  if (provider !== "kittentts" && provider !== "opentts") {
    return null;
  }

  return (
    <>
      {depsMissing && (
        <Alert
          color="yellow"
          icon={<IconAlertTriangle size={16} />}
          title="Dependencies missing"
        >
          <Group gap="xs" align="center">
            <Text size="sm">
              {provider === "kittentts"
                ? "KittenTTS requires a Python virtual environment with packages installed."
                : "OpenTTS requires Docker with the OpenTTS image pulled."}
            </Text>
            <Button
              size="xs"
              variant="light"
              onClick={() => setWizardOpen(true)}
            >
              Setup Guide
            </Button>
          </Group>
        </Alert>
      )}
      {depsMissing === false && (
        <Alert
          color={serverStatus === "running" ? "green" : "blue"}
          title={
            serverStatus === "starting"
              ? "Starting server..."
              : serverStatus === "running"
                ? "Server running"
                : "Dependencies ready. Server stopped."
          }
        >
          <Text size="sm">
            {serverStatus === "starting"
              ? "Server is starting up. First launch may take a few seconds to load the model."
              : serverStatus === "running"
                ? "Server is running. You can test it with the voice selector below."
                : "All required dependencies are installed. Use the Start button to launch the server."}
          </Text>
        </Alert>
      )}
      {depsMissing === null &&
      provider !== "kittentts" &&
      provider !== "opentts" ? null : (
        <TTSSetupWizard
          opened={wizardOpen}
          onClose={() => setWizardOpen(false)}
          provider={provider as "kittentts" | "opentts"}
        />
      )}
    </>
  );
}

export function TTSGoogleApiKeyInput() {
  const [apiKey, setApiKey] = useAtom(ttsGoogleApiKeyAtom);
  const [tempKey, setTempKey] = useState(apiKey);

  useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey]);

  return (
    <Group gap="xs">
      <PasswordInput
        w="20rem"
        placeholder="AIza..."
        value={tempKey}
        onChange={(e) => setTempKey(e.currentTarget.value)}
        onBlur={() => setApiKey(tempKey)}
      />
    </Group>
  );
}

export function TTSApiKeyInput() {
  const [apiKey, setApiKey] = useAtom(ttsApiKeyAtom);
  const [tempKey, setTempKey] = useState(apiKey);

  useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey]);

  return (
    <Group gap="xs">
      <PasswordInput
        w="20rem"
        placeholder="sk_..."
        value={tempKey}
        onChange={(e) => setTempKey(e.currentTarget.value)}
        onBlur={() => setApiKey(tempKey)}
      />
    </Group>
  );
}

export function TTSKittenTTSUrlInput() {
  const [url, setUrl] = useAtom(ttsKittenTTSUrlAtom);
  const [tempUrl, setTempUrl] = useState(url);
  const [status, setStatus] = useState<"idle" | "starting" | "stopping">(
    "idle",
  );
  const [result, setResult] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [, setServerStatus] = useAtom(ttsLocalServerStatusAtom);
  const [threads] = useAtom(ttsKittenTTSThreadsAtom);

  useEffect(() => {
    setTempUrl(url);
  }, [url]);

  const showResult = (msg: string) => {
    setResult(msg);
    setTimeout(() => setResult(null), 2000);
  };

  const handleStart = async () => {
    // Check deps first — open wizard if missing
    try {
      const [venv, packages] = await Promise.all([
        invoke<DepCheck>("check_kittentts_venv"),
        invoke<DepCheck>("check_kittentts_packages"),
      ]);
      if (!venv.ok || !packages.ok) {
        setWizardOpen(true);
        return;
      }
    } catch {
      // If check fails, try starting anyway
    }

    setStatus("starting");
    setServerStatus("starting");
    try {
      await invoke("kittentts_start", { threads: threads || null });
      showResult("Started");
      setServerStatus("running");
    } catch (e) {
      showResult("Error");
      setServerStatus("idle");
      console.error("KittenTTS start error:", e);
    } finally {
      setStatus("idle");
    }
  };

  return (
    <>
      <Group gap="xs">
        <PasswordInput
          w="14rem"
          placeholder="http://localhost:8192"
          value={tempUrl}
          onChange={(e) => setTempUrl(e.currentTarget.value)}
          onBlur={() => setUrl(tempUrl)}
          visible
        />
        <Button
          size="xs"
          variant="light"
          color={result === "Started" ? "green" : undefined}
          loading={status === "starting"}
          onClick={handleStart}
        >
          {result === "Started" ? "Started" : "Start"}
        </Button>
        <Button
          size="xs"
          variant="light"
          color={result === "Stopped" ? "orange" : undefined}
          loading={status === "stopping"}
          onClick={async () => {
            setStatus("stopping");
            setServerStatus("idle");
            try {
              await invoke("kittentts_stop");
              showResult("Stopped");
            } catch (e) {
              showResult("Error");
              console.error("KittenTTS stop error:", e);
            } finally {
              setStatus("idle");
            }
          }}
        >
          {result === "Stopped" ? "Stopped" : "Stop"}
        </Button>
      </Group>
      <TTSSetupWizard
        opened={wizardOpen}
        onClose={() => setWizardOpen(false)}
        provider="kittentts"
        onReady={handleStart}
      />
    </>
  );
}

export function TTSOpenTTSUrlInput() {
  const [url, setUrl] = useAtom(ttsOpenTTSUrlAtom);
  const [tempUrl, setTempUrl] = useState(url);
  const [status, setStatus] = useState<"idle" | "starting" | "stopping">(
    "idle",
  );
  const [result, setResult] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [, setServerStatus] = useAtom(ttsLocalServerStatusAtom);

  useEffect(() => {
    setTempUrl(url);
  }, [url]);

  const showResult = (msg: string) => {
    setResult(msg);
    setTimeout(() => setResult(null), 2000);
  };

  const handleStart = async () => {
    // Check deps first — open wizard if missing
    try {
      const [docker, running, image] = await Promise.all([
        invoke<DepCheck>("check_docker_installed"),
        invoke<DepCheck>("check_docker_running"),
        invoke<DepCheck>("check_opentts_image"),
      ]);
      if (!docker.ok || !running.ok || !image.ok) {
        setWizardOpen(true);
        return;
      }
    } catch {
      // If check fails, try starting anyway
    }

    setStatus("starting");
    setServerStatus("starting");
    try {
      await invoke("opentts_start");
      showResult("Started");
      setServerStatus("running");
    } catch (e) {
      showResult("Error");
      setServerStatus("idle");
      console.error("OpenTTS start error:", e);
    } finally {
      setStatus("idle");
    }
  };

  return (
    <>
      <Group gap="xs">
        <PasswordInput
          w="14rem"
          placeholder="http://localhost:5500"
          value={tempUrl}
          onChange={(e) => setTempUrl(e.currentTarget.value)}
          onBlur={() => setUrl(tempUrl)}
          visible
        />
        <Button
          size="xs"
          variant="light"
          color={result === "Started" ? "green" : undefined}
          loading={status === "starting"}
          onClick={handleStart}
        >
          {result === "Started" ? "Started" : "Start"}
        </Button>
        <Button
          size="xs"
          variant="light"
          color={result === "Stopped" ? "orange" : undefined}
          loading={status === "stopping"}
          onClick={async () => {
            setStatus("stopping");
            setServerStatus("idle");
            try {
              await invoke("opentts_stop");
              showResult("Stopped");
            } catch (e) {
              showResult("Error");
              console.error("OpenTTS stop error:", e);
            } finally {
              setStatus("idle");
            }
          }}
        >
          {result === "Stopped" ? "Stopped" : "Stop"}
        </Button>
      </Group>
      <TTSSetupWizard
        opened={wizardOpen}
        onClose={() => setWizardOpen(false)}
        provider="opentts"
        onReady={handleStart}
      />
    </>
  );
}

export function TTSVoiceSelect() {
  const [voiceId, setVoiceId] = useAtom(ttsVoiceIdAtom);
  const [apiKey] = useAtom(ttsApiKeyAtom);
  const [provider] = useAtom(ttsProviderAtom);
  const [language] = useAtom(ttsLanguageAtom);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [loading, setLoading] = useState(false);

  // OpenTTS state
  const [openTTSUrl] = useAtom(ttsOpenTTSUrlAtom);
  const [openTTSVoice, setOpenTTSVoice] = useAtom(ttsOpenTTSVoiceAtom);
  const [openTTSVoices, setOpenTTSVoices] = useState<OpenTTSVoice[]>([]);

  // System TTS state
  const [systemVoice, setSystemVoice] = useAtom(ttsSystemVoiceAtom);
  const [systemVoices, setSystemVoices] = useState<SystemVoice[]>([]);

  // KittenTTS state
  const [kittenVoice, setKittenVoice] = useAtom(ttsKittenTTSVoiceAtom);

  const fetchVoices = useCallback(async () => {
    if (provider === "system") {
      setLoading(true);
      try {
        const v = await listSystemVoices();
        setSystemVoices(v);
      } catch (e) {
        console.error("Failed to fetch system voices:", e);
        setSystemVoices([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (provider === "opentts") {
      if (!openTTSUrl) return;
      setLoading(true);
      try {
        const v = await listOpenTTSVoices(openTTSUrl, language);
        setOpenTTSVoices(v);
      } catch (e) {
        console.error("Failed to fetch OpenTTS voices:", e);
        setOpenTTSVoices([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!apiKey || provider !== "elevenlabs") return;
    setLoading(true);
    try {
      const v = await listVoices(apiKey);
      setVoices(v);
    } catch (e) {
      console.error("Failed to fetch voices:", e);
    } finally {
      setLoading(false);
    }
  }, [apiKey, provider, openTTSUrl, language]);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const [gender, setGender] = useAtom(ttsGoogleGenderAtom);
  const testPhrase = getTestPhrase(language);

  if (provider === "system") {
    const sysVoiceOptions = systemVoices.map((v) => ({
      value: v.id,
      label: `${v.name} (${v.language})`,
    }));

    return (
      <Group gap="xs">
        <Select
          w="20rem"
          data={sysVoiceOptions}
          value={systemVoice}
          onChange={(v) => v && setSystemVoice(v)}
          placeholder={loading ? "Loading voices..." : "Select voice"}
          searchable
        />
        <Button
          size="xs"
          variant="light"
          onClick={() => {
            speakText(testPhrase);
          }}
        >
          Test
        </Button>
      </Group>
    );
  }

  if (provider === "kittentts") {
    const kittenVoiceOptions = KITTENTTS_VOICES.map((v) => ({
      value: v.id,
      label: v.label,
    }));

    return (
      <Group gap="xs">
        <Select
          w="12rem"
          data={kittenVoiceOptions}
          value={kittenVoice}
          onChange={(v) => v && setKittenVoice(v)}
          allowDeselect={false}
        />
        <Button
          size="xs"
          variant="light"
          onClick={() => {
            speakText(testPhrase);
          }}
        >
          Test
        </Button>
      </Group>
    );
  }

  if (provider === "opentts") {
    const voiceOptions = openTTSVoices.map((v) => ({
      value: v.id,
      label: `${v.name} (${v.tts_name})`,
    }));

    return (
      <Group gap="xs">
        <Select
          w="20rem"
          data={voiceOptions}
          value={openTTSVoice}
          onChange={(v) => v && setOpenTTSVoice(v)}
          placeholder={loading ? "Loading voices..." : "Select voice"}
          searchable
          disabled={!openTTSUrl}
        />
        <Button
          size="xs"
          variant="light"
          disabled={!openTTSVoice}
          onClick={() => {
            speakText(testPhrase);
          }}
        >
          Test
        </Button>
      </Group>
    );
  }

  if (provider === "google") {
    return (
      <Group gap="xs">
        <Select
          w="10rem"
          data={[
            { value: "MALE", label: "Male" },
            { value: "FEMALE", label: "Female" },
          ]}
          value={gender}
          onChange={(v) => v && setGender(v)}
          allowDeselect={false}
        />
        <Button
          size="xs"
          variant="light"
          onClick={() => {
            speakText(testPhrase);
          }}
        >
          Test
        </Button>
      </Group>
    );
  }

  const voiceOptions = voices.map((v) => ({
    value: v.voice_id,
    label: `${v.name} (${v.category})`,
  }));

  return (
    <Group gap="xs">
      <Select
        w="20rem"
        data={voiceOptions}
        value={voiceId}
        onChange={(v) => v && setVoiceId(v)}
        placeholder={loading ? "Loading voices..." : "Select voice"}
        searchable
        disabled={!apiKey}
      />
      <Button
        size="xs"
        variant="light"
        disabled={!apiKey || !voiceId}
        onClick={() => {
          speakText(testPhrase);
        }}
      >
        Test
      </Button>
    </Group>
  );
}

const TTS_TEST_PHRASES: Record<string, string> = {
  en: "Knight to f3, check. A strong developing move.",
  fr: "Cavalier f3, échec. Un coup de développement fort qui contrôle le centre.",
  es: "Caballo f3, jaque. Un fuerte movimiento de desarrollo que controla el centro.",
  de: "Springer f3, Schach. Ein starker Entwicklungszug, der das Zentrum kontrolliert.",
  ja: "ナイト f3、チェック。センターを支配する強い展開の手。",
  ru: "Конь f3, шах. Сильный развивающий ход, контролирующий центр.",
  zh: "马 f3，将军。一步控制中心的强力出子。",
  ko: "나이트 f3, 체크. 중앙을 지배하는 강력한 전개 수.",
};

function getTestPhrase(lang: string): string {
  return TTS_TEST_PHRASES[lang] || TTS_TEST_PHRASES.en;
}

const TTS_LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "ru", label: "Русский" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
];

export function TTSLanguageSelect() {
  const [language, setLanguage] = useAtom(ttsLanguageAtom);

  return (
    <Select
      w="12rem"
      data={TTS_LANGUAGE_OPTIONS}
      value={language}
      onChange={(v) => v && setLanguage(v)}
      allowDeselect={false}
    />
  );
}

export function TTSClearCacheButton() {
  const [cleared, setCleared] = useState(false);

  return (
    <Button
      size="xs"
      variant="light"
      color={cleared ? "green" : undefined}
      onClick={() => {
        stopSpeaking();
        clearAudioCache();
        setCleared(true);
        setTimeout(() => setCleared(false), 2000);
      }}
    >
      {cleared ? "Cache Cleared" : "Clear Audio Cache"}
    </Button>
  );
}

export function TTSVolumeSlider() {
  const [volume, setVolume] = useAtom(ttsVolumeAtom);
  const [tempVolume, setTempVolume] = useState(volume * 100);

  useEffect(() => {
    setTempVolume(volume * 100);
  }, [volume]);

  return (
    <Slider
      min={0}
      max={100}
      marks={[
        { value: 20, label: "20%" },
        { value: 50, label: "50%" },
        { value: 80, label: "80%" },
      ]}
      w="15rem"
      value={tempVolume}
      onChange={(value) => {
        setTempVolume(value as number);
      }}
      onChangeEnd={(value) => {
        setVolume(value / 100);
        speakText("Volume set.").catch(() => {});
      }}
    />
  );
}

export function TTSSpeedSlider() {
  const [speed, setSpeed] = useAtom(ttsSpeedAtom);
  const [tempSpeed, setTempSpeed] = useState(speed * 100);

  useEffect(() => {
    setTempSpeed(speed * 100);
  }, [speed]);

  return (
    <Slider
      min={50}
      max={200}
      step={5}
      marks={[
        { value: 75, label: "0.75x" },
        { value: 100, label: "1x" },
        { value: 150, label: "1.5x" },
      ]}
      w="15rem"
      value={tempSpeed}
      onChange={(value) => {
        setTempSpeed(value as number);
      }}
      onChangeEnd={(value) => {
        setSpeed(value / 100);
        speakText("Speed set.").catch(() => {});
      }}
    />
  );
}

export function TTSKittenTTSThreadsInput() {
  const [threads, setThreads] = useAtom(ttsKittenTTSThreadsAtom);

  return (
    <Group gap="xs" align="center">
      <NumberInput
        w="6rem"
        min={0}
        max={256}
        value={threads}
        onChange={(v) => setThreads(typeof v === "number" ? v : 0)}
      />
      <Text size="xs" c="dimmed">
        0 = auto (PyTorch default, ~4 threads). Restart server to apply.
      </Text>
    </Group>
  );
}
