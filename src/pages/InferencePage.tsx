import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Code2,
  Mic,
  MicOff,
  Square,
  ArrowUp,
  RotateCcw,
  AlertCircle,
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  Sparkles,
  Trash2,
  Settings,
  X,
  Info,
} from 'lucide-react';
import Layout from '../components/shared/Layout';
import Button from '../components/shared/Button';
import Dropdown from '../components/shared/Dropdown';
import SegmentedControl from '../components/shared/SegmentedControl';
import Switch from '../components/shared/Switch';
import AccentOrb from '../components/shared/AccentOrb';
import { useStream } from '../hooks/useStream';
import { useStreamMetrics } from '../hooks/useStreamMetrics';
import { useAudioRecording } from '../hooks/useAudioRecording';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  FONT_WEIGHT,
  ICON,
  LETTER_SPACING,
  LINE_HEIGHT,
  RADIUS,
  SPACE,
} from '../constants';

type InputMode = 'text' | 'audio';

const ERROR_AT = 0.45;

const MODELS = [
  { value: 'Sarvam 30B', description: 'Fast & efficient' },
  { value: 'Sarvam 105B', description: 'Best quality, deeper reasoning' },
];

const CONTEXT_WINDOWS = [
  { value: '32K', description: 'Lower latency' },
  { value: '64K', description: 'Balanced' },
  { value: '128K', description: 'Long documents' },
];

const REASONING_EFFORTS = [
  { value: 'Low', description: 'Quickest replies' },
  { value: 'Medium', description: 'Balanced quality and speed' },
  { value: 'High', description: 'Deepest reasoning' },
];

type ModelHue = 'lavender' | 'peach' | 'rose' | 'mint' | 'sand' | 'sky';

const MODEL_HUES: Record<string, ModelHue> = {
  'Sarvam 30B': 'mint',
  'Sarvam 105B': 'lavender',
};

function hueForModel(model: string): ModelHue {
  return MODEL_HUES[model] ?? 'lavender';
}

const EXAMPLE_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: 'Platform features',
    prompt: 'What are the key features of the Sarvam AI inference platform?',
  },
  {
    label: 'Indic tokenisation',
    prompt: 'Explain how the Sarvam tokeniser handles Indic scripts like Devanagari and Tamil.',
  },
  {
    label: 'Speculative decoding',
    prompt: 'Summarise speculative decoding in two sentences.',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InferencePage() {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [prompt, setPrompt] = useState('');
  const [errorDemo, setErrorDemo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [model, setModel] = useState('Sarvam 105B');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contextWindow, setContextWindow] = useState('128K');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [temperature, setTemperature] = useState(0.8);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [reasoningEffort, setReasoningEffort] = useState('Medium');

  const stream = useStream();
  const metrics = useStreamMetrics();
  const audio = useAudioRecording();

  stream.setOnToken(metrics.recordToken);

  const isStreaming = stream.status === 'streaming';
  const hasOutput = stream.output.length > 0;
  const promptText = inputMode === 'audio' ? audio.transcript : prompt;
  const canRun = !isStreaming && promptText.trim().length > 0;

  useEffect(() => {
    if (!isStreaming) return;
    const start = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      setElapsed((performance.now() - start) / 1000);
    }, 100);
    return () => window.clearInterval(id);
  }, [isStreaming]);

  useEffect(() => {
    if (audio.transcript) setPrompt(audio.transcript);
  }, [audio.transcript]);

  const handleStart = useCallback(async () => {
    if (!promptText.trim()) return;
    metrics.resetMetrics();
    await stream.start(promptText, errorDemo ? ERROR_AT : null);
  }, [promptText, errorDemo, metrics, stream]);

  const handleStop = useCallback(() => stream.stop(), [stream]);

  const handleReset = useCallback(() => {
    stream.reset();
    metrics.resetMetrics();
    setPrompt('');
    audio.resetRecording();
  }, [stream, metrics, audio]);

  const handleCopy = useCallback(() => {
    if (!stream.output) return;
    navigator.clipboard.writeText(stream.output).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }, [stream.output]);

  // Esc anywhere stops a running stream
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isStreaming) handleStop();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isStreaming, handleStop]);

  return (
    <Layout>
      <PageHeader
        errorDemo={errorDemo}
        onErrorDemoChange={setErrorDemo}
        settingsOpen={settingsOpen}
        onSettingsToggle={() => setSettingsOpen((o) => !o)}
      />

      <div
        style={{ display: 'flex', flex: 1, minHeight: 0 }}
      >
        <div
          className="flex-col md:flex-row"
          style={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0 }}
        >
          <PromptColumn
            inputMode={inputMode}
            onModeChange={setInputMode}
            prompt={prompt}
            onPromptChange={setPrompt}
            audio={audio}
            isStreaming={isStreaming}
            canRun={canRun}
            onRun={handleStart}
            onStop={handleStop}
            model={model}
            onModelChange={setModel}
          />

          <OutputColumn
            status={stream.status}
            output={stream.output}
            errorMessage={stream.error}
            tokenCount={metrics.tokenCount}
            tokensPerSecond={metrics.tokensPerSecond}
            elapsed={elapsed}
            isStreaming={isStreaming}
            hasOutput={hasOutput}
            copied={copied}
            onCopy={handleCopy}
            onRegenerate={handleStart}
            onReset={handleReset}
            model={model}
          />
        </div>

        <ChatSettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          model={model}
          onModelChange={setModel}
          contextWindow={contextWindow}
          onContextWindowChange={setContextWindow}
          systemInstructions={systemInstructions}
          onSystemInstructionsChange={setSystemInstructions}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          maxTokens={maxTokens}
          onMaxTokensChange={setMaxTokens}
          reasoningEffort={reasoningEffort}
          onReasoningEffortChange={setReasoningEffort}
        />
      </div>
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// Sticky page header
// ---------------------------------------------------------------------------

function PageHeader({
  errorDemo,
  onErrorDemoChange,
  settingsOpen,
  onSettingsToggle,
}: {
  errorDemo: boolean;
  onErrorDemoChange: (v: boolean) => void;
  settingsOpen: boolean;
  onSettingsToggle: () => void;
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACE[6],
        paddingTop: SPACE[8],
        paddingBottom: SPACE[8],
        paddingLeft: SPACE[12],
        paddingRight: SPACE[12],
        borderBottom: `1px solid ${COLORS.border.DEFAULT}`,
        backgroundColor: COLORS.surface,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: FONTS.display,
            fontSize: FONT_SIZE.xl,
            fontWeight: FONT_WEIGHT.medium,
            color: COLORS.ink[900],
            letterSpacing: LETTER_SPACING.tight,
            lineHeight: LINE_HEIGHT.tight,
          }}
        >
          Inference Playground
        </h2>
        <p
          style={{
            margin: 0,
            marginTop: SPACE[2],
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.md,
            color: COLORS.ink[600],
            lineHeight: LINE_HEIGHT.relaxed,
          }}
        >
          Token-by-token streaming with live metrics
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
        <span
          style={{
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.sm,
            color: COLORS.ink[600],
            lineHeight: LINE_HEIGHT.tight,
          }}
        >
          Error demo
        </span>
        <Switch
          checked={errorDemo}
          onChange={onErrorDemoChange}
          ariaLabel="Simulate a mid-stream error"
        />
      </div>

      <Button
        variant="outlined"
        size="sm"
        leftIcon={<Code2 size={ICON.button} strokeWidth={ICON.strokeWidth} aria-hidden />}
      >
        Get Code
      </Button>

      <button
        type="button"
        onClick={onSettingsToggle}
        aria-label="Chat settings"
        aria-pressed={settingsOpen}
        title="Chat settings"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: SPACE[18],
          height: SPACE[18],
          borderRadius: RADIUS.pill,
          border: 'none',
          backgroundColor: settingsOpen ? COLORS.cream[300] : COLORS.cream[200],
          color: COLORS.ink[800],
          cursor: 'pointer',
          transition: 'background-color 120ms',
        }}
        className="hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
      >
        <Settings size={ICON.button} strokeWidth={ICON.strokeWidth} aria-hidden />
      </button>
    </header>
  );
}

// ---------------------------------------------------------------------------
// LEFT — Prompt column
//   Zone 1: Mode selector + model badge
//   Zone 2: Input card (textarea OR audio surface) — submit button embedded
//   Zone 3: Contextual hint row (example chips / kbd hints)
// ---------------------------------------------------------------------------

function PromptColumn({
  inputMode,
  onModeChange,
  prompt,
  onPromptChange,
  audio,
  isStreaming,
  canRun,
  onRun,
  onStop,
  model,
  onModelChange,
}: {
  inputMode: InputMode;
  onModeChange: (m: InputMode) => void;
  prompt: string;
  onPromptChange: (v: string) => void;
  audio: ReturnType<typeof useAudioRecording>;
  isStreaming: boolean;
  canRun: boolean;
  onRun: () => void;
  onStop: () => void;
  model: string;
  onModelChange: (m: string) => void;
}) {
  const hasPrompt = prompt.trim().length > 0;

  return (
    <div
      className="w-full md:w-1/2"
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.surface,
        overflow: 'hidden',
        paddingLeft: SPACE[12],
        paddingRight: SPACE[6],
        paddingTop: SPACE[12],
        paddingBottom: SPACE[12],
        gap: SPACE[6],
      }}
    >
      {/* — Zone 1 — */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACE[3],
          minHeight: SPACE[18],
        }}
      >
        <SegmentedControl
          segments={[
            { id: 'text', label: 'Text' },
            { id: 'audio', label: 'Audio' },
          ]}
          activeId={inputMode}
          onChange={(id) => onModeChange(id as InputMode)}
        />
        <Dropdown
          value={model}
          options={MODELS}
          onChange={onModelChange}
          size="sm"
          fullWidth={false}
          leading={<AccentOrb hue={hueForModel(model)} size={14} />}
          menuMinWidth={140}
        />
      </div>

      {/* — Zone 2 — */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {inputMode === 'text' ? (
          <TextPromptCard
            value={prompt}
            onChange={onPromptChange}
            disabled={isStreaming}
            canRun={canRun}
            isStreaming={isStreaming}
            onRun={onRun}
            onStop={onStop}
          />
        ) : (
          <AudioPromptCard
            audio={audio}
            transcript={prompt}
            onTranscriptChange={onPromptChange}
            disabled={isStreaming}
            canRun={canRun}
            isStreaming={isStreaming}
            onRun={onRun}
            onStop={onStop}
          />
        )}
      </div>

      {/* — Zone 3 — */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: SPACE[18],
          gap: SPACE[3],
        }}
      >
        {inputMode === 'text' && !hasPrompt && !isStreaming ? (
          <ExampleChips onPick={onPromptChange} />
        ) : (
          <KeyboardHints isStreaming={isStreaming} />
        )}
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Text prompt card — embedded submit button (Sarvam Chat Completions pattern)
// ---------------------------------------------------------------------------

function TextPromptCard({
  value,
  onChange,
  disabled,
  canRun,
  isStreaming,
  onRun,
  onStop,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  canRun: boolean;
  isStreaming: boolean;
  onRun: () => void;
  onStop: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canRun) onRun();
    }
  }

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.surfaceMuted,
        border: `1px solid ${COLORS.border.DEFAULT}`,
        borderRadius: 24,
        overflow: 'hidden',
        minHeight: 0,
      }}
      onClick={() => ref.current?.focus()}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="What's on your mind?"
        disabled={disabled}
        aria-label="Prompt"
        autoFocus
        className="scrollbar-hide"
        style={{
          flex: 1,
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          paddingLeft: SPACE[10],
          paddingRight: SPACE[10],
          paddingTop: SPACE[10],
          paddingBottom: SPACE[24], // room for the embedded controls
          fontFamily: FONTS.sans,
          fontSize: FONT_SIZE.md,
          fontWeight: FONT_WEIGHT.regular,
          lineHeight: 2,
          color: COLORS.ink[900],
          boxSizing: 'border-box',
          minHeight: 0,
        }}
      />

      {/* Char count strip with gradient fade — pointer-events stays off so clicks fall through to the textarea */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SPACE[24],
          display: 'flex',
          alignItems: 'center',
          paddingLeft: SPACE[10],
          paddingRight: SPACE[20],
          background: `linear-gradient(to bottom, transparent, ${COLORS.surfaceMuted} 60%)`,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: FONT_SIZE.xs,
            color: COLORS.ink[500],
            letterSpacing: LETTER_SPACING.wide,
            pointerEvents: 'auto',
          }}
        >
          {value.length} chars
        </span>
      </div>

      {/* Submit / Stop — positioned with explicit corner offsets */}
      <div
        style={{
          position: 'absolute',
          bottom: SPACE[4],
          right: SPACE[4],
          pointerEvents: 'auto',
        }}
      >
        {isStreaming ? (
          <RoundActionButton onClick={onStop} ariaLabel="Stop (Esc)" title="Stop (Esc)">
            <Square size={16} strokeWidth={ICON.strokeWidth} aria-hidden fill={COLORS.surface} />
          </RoundActionButton>
        ) : (
          <RoundActionButton onClick={onRun} disabled={!canRun} ariaLabel="Generate (⌘↵)" title="Generate (⌘↵)">
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden />
          </RoundActionButton>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Round 40px action button — primary submit affordance
// ---------------------------------------------------------------------------

function RoundActionButton({
  children,
  onClick,
  disabled,
  ariaLabel,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  title?: string;
}) {
  const bg = disabled ? COLORS.ink[300] : COLORS.ink[900];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: bg,
        color: COLORS.surface,
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.18)',
        transition: 'background-color 120ms, transform 120ms, box-shadow 120ms',
      }}
      className="hover:opacity-95 active:scale-95 focus-visible:outline-none focus-visible:ring-2"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Audio prompt card — same shell, embedded submit when transcript is ready
// ---------------------------------------------------------------------------

function AudioPromptCard({
  audio,
  transcript,
  onTranscriptChange,
  disabled,
  canRun,
  isStreaming,
  onRun,
  onStop,
}: {
  audio: ReturnType<typeof useAudioRecording>;
  transcript: string;
  onTranscriptChange: (v: string) => void;
  disabled: boolean;
  canRun: boolean;
  isStreaming: boolean;
  onRun: () => void;
  onStop: () => void;
}) {
  const [duration, setDuration] = useState(0);
  const isRecording = audio.recordingState === 'recording';
  const isProcessing = audio.recordingState === 'processing';
  const hasTranscript = transcript.trim().length > 0;

  useEffect(() => {
    if (!isRecording) {
      setDuration(0);
      return;
    }
    const start = performance.now();
    const id = window.setInterval(() => {
      setDuration((performance.now() - start) / 1000);
    }, 100);
    return () => window.clearInterval(id);
  }, [isRecording]);

  // Editable transcript view — same embedded-submit pattern as text mode
  if (hasTranscript && !isRecording && !isProcessing) {
    return (
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: COLORS.surfaceMuted,
          border: `1px solid ${COLORS.border.DEFAULT}`,
          borderRadius: 24,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* "From audio" badge top-left */}
        <div
          style={{
            position: 'absolute',
            top: SPACE[6],
            left: SPACE[6],
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACE[2],
            paddingLeft: SPACE[3],
            paddingRight: SPACE[3],
            paddingTop: SPACE[1],
            paddingBottom: SPACE[1],
            borderRadius: RADIUS.pill,
            backgroundColor: COLORS.cream[200],
            zIndex: 5,
          }}
        >
          <Mic size={11} strokeWidth={ICON.strokeWidth} aria-hidden style={{ color: COLORS.ink[600] }} />
          <span style={{ fontFamily: FONTS.sans, fontSize: FONT_SIZE.xs, color: COLORS.ink[600] }}>
            From audio
          </span>
        </div>

        {/* Re-record button top-right */}
        <button
          type="button"
          onClick={() => {
            audio.resetRecording();
            onTranscriptChange('');
          }}
          disabled={disabled}
          style={{
            position: 'absolute',
            top: SPACE[6],
            right: SPACE[6],
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACE[2],
            paddingLeft: SPACE[3],
            paddingRight: SPACE[3],
            paddingTop: SPACE[1],
            paddingBottom: SPACE[1],
            borderRadius: RADIUS.pill,
            border: 'none',
            backgroundColor: COLORS.cream[300],
            color: COLORS.ink[900],
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.xs,
            cursor: 'pointer',
            zIndex: 5,
          }}
          className="hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
        >
          <RotateCcw size={11} strokeWidth={ICON.strokeWidth} aria-hidden />
          Re-record
        </button>

        <textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          aria-label="Transcript"
          className="scrollbar-hide"
          style={{
            flex: 1,
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            paddingLeft: SPACE[10],
            paddingRight: SPACE[10],
            paddingTop: SPACE[24],
            paddingBottom: SPACE[24],
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.md,
            lineHeight: 2,
            color: COLORS.ink[900],
            boxSizing: 'border-box',
            minHeight: 0,
          }}
        />

        {/* Char count strip with gradient fade */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: SPACE[24],
            display: 'flex',
            alignItems: 'center',
            paddingLeft: SPACE[10],
            paddingRight: SPACE[20],
            background: `linear-gradient(to bottom, transparent, ${COLORS.surfaceMuted} 60%)`,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZE.xs,
              color: COLORS.ink[500],
              letterSpacing: LETTER_SPACING.wide,
              pointerEvents: 'auto',
            }}
          >
            {transcript.length} chars
          </span>
        </div>

        {/* Submit / Stop — explicit corner offsets */}
        <div
          style={{
            position: 'absolute',
            bottom: SPACE[4],
            right: SPACE[4],
            pointerEvents: 'auto',
          }}
        >
          {isStreaming ? (
            <RoundActionButton onClick={onStop} ariaLabel="Stop (Esc)">
              <Square size={16} strokeWidth={ICON.strokeWidth} aria-hidden fill={COLORS.surface} />
            </RoundActionButton>
          ) : (
            <RoundActionButton onClick={onRun} disabled={!canRun} ariaLabel="Generate (⌘↵)">
              <ArrowUp size={18} strokeWidth={2.5} aria-hidden />
            </RoundActionButton>
          )}
        </div>
      </div>
    );
  }

  // Recording / idle / processing — centered mic surface
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE[8],
        backgroundColor: COLORS.surfaceMuted,
        border: `1px solid ${COLORS.border.DEFAULT}`,
        borderRadius: 24,
        padding: SPACE[12],
        minHeight: 0,
      }}
    >
      <button
        type="button"
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        aria-pressed={isRecording}
        disabled={isProcessing || !audio.isSupported || disabled}
        onClick={isRecording ? audio.stopRecording : audio.startRecording}
        style={{
          position: 'relative',
          width: 88,
          height: 88,
          borderRadius: '50%',
          border: 'none',
          cursor: audio.isSupported && !isProcessing && !disabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isRecording
            ? COLORS.danger
            : `radial-gradient(circle at 30% 30%, ${COLORS.ink[700]}, ${COLORS.ink[900]} 70%)`,
          color: COLORS.surface,
          boxShadow: isRecording
            ? `0 0 0 10px ${COLORS.dangerBg}`
            : '0 6px 18px rgba(0,0,0,0.16)',
          transition: 'box-shadow 200ms, background 200ms, transform 120ms',
        }}
        className="focus-visible:outline-none focus-visible:ring-2 active:scale-95"
      >
        {isRecording && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              border: `2px solid ${COLORS.danger}`,
              opacity: 0.4,
              animation: 'pulse 1.4s ease-out infinite',
            }}
          />
        )}
        {isProcessing ? (
          <Loader2 size={32} strokeWidth={ICON.strokeWidth} aria-hidden style={{ animation: 'spin 1s linear infinite' }} />
        ) : isRecording ? (
          <MicOff size={32} strokeWidth={ICON.strokeWidth} aria-hidden />
        ) : (
          <Mic size={32} strokeWidth={ICON.strokeWidth} aria-hidden />
        )}
      </button>

      {isRecording && <Waveform />}

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
        <p
          aria-live="polite"
          style={{
            margin: 0,
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.md,
            color: isRecording ? COLORS.danger : COLORS.ink[800],
            lineHeight: LINE_HEIGHT.tight,
          }}
        >
          {!audio.isSupported
            ? 'Microphone not supported in this browser'
            : isRecording
            ? 'Recording — click again to stop'
            : isProcessing
            ? 'Transcribing audio…'
            : audio.error
            ? audio.error
            : 'Click to record your prompt'}
        </p>
        {isRecording && (
          <p
            style={{
              margin: 0,
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZE.xs,
              color: COLORS.ink[500],
              letterSpacing: LETTER_SPACING.wide,
            }}
          >
            {duration.toFixed(1)}s
          </p>
        )}
      </div>
    </div>
  );
}

function Waveform() {
  return (
    <div
      aria-hidden
      style={{ display: 'flex', alignItems: 'center', gap: SPACE[2], height: 32 }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: 3,
            height: '100%',
            borderRadius: 2,
            backgroundColor: COLORS.ink[800],
            animation: `wave 1.1s ease-in-out ${i * 0.09}s infinite`,
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Example chips (zone 3 when text mode is empty)
// ---------------------------------------------------------------------------

function ExampleChips({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div
      className="scrollbar-hide"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACE[2],
        overflowX: 'auto',
        flex: 1,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.sans,
          fontSize: FONT_SIZE.xs,
          color: COLORS.ink[500],
          flexShrink: 0,
        }}
      >
        Try:
      </span>
      {EXAMPLE_PROMPTS.map(({ label, prompt }) => (
        <button
          key={label}
          type="button"
          onClick={() => onPick(prompt)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACE[2],
            paddingLeft: SPACE[4],
            paddingRight: SPACE[4],
            paddingTop: SPACE[2],
            paddingBottom: SPACE[2],
            borderRadius: RADIUS.pill,
            border: `1px solid ${COLORS.border.DEFAULT}`,
            backgroundColor: COLORS.surface,
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.xs,
            color: COLORS.ink[700],
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'background-color 120ms, border-color 120ms',
          }}
          className="hover:bg-tatva-surface-secondary focus-visible:outline-none focus-visible:ring-2"
        >
          <Sparkles size={11} strokeWidth={ICON.strokeWidth} aria-hidden style={{ color: COLORS.ink[500] }} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyboard hints row (zone 3 when typing / streaming)
// ---------------------------------------------------------------------------

function KeyboardHints({ isStreaming }: { isStreaming: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
        <Kbd>⌘</Kbd>
        <span style={{ fontSize: FONT_SIZE.xs, color: COLORS.ink[500] }}>+</span>
        <Kbd>↵</Kbd>
        <span style={{ fontFamily: FONTS.sans, fontSize: FONT_SIZE.xs, color: COLORS.ink[500] }}>
          to run
        </span>
      </div>
      {isStreaming && (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
          <Kbd>Esc</Kbd>
          <span style={{ fontFamily: FONTS.sans, fontSize: FONT_SIZE.xs, color: COLORS.ink[500] }}>
            to stop
          </span>
        </div>
      )}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 20,
        paddingLeft: 5,
        paddingRight: 5,
        borderRadius: 5,
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border.strong}`,
        fontFamily: FONTS.mono,
        fontSize: 11,
        color: COLORS.ink[700],
        lineHeight: 1,
        boxShadow: '0 1px 1px rgba(0,0,0,0.04)',
      }}
    >
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// RIGHT — Output column
// ---------------------------------------------------------------------------

function OutputColumn({
  status,
  output,
  errorMessage,
  tokenCount,
  tokensPerSecond,
  elapsed,
  isStreaming,
  hasOutput,
  copied,
  onCopy,
  onRegenerate,
  onReset,
  model,
}: {
  status: string;
  output: string;
  errorMessage: string | null;
  tokenCount: number;
  tokensPerSecond: number;
  elapsed: number;
  isStreaming: boolean;
  hasOutput: boolean;
  copied: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onReset: () => void;
  model: string;
}) {
  const hasInteracted = isStreaming || status === 'done' || status === 'error';

  return (
    <div
      className="w-full md:w-1/2"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        paddingLeft: SPACE[6],
        paddingRight: SPACE[12],
        paddingTop: SPACE[12],
        paddingBottom: SPACE[12],
        gap: SPACE[6],
      }}
    >
      {/* — Zone 1: status + metrics — only when interacted — */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACE[3],
          minHeight: SPACE[18],
        }}
      >
        {hasInteracted ? (
          <>
            {(status === 'streaming' || status === 'error') && <StatusPill status={status} />}
            <div style={{ marginLeft: 'auto' }}>
              <MetricsText
                tokenCount={tokenCount}
                tokensPerSecond={tokensPerSecond}
                isStreaming={isStreaming}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* — Zone 2: output surface — */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {!hasInteracted && !hasOutput ? (
          <EmptyOutputState hue={hueForModel(model)} />
        ) : (
          <OutputCard output={output} isStreaming={isStreaming} hasOutput={hasOutput} />
        )}
      </div>

      {/* — Zone 3: actions / status row — */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACE[4],
          minHeight: SPACE[18],
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
          {hasInteracted && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
                <AccentOrb hue={hueForModel(model)} size={12} />
                <span style={{ fontFamily: FONTS.sans, fontSize: FONT_SIZE.xs, color: COLORS.ink[600] }}>
                  {model}
                </span>
              </div>
              <span style={{ width: 1, height: 12, backgroundColor: COLORS.border.strong }} />
              <span
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: FONT_SIZE.xs,
                  color: COLORS.ink[500],
                }}
              >
                {elapsed.toFixed(1)}s
              </span>
            </>
          )}
        </div>

        {hasOutput && !isStreaming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
            <IconActionButton ariaLabel="Helpful">
              <ThumbsUp size={14} strokeWidth={ICON.strokeWidth} aria-hidden />
            </IconActionButton>
            <IconActionButton ariaLabel="Not helpful">
              <ThumbsDown size={14} strokeWidth={ICON.strokeWidth} aria-hidden />
            </IconActionButton>
            <IconActionButton ariaLabel="Regenerate" onClick={onRegenerate}>
              <RotateCcw size={14} strokeWidth={ICON.strokeWidth} aria-hidden />
            </IconActionButton>
            <IconActionButton ariaLabel={copied ? 'Copied' : 'Copy output'} onClick={onCopy}>
              {copied ? (
                <Check size={14} strokeWidth={ICON.strokeWidth} aria-hidden style={{ color: COLORS.success }} />
              ) : (
                <Copy size={14} strokeWidth={ICON.strokeWidth} aria-hidden />
              )}
            </IconActionButton>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              leftIcon={<Trash2 size={ICON.button} strokeWidth={ICON.strokeWidth} aria-hidden />}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {status === 'error' && errorMessage && <ErrorBanner message={errorMessage} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Output card with inline streaming cursor
// ---------------------------------------------------------------------------

function OutputCard({
  output,
  isStreaming,
  hasOutput,
}: {
  output: string;
  isStreaming: boolean;
  hasOutput: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [output]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.surfaceMuted,
        border: `1px solid ${COLORS.border.DEFAULT}`,
        borderRadius: 24,
        overflow: 'hidden',
        minHeight: 0,
        position: 'relative',
      }}
    >
      <div
        ref={scrollRef}
        className="scrollbar-hide"
        role="region"
        aria-label="Model output"
        aria-live="polite"
        aria-atomic="false"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: SPACE[10],
        }}
      >
        {hasOutput ? (
          <p
            style={{
              margin: 0,
              fontFamily: FONTS.sans,
              fontSize: FONT_SIZE.md,
              fontWeight: FONT_WEIGHT.regular,
              lineHeight: 2,
              color: COLORS.ink[900],
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {output}
            {isStreaming && (
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: '1em',
                  marginLeft: 2,
                  verticalAlign: '-2px',
                  backgroundColor: COLORS.ink[900],
                  animation: 'blink 1s step-start infinite',
                }}
              />
            )}
          </p>
        ) : (
          <p
            style={{
              margin: 0,
              fontFamily: FONTS.sans,
              fontSize: FONT_SIZE.md,
              color: COLORS.ink[500],
              fontStyle: 'italic',
            }}
          >
            Waiting for first token…
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty output state
// ---------------------------------------------------------------------------

function EmptyOutputState({ hue }: { hue: ModelHue }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE[8],
        backgroundColor: COLORS.surfaceMuted,
        border: `1px solid ${COLORS.border.DEFAULT}`,
        borderRadius: 24,
        padding: SPACE[12],
        minHeight: 0,
        textAlign: 'center',
      }}
    >
      <AccentOrb hue={hue} size={72} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3], maxWidth: 360 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: FONTS.display,
            fontSize: FONT_SIZE.xl,
            fontWeight: FONT_WEIGHT.medium,
            color: COLORS.ink[900],
            letterSpacing: LETTER_SPACING.tight,
            lineHeight: LINE_HEIGHT.tight,
          }}
        >
          Ready when you are
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.sm,
            color: COLORS.ink[600],
            lineHeight: LINE_HEIGHT.relaxed,
          }}
        >
          Type a prompt on the left and press the send button to stream the response token-by-token.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Atomic pills
// ---------------------------------------------------------------------------

function MetricsText({
  tokenCount,
  tokensPerSecond,
  isStreaming,
}: {
  tokenCount: number;
  tokensPerSecond: number;
  isStreaming: boolean;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: SPACE[2],
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZE.sm,
        lineHeight: LINE_HEIGHT.tight,
      }}
    >
      <span style={{ fontWeight: FONT_WEIGHT.medium, color: COLORS.ink[900] }}>{tokenCount}</span>
      <span style={{ color: COLORS.ink[500] }}>tokens</span>
      <span style={{ color: COLORS.ink[300], paddingLeft: 2, paddingRight: 2 }}>·</span>
      <span style={{ fontWeight: FONT_WEIGHT.medium, color: COLORS.ink[900] }}>
        {isStreaming ? tokensPerSecond.toFixed(1) : '—'}
      </span>
      <span style={{ color: COLORS.ink[500] }}>tok/s</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string; dot?: boolean }> = {
    streaming: { label: 'Streaming', bg: COLORS.successBg, color: COLORS.success, dot: true },
    done: { label: 'Done', bg: COLORS.cream[200], color: COLORS.ink[700] },
    error: { label: 'Error', bg: COLORS.dangerBg, color: COLORS.danger },
    idle: { label: 'Idle', bg: COLORS.cream[200], color: COLORS.ink[500] },
  };
  const pill = map[status] ?? map['idle'];

  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACE[2],
        paddingLeft: SPACE[4],
        paddingRight: SPACE[4],
        paddingTop: SPACE[2],
        paddingBottom: SPACE[2],
        borderRadius: RADIUS.pill,
        backgroundColor: pill.bg,
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.medium,
        color: pill.color,
        letterSpacing: LETTER_SPACING.wide,
        textTransform: 'uppercase',
      }}
    >
      {pill.dot && (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: pill.color,
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      )}
      {pill.label}
    </span>
  );
}

function IconActionButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      title={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: SPACE[18],
        height: SPACE[18],
        borderRadius: RADIUS.pill,
        border: `1px solid ${COLORS.border.DEFAULT}`,
        backgroundColor: COLORS.surface,
        color: COLORS.ink[700],
        cursor: 'pointer',
        transition: 'background-color 120ms, border-color 120ms',
      }}
      className="hover:bg-tatva-surface-secondary focus-visible:outline-none focus-visible:ring-2"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Error banner
// ---------------------------------------------------------------------------

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: SPACE[4],
        padding: `${SPACE[4]} ${SPACE[6]}`,
        backgroundColor: COLORS.dangerBg,
        borderRadius: RADIUS.md,
        border: `1px solid ${COLORS.danger}33`,
      }}
    >
      <AlertCircle
        size={16}
        strokeWidth={ICON.strokeWidth}
        aria-hidden
        style={{ color: COLORS.danger, marginTop: 2, flexShrink: 0 }}
      />
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.medium,
            color: COLORS.danger,
          }}
        >
          Stream interrupted — partial output preserved
        </p>
        <p
          style={{
            margin: 0,
            marginTop: 2,
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.xs,
            color: COLORS.danger,
            opacity: 0.85,
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Settings — slide-in panel on the right edge of the playground
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 340;

function ChatSettingsPanel({
  open,
  onClose,
  model,
  onModelChange,
  contextWindow,
  onContextWindowChange,
  systemInstructions,
  onSystemInstructionsChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  reasoningEffort,
  onReasoningEffortChange,
}: {
  open: boolean;
  onClose: () => void;
  model: string;
  onModelChange: (m: string) => void;
  contextWindow: string;
  onContextWindowChange: (v: string) => void;
  systemInstructions: string;
  onSystemInstructionsChange: (v: string) => void;
  temperature: number;
  onTemperatureChange: (v: number) => void;
  maxTokens: number;
  onMaxTokensChange: (v: number) => void;
  reasoningEffort: string;
  onReasoningEffortChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: open ? PANEL_WIDTH : 0,
        overflow: 'hidden',
        transition: 'width 240ms ease',
      }}
      aria-hidden={!open}
    >
    <aside
      role="complementary"
      aria-label="Chat settings"
      style={{
        width: PANEL_WIDTH,
        height: '100%',
        backgroundColor: COLORS.surface,
        borderLeft: `1px solid ${COLORS.border.DEFAULT}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: SPACE[8],
          paddingRight: SPACE[8],
          paddingTop: SPACE[8],
          paddingBottom: SPACE[6],
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.lg,
            fontWeight: FONT_WEIGHT.medium,
            color: COLORS.ink[900],
            letterSpacing: LETTER_SPACING.normal,
            lineHeight: LINE_HEIGHT.tight,
          }}
        >
          Chat Settings
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: SPACE[18],
            height: SPACE[18],
            borderRadius: RADIUS.pill,
            border: 'none',
            backgroundColor: 'transparent',
            color: COLORS.ink[800],
            cursor: 'pointer',
          }}
          className="hover:bg-tatva-surface-secondary focus-visible:outline-none focus-visible:ring-2"
        >
          <X size={16} strokeWidth={ICON.strokeWidth} aria-hidden />
        </button>
      </div>

      {/* Body */}
      <div
        className="scrollbar-hide"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingLeft: SPACE[8],
          paddingRight: SPACE[8],
          paddingBottom: SPACE[8],
          paddingTop: SPACE[8],
          display: 'flex',
          flexDirection: 'column',
          gap: SPACE[10],
        }}
      >
        <SettingField label="Model">
          <Dropdown
            value={model}
            options={MODELS}
            onChange={onModelChange}
            size="sm"
            leading={<AccentOrb hue={hueForModel(model)} size={14} />}
          />
        </SettingField>

        <SettingField label="Context window">
          <Dropdown
            value={contextWindow}
            options={CONTEXT_WINDOWS}
            onChange={onContextWindowChange}
            size="sm"
          />
        </SettingField>

        <SettingField label="System instructions">
          <textarea
            value={systemInstructions}
            onChange={(e) => onSystemInstructionsChange(e.target.value)}
            placeholder="You are a helpful assistant…"
            rows={3}
            className="scrollbar-hide"
            style={{
              width: '100%',
              minHeight: SPACE[20],
              paddingLeft: SPACE[6],
              paddingRight: SPACE[6],
              paddingTop: SPACE[4],
              paddingBottom: SPACE[4],
              borderRadius: RADIUS.md,
              border: `1px solid ${COLORS.border.DEFAULT}`,
              backgroundColor: 'transparent',
              fontFamily: FONTS.sans,
              fontSize: FONT_SIZE.md,
              color: COLORS.ink[900],
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </SettingField>

        <SliderField
          label="Temperature"
          value={temperature}
          min={0}
          max={2}
          step={0.1}
          decimals={1}
          inputSize={4}
          minLabel="Precise"
          maxLabel="Creative"
          onChange={onTemperatureChange}
        />

        <SliderField
          label="Max tokens"
          value={maxTokens}
          min={1}
          max={4096}
          step={1}
          decimals={0}
          inputSize={5}
          minLabel="1"
          maxLabel="4,096"
          onChange={onMaxTokensChange}
        />

        <SettingField label="Reasoning effort">
          <Dropdown
            value={reasoningEffort}
            options={REASONING_EFFORTS}
            onChange={onReasoningEffortChange}
            size="sm"
          />
        </SettingField>
      </div>
    </aside>
    </div>
  );
}

function SettingField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[1] }}>
        <label
          style={{
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.regular,
            color: COLORS.ink[900],
            lineHeight: LINE_HEIGHT.tight,
          }}
        >
          {label}
        </label>
        <Info
          size={12}
          strokeWidth={ICON.strokeWidth}
          aria-hidden
          style={{ color: COLORS.ink[500] }}
        />
      </div>
      {children}
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  decimals,
  inputSize,
  minLabel,
  maxLabel,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  inputSize: number;
  minLabel: string;
  maxLabel: string;
  onChange: (v: number) => void;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const filledPct = ((value - min) / (max - min)) * 100;
  const display = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[1] }}>
        <label
          style={{
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.regular,
            color: COLORS.ink[900],
            lineHeight: LINE_HEIGHT.tight,
          }}
        >
          {label}
        </label>
        <Info
          size={12}
          strokeWidth={ICON.strokeWidth}
          aria-hidden
          style={{ color: COLORS.ink[500] }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[6] }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', height: SPACE[10] }}>
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              transform: 'translateY(-50%)',
              height: SPACE[4],
              borderRadius: RADIUS.pill,
              backgroundColor: COLORS.cream[200],
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                display: 'block',
                height: '100%',
                width: `${filledPct}%`,
                backgroundColor: COLORS.ink[400],
              }}
            />
          </span>
          <input
            type="range"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={label}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
            }}
          />
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: `calc(${filledPct}% - 12px)`,
              transform: 'translateY(-50%)',
              width: SPACE[12],
              height: SPACE[8],
              borderRadius: RADIUS.pill,
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border.strong}`,
              boxShadow: '0px 0px 18px 0px rgba(0,0,0,0.08)',
              pointerEvents: 'none',
            }}
          />
        </div>
        <input
          size={inputSize}
          type="text"
          value={display}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          aria-label={`${label} value`}
          style={{
            height: SPACE[12],
            minWidth: SPACE[12],
            paddingLeft: SPACE[4],
            paddingRight: SPACE[4],
            borderRadius: RADIUS.md,
            border: `1px solid ${COLORS.border.DEFAULT}`,
            backgroundColor: COLORS.surface,
            textAlign: 'center',
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.md,
            color: COLORS.ink[900],
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: FONTS.sans, fontSize: FONT_SIZE.xs, color: COLORS.ink[500] }}>
          {minLabel}
        </span>
        <span style={{ fontFamily: FONTS.sans, fontSize: FONT_SIZE.xs, color: COLORS.ink[500] }}>
          {maxLabel}
        </span>
      </div>
    </div>
  );
}
