import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Code2,
  Plus,
  Minus,
  Equal,
  Square,
  Copy,
  Pencil,
  Eye,
  Check,
  EyeOff,
  AlertCircle,
  ArrowLeftRight,
  ArrowUp,
} from 'lucide-react';
import Layout from '../components/shared/Layout';
import Button from '../components/shared/Button';
import Dropdown from '../components/shared/Dropdown';
import SegmentedControl from '../components/shared/SegmentedControl';
import AccentOrb from '../components/shared/AccentOrb';
import {
  tokenize,
  diffTokens,
  computeStats,
  foldUnchanged,
  isWhitespace,
  type RenderOp,
} from '../lib/diff';
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

// ---------------------------------------------------------------------------
// Demo fixtures
// ---------------------------------------------------------------------------

const SAMPLE_PROMPT = 'What are the key features of the Sarvam AI inference platform?';

const SAMPLE_OUTPUT_A = `Sarvam AI provides state-of-the-art language models optimised for Indian languages. The platform supports eleven major Indian languages including Hindi, Bengali, Tamil, and Telugu.

Our models handle Devanagari and Dravidian scripts natively. The inference engine is built for low latency, making it suitable for voice assistants and customer support bots.

Prompt caching and batched inference are supported out of the box.`;

const SAMPLE_OUTPUT_B = `Sarvam AI delivers state-of-the-art foundation models built for Indian languages. The platform supports twelve major Indian languages including Hindi, Bengali, Tamil, Telugu, and Marathi.

Our models handle Devanagari, Dravidian, and Perso-Arabic scripts natively. The inference engine is optimised for sub-second latency, making it ideal for voice assistants, conversational agents, and customer support bots.

Prompt caching, speculative decoding, and batched inference are all supported out of the box.`;

const MODELS = [
  { value: 'Sarvam 30B', description: 'Fast & efficient' },
  { value: 'Sarvam 105B', description: 'Best quality, deeper reasoning' },
];

type ModelHue = 'lavender' | 'peach' | 'rose' | 'mint' | 'sand' | 'sky';

const MODEL_HUES: Record<string, ModelHue> = {
  'Sarvam 30B': 'mint',
  'Sarvam 105B': 'lavender',
};

function hueForModel(model: string): ModelHue {
  return MODEL_HUES[model] ?? 'lavender';
}

const MODEL_RESPONSES: Record<string, string> = {
  'Sarvam 30B': SAMPLE_OUTPUT_A,
  'Sarvam 105B': SAMPLE_OUTPUT_B,
};

type ViewMode = 'split' | 'unified';

// ---------------------------------------------------------------------------
// Mock streaming generator (Fetch + ReadableStream contract, same as Task 1)
// ---------------------------------------------------------------------------

function createTokenStream(text: string, signal: AbortSignal): ReadableStream<string> {
  const tokens = text.match(/\s+|\S+/g) ?? [];
  let idx = 0;

  return new ReadableStream<string>({
    start(controller) {
      function push() {
        if (signal.aborted || idx >= tokens.length) {
          controller.close();
          return;
        }
        controller.enqueue(tokens[idx++]);
        setTimeout(push, 18 + Math.random() * 38);
      }
      push();
    },
    cancel() {
      idx = tokens.length;
    },
  });
}

async function streamInto(
  text: string,
  signal: AbortSignal,
  onToken: (chunk: string) => void,
): Promise<void> {
  const stream = createTokenStream(text, signal);
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done || value === undefined) break;
    onToken(value);
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DiffPage() {
  const [prompt, setPrompt] = useState(SAMPLE_PROMPT);
  const [outputA, setOutputA] = useState(SAMPLE_OUTPUT_A);
  const [outputB, setOutputB] = useState(SAMPLE_OUTPUT_B);
  const [modelA, setModelA] = useState('Sarvam 30B');
  const [modelB, setModelB] = useState('Sarvam 105B');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [changesOnly, setChangesOnly] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedSide, setCopiedSide] = useState<'A' | 'B' | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { ops, stats } = useMemo(() => {
    const a = tokenize(outputA);
    const b = tokenize(outputB);
    const ops = diffTokens(a, b);
    return { ops, stats: computeStats(ops) };
  }, [outputA, outputB]);

  const renderOps: RenderOp[] = useMemo(
    () => (changesOnly ? foldUnchanged(ops, 4) : ops),
    [ops, changesOnly],
  );

  const totalChanges = stats.added + stats.removed;
  const totalTokens = totalChanges + stats.unchanged;
  const changePct = totalTokens > 0 ? Math.round((totalChanges / totalTokens) * 100) : 0;

  const handleRun = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setOutputA('');
    setOutputB('');
    setIsRunning(true);

    const respA = MODEL_RESPONSES[modelA] ?? SAMPLE_OUTPUT_A;
    const respB = MODEL_RESPONSES[modelB] ?? SAMPLE_OUTPUT_B;

    try {
      await Promise.all([
        streamInto(respA, controller.signal, (chunk) => {
          setOutputA((prev) => prev + chunk);
        }),
        streamInto(respB, controller.signal, (chunk) => {
          setOutputB((prev) => prev + chunk);
        }),
      ]);
    } finally {
      setIsRunning(false);
    }
  }, [modelA, modelB]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
    setOutputA('');
    setOutputB('');
    setPrompt('');
    setChangesOnly(false);
  }, []);

  const handleCopy = useCallback(
    (side: 'A' | 'B') => {
      const text = side === 'A' ? outputA : outputB;
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        setCopiedSide(side);
        window.setTimeout(() => setCopiedSide(null), 1500);
      });
    },
    [outputA, outputB],
  );

  // Esc stops a running comparison; ⌘/Ctrl+Enter runs from anywhere
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isRunning) handleStop();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isRunning) {
        e.preventDefault();
        handleRun();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRunning, handleStop, handleRun]);

  return (
    <Layout>
      <PageHeader stats={stats} onReset={handleReset} />

      <ViewControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        changesOnly={changesOnly}
        onChangesOnlyChange={setChangesOnly}
        changeCount={totalChanges}
        changePct={changePct}
        isRunning={isRunning}
      />

      {/* Scrollable diff area */}
      <div
        className="scrollbar-hide"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
      >
        {viewMode === 'split' ? (
          <SplitView
            outputA={outputA}
            outputB={outputB}
            onOutputAChange={setOutputA}
            onOutputBChange={setOutputB}
            modelA={modelA}
            modelB={modelB}
            onModelAChange={setModelA}
            onModelBChange={setModelB}
            renderOps={renderOps}
            isRunning={isRunning}
            copiedSide={copiedSide}
            onCopy={handleCopy}
          />
        ) : (
          <UnifiedView
            renderOps={renderOps}
            modelA={modelA}
            modelB={modelB}
            isRunning={isRunning}
          />
        )}
      </div>

      <PromptPanel
        value={prompt}
        onChange={setPrompt}
        isRunning={isRunning}
        onRun={handleRun}
        onStop={handleStop}
      />
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// Sticky header
// ---------------------------------------------------------------------------

function PageHeader({
  stats,
  onReset,
}: {
  stats: { added: number; removed: number; unchanged: number };
  onReset: () => void;
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
          Model Output Diff
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
          Side-by-side token-level comparison of two model outputs
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
        <StatChip
          icon={<Plus size={11} strokeWidth={ICON.strokeWidth} aria-hidden />}
          value={stats.added}
          variant="add"
        />
        <StatChip
          icon={<Minus size={11} strokeWidth={ICON.strokeWidth} aria-hidden />}
          value={stats.removed}
          variant="remove"
        />
        <StatChip
          icon={<Equal size={11} strokeWidth={ICON.strokeWidth} aria-hidden />}
          value={stats.unchanged}
          variant="neutral"
        />
      </div>

      <Button
        variant="outlined"
        size="sm"
        onClick={onReset}
        leftIcon={<Plus size={ICON.button} strokeWidth={ICON.strokeWidth} aria-hidden />}
      >
        New Chat
      </Button>

      <Button
        variant="outlined"
        size="sm"
        leftIcon={<Code2 size={ICON.button} strokeWidth={ICON.strokeWidth} aria-hidden />}
      >
        Get Code
      </Button>
    </header>
  );
}

function StatChip({
  icon,
  value,
  variant,
}: {
  icon: React.ReactNode;
  value: number;
  variant: 'add' | 'remove' | 'neutral';
}) {
  const colors = {
    add: { bg: COLORS.successBg, fg: COLORS.success },
    remove: { bg: COLORS.dangerBg, fg: COLORS.danger },
    neutral: { bg: COLORS.cream[200], fg: COLORS.ink[600] },
  }[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACE[2],
        paddingLeft: SPACE[3],
        paddingRight: SPACE[3],
        paddingTop: SPACE[1],
        paddingBottom: SPACE[1],
        borderRadius: RADIUS.pill,
        backgroundColor: colors.bg,
        color: colors.fg,
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.medium,
        lineHeight: 1.4,
      }}
    >
      {icon}
      <span style={{ fontFamily: FONTS.mono, minWidth: 16, textAlign: 'right' }}>{value}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// View controls bar
// ---------------------------------------------------------------------------

function ViewControls({
  viewMode,
  onViewModeChange,
  changesOnly,
  onChangesOnlyChange,
  changeCount,
  changePct,
  isRunning,
}: {
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  changesOnly: boolean;
  onChangesOnlyChange: (v: boolean) => void;
  changeCount: number;
  changePct: number;
  isRunning: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACE[4],
        paddingLeft: SPACE[12],
        paddingRight: SPACE[12],
        paddingTop: SPACE[6],
        paddingBottom: SPACE[6],
        borderBottom: `1px solid ${COLORS.border.DEFAULT}`,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4], flexWrap: 'wrap' }}>
        <SegmentedControl
          segments={[
            { id: 'split', label: 'Side-by-side' },
            { id: 'unified', label: 'Unified' },
          ]}
          activeId={viewMode}
          onChange={(id) => onViewModeChange(id as ViewMode)}
        />
        <span
          style={{
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.sm,
            color: COLORS.ink[600],
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: SPACE[2],
          }}
        >
          <span style={{ fontWeight: FONT_WEIGHT.medium, color: COLORS.ink[900] }}>{changeCount}</span>
          changes
          <span style={{ color: COLORS.ink[300] }}>·</span>
          <span style={{ fontWeight: FONT_WEIGHT.medium, color: COLORS.ink[900] }}>{changePct}%</span>
          diff
        </span>
        {isRunning && <StreamingChip />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4] }}>
        <button
          type="button"
          onClick={() => onChangesOnlyChange(!changesOnly)}
          aria-pressed={changesOnly}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACE[2],
            paddingLeft: SPACE[4],
            paddingRight: SPACE[4],
            paddingTop: SPACE[2],
            paddingBottom: SPACE[2],
            borderRadius: RADIUS.pill,
            border: `1px solid ${changesOnly ? COLORS.ink[900] : COLORS.border.DEFAULT}`,
            backgroundColor: changesOnly ? COLORS.ink[900] : COLORS.surface,
            color: changesOnly ? COLORS.surface : COLORS.ink[700],
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.sm,
            cursor: 'pointer',
            transition: 'background-color 120ms, color 120ms, border-color 120ms',
          }}
          className="focus-visible:outline-none focus-visible:ring-2"
        >
          {changesOnly ? (
            <EyeOff size={12} strokeWidth={ICON.strokeWidth} aria-hidden />
          ) : (
            <Eye size={12} strokeWidth={ICON.strokeWidth} aria-hidden />
          )}
          Changes only
        </button>
        <Legend />
      </div>
    </div>
  );
}

function StreamingChip() {
  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACE[2],
        paddingLeft: SPACE[3],
        paddingRight: SPACE[3],
        paddingTop: SPACE[1],
        paddingBottom: SPACE[1],
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.successBg,
        color: COLORS.success,
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZE.xs,
        fontWeight: FONT_WEIGHT.medium,
        letterSpacing: LETTER_SPACING.wide,
        textTransform: 'uppercase',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: COLORS.success,
          animation: 'pulse 1.4s ease-in-out infinite',
        }}
      />
      Streaming
    </span>
  );
}

function Legend() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4] }}>
      <LegendDot color={COLORS.success} bg={COLORS.successBg} label="Added" />
      <LegendDot color={COLORS.danger} bg={COLORS.dangerBg} label="Removed" />
    </div>
  );
}

function LegendDot({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE[2] }}>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 12,
          height: 12,
          borderRadius: 3,
          backgroundColor: bg,
          border: `1px solid ${color}33`,
        }}
      />
      <span style={{ fontFamily: FONTS.sans, fontSize: FONT_SIZE.xs, color: COLORS.ink[600] }}>
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Split view
// ---------------------------------------------------------------------------

function SplitView({
  outputA,
  outputB,
  onOutputAChange,
  onOutputBChange,
  modelA,
  modelB,
  onModelAChange,
  onModelBChange,
  renderOps,
  isRunning,
  copiedSide,
  onCopy,
}: {
  outputA: string;
  outputB: string;
  onOutputAChange: (v: string) => void;
  onOutputBChange: (v: string) => void;
  modelA: string;
  modelB: string;
  onModelAChange: (v: string) => void;
  onModelBChange: (v: string) => void;
  renderOps: RenderOp[];
  isRunning: boolean;
  copiedSide: 'A' | 'B' | null;
  onCopy: (side: 'A' | 'B') => void;
}) {
  const opsA = renderOps.filter((o) => o.type !== 'insert');
  const opsB = renderOps.filter((o) => o.type !== 'delete');

  return (
    <div
      className="flex-col md:flex-row"
      style={{
        display: 'flex',
        height: '100%',
        boxSizing: 'border-box',
        paddingBottom: SPACE[8],
        minHeight: 0,
      }}
    >
      <DiffCardColumn
        side="A"
        model={modelA}
        onModelChange={onModelAChange}
        rawValue={outputA}
        onRawChange={onOutputAChange}
        ops={opsA}
        emptyOpType="delete"
        isRunning={isRunning}
        copied={copiedSide === 'A'}
        onCopy={() => onCopy('A')}
      />
      <DiffCardColumn
        side="B"
        model={modelB}
        onModelChange={onModelBChange}
        rawValue={outputB}
        onRawChange={onOutputBChange}
        ops={opsB}
        emptyOpType="insert"
        isRunning={isRunning}
        copied={copiedSide === 'B'}
        onCopy={() => onCopy('B')}
      />
    </div>
  );
}

function DiffCardColumn({
  side,
  model,
  onModelChange,
  rawValue,
  onRawChange,
  ops,
  emptyOpType,
  isRunning,
  copied,
  onCopy,
}: {
  side: 'A' | 'B';
  model: string;
  onModelChange: (v: string) => void;
  rawValue: string;
  onRawChange: (v: string) => void;
  ops: RenderOp[];
  emptyOpType: 'insert' | 'delete';
  isRunning: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const isLeft = side === 'A';
  const scrollRef = useRef<HTMLDivElement>(null);
  const hue = hueForModel(model);

  useEffect(() => {
    if (!isRunning || editing) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rawValue, isRunning, editing]);

  return (
    <div
      className="w-full md:w-1/2"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        paddingLeft: isLeft ? SPACE[12] : SPACE[6],
        paddingRight: isLeft ? SPACE[6] : SPACE[12],
        paddingTop: SPACE[6],
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 360,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: COLORS.surfaceMuted,
          border: `1px solid ${COLORS.border.DEFAULT}`,
          borderRadius: 24,
          overflow: 'hidden',
        }}
      >
        {/* Card header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: SPACE[3],
            paddingLeft: SPACE[6],
            paddingRight: SPACE[3],
            paddingTop: SPACE[3],
            paddingBottom: SPACE[3],
            borderBottom: `1px solid ${COLORS.border.DEFAULT}`,
            backgroundColor: COLORS.surface,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              minWidth: 0,
              opacity: isRunning ? 0.6 : 1,
              pointerEvents: isRunning ? 'none' : 'auto',
            }}
          >
            <Dropdown
              value={model}
              options={MODELS}
              onChange={onModelChange}
              size="sm"
              fullWidth={false}
              menuMinWidth={160}
              leading={<AccentOrb hue={hue} size={14} />}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
            <CardIconButton
              ariaLabel={copied ? 'Copied' : `Copy ${side}`}
              onClick={onCopy}
              disabled={!rawValue}
            >
              {copied ? (
                <Check size={13} strokeWidth={ICON.strokeWidth} aria-hidden style={{ color: COLORS.success }} />
              ) : (
                <Copy size={13} strokeWidth={ICON.strokeWidth} aria-hidden />
              )}
            </CardIconButton>
            <CardIconButton
              ariaLabel={editing ? 'View diff' : 'Edit output'}
              onClick={() => setEditing((e) => !e)}
              active={editing}
              disabled={isRunning}
            >
              {editing ? (
                <Eye size={13} strokeWidth={ICON.strokeWidth} aria-hidden />
              ) : (
                <Pencil size={13} strokeWidth={ICON.strokeWidth} aria-hidden />
              )}
            </CardIconButton>
          </div>
        </header>

        {editing ? (
          <textarea
            value={rawValue}
            onChange={(e) => onRawChange(e.target.value)}
            aria-label={`Model ${side} output`}
            className="scrollbar-hide"
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: SPACE[10],
              fontFamily: FONTS.sans,
              fontSize: FONT_SIZE.md,
              lineHeight: 2,
              color: COLORS.ink[900],
              boxSizing: 'border-box',
            }}
          />
        ) : !rawValue && !isRunning ? (
          <CardEmptyState hue={hue} side={side} />
        ) : (
          <DiffBody
            ops={ops}
            emptyOpType={emptyOpType}
            isStreaming={isRunning}
            scrollRef={scrollRef}
          />
        )}
      </div>
    </div>
  );
}

function CardEmptyState({ hue, side }: { hue: ModelHue; side: 'A' | 'B' }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE[6],
        padding: SPACE[12],
        textAlign: 'center',
      }}
    >
      <AccentOrb hue={hue} size={64} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2], maxWidth: 280 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: FONTS.display,
            fontSize: FONT_SIZE.lg,
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
          Output {side} will stream here once you Run.
        </p>
      </div>
    </div>
  );
}

function CardIconButton({
  children,
  onClick,
  ariaLabel,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: SPACE[16],
        height: SPACE[16],
        borderRadius: RADIUS.pill,
        border: `1px solid ${active ? COLORS.ink[900] : 'transparent'}`,
        backgroundColor: active ? COLORS.ink[900] : 'transparent',
        color: disabled
          ? COLORS.ink[300]
          : active
          ? COLORS.surface
          : COLORS.ink[700],
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 120ms, color 120ms, border-color 120ms',
      }}
      className="hover:bg-tatva-surface-secondary focus-visible:outline-none focus-visible:ring-2"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// DiffBody — renders ops with inline highlighting + live cursor + folds
// ---------------------------------------------------------------------------

function DiffBody({
  ops,
  emptyOpType,
  isStreaming,
  scrollRef,
}: {
  ops: RenderOp[];
  emptyOpType: 'insert' | 'delete';
  isStreaming: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const hasContent = ops.some(
    (o) => o.type === 'equal' || o.type === 'fold' || o.type !== emptyOpType,
  );

  return (
    <div
      ref={scrollRef}
      role="region"
      aria-label="Diff output"
      aria-live={isStreaming ? 'polite' : undefined}
      className="scrollbar-hide"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: SPACE[10],
        boxSizing: 'border-box',
      }}
    >
      {hasContent ? (
        <p
          style={{
            margin: 0,
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.md,
            lineHeight: 2,
            color: COLORS.ink[900],
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {ops.map((op, i) => (
            <TokenSpan key={i} op={op} />
          ))}
          {isStreaming && (
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 7,
                height: '1em',
                marginLeft: 2,
                verticalAlign: '-2px',
                backgroundColor: COLORS.ink[900],
                animation: 'blink 1s step-start infinite',
              }}
            />
          )}
        </p>
      ) : isStreaming ? (
        <p style={emptyStyle}>Streaming…</p>
      ) : (
        <p style={emptyStyle}>No content</p>
      )}
    </div>
  );
}

const emptyStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: FONTS.sans,
  fontSize: FONT_SIZE.sm,
  color: COLORS.ink[500],
  fontStyle: 'italic',
};

function TokenSpan({ op }: { op: RenderOp }) {
  if (op.type === 'fold') return <FoldMarker count={op.count} />;
  if (isWhitespace(op.token)) return <>{op.token}</>;
  if (op.type === 'equal') return <span>{op.token}</span>;

  const isAdd = op.type === 'insert';
  const colors = isAdd
    ? { bg: COLORS.successBg, fg: COLORS.success }
    : { bg: COLORS.dangerBg, fg: COLORS.danger };

  return (
    <span
      title={isAdd ? 'Added in B' : 'Only in A'}
      style={{
        backgroundColor: colors.bg,
        color: colors.fg,
        borderRadius: RADIUS.xs,
        paddingLeft: 3,
        paddingRight: 3,
        textDecoration: !isAdd ? 'line-through' : undefined,
        textDecorationThickness: !isAdd ? 1 : undefined,
        textDecorationColor: !isAdd ? `${COLORS.danger}99` : undefined,
        fontWeight: FONT_WEIGHT.medium,
      }}
    >
      {op.token}
    </span>
  );
}

function FoldMarker({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} unchanged tokens hidden`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACE[2],
        marginLeft: 4,
        marginRight: 4,
        paddingLeft: SPACE[3],
        paddingRight: SPACE[3],
        paddingTop: 1,
        paddingBottom: 1,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.cream[200],
        color: COLORS.ink[500],
        fontFamily: FONTS.mono,
        fontSize: FONT_SIZE.xs,
        letterSpacing: LETTER_SPACING.wide,
        verticalAlign: '1px',
        lineHeight: 1.4,
      }}
    >
      <AlertCircle size={10} strokeWidth={ICON.strokeWidth} aria-hidden style={{ color: COLORS.ink[400] }} />
      {count} unchanged
    </span>
  );
}

// ---------------------------------------------------------------------------
// Unified view
// ---------------------------------------------------------------------------

function UnifiedView({
  renderOps,
  modelA,
  modelB,
  isRunning,
}: {
  renderOps: RenderOp[];
  modelA: string;
  modelB: string;
  isRunning: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRunning) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [renderOps, isRunning]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        minHeight: 0,
        paddingLeft: SPACE[12],
        paddingRight: SPACE[12],
        paddingTop: SPACE[6],
        paddingBottom: SPACE[8],
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 360,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: COLORS.surfaceMuted,
          border: `1px solid ${COLORS.border.DEFAULT}`,
          borderRadius: 24,
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACE[6],
            paddingLeft: SPACE[6],
            paddingRight: SPACE[6],
            paddingTop: SPACE[3],
            paddingBottom: SPACE[3],
            borderBottom: `1px solid ${COLORS.border.DEFAULT}`,
            backgroundColor: COLORS.surface,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
            <AccentOrb hue={hueForModel(modelA)} size={16} />
            <span style={{ fontFamily: FONTS.sans, fontSize: FONT_SIZE.sm, color: COLORS.ink[700] }}>
              A · {modelA}
            </span>
          </div>
          <ArrowLeftRight size={14} strokeWidth={ICON.strokeWidth} aria-hidden style={{ color: COLORS.ink[400] }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
            <AccentOrb hue={hueForModel(modelB)} size={16} />
            <span style={{ fontFamily: FONTS.sans, fontSize: FONT_SIZE.sm, color: COLORS.ink[700] }}>
              B · {modelB}
            </span>
          </div>
        </header>

        <div
          ref={scrollRef}
          role="region"
          aria-label="Unified diff"
          aria-live={isRunning ? 'polite' : undefined}
          className="scrollbar-hide"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: SPACE[10],
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: FONTS.sans,
              fontSize: FONT_SIZE.md,
              lineHeight: 2,
              color: COLORS.ink[900],
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {renderOps.map((op, i) => (
              <TokenSpan key={i} op={op} />
            ))}
            {isRunning && (
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 7,
                  height: '1em',
                  marginLeft: 2,
                  verticalAlign: '-2px',
                  backgroundColor: COLORS.ink[900],
                  animation: 'blink 1s step-start infinite',
                }}
              />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prompt panel — sticky at the bottom, embedded Run/Stop button (Sarvam style)
// ---------------------------------------------------------------------------

function PromptPanel({
  value,
  onChange,
  isRunning,
  onRun,
  onStop,
}: {
  value: string;
  onChange: (v: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const canRun = !isRunning && value.trim().length > 0;

  return (
    <div
      style={{
        flexShrink: 0,
        paddingLeft: SPACE[12],
        paddingRight: SPACE[12],
        paddingTop: SPACE[6],
        paddingBottom: SPACE[10],
        borderTop: `1px solid ${COLORS.border.DEFAULT}`,
        backgroundColor: COLORS.surface,
      }}
    >
      <div
        onClick={() => ref.current?.focus()}
        style={{
          position: 'relative',
          backgroundColor: COLORS.surfaceMuted,
          border: `1px solid ${COLORS.border.DEFAULT}`,
          borderRadius: 24,
          overflow: 'hidden',
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              if (canRun) onRun();
            }
          }}
          placeholder="What's on your mind?"
          rows={2}
          aria-label="Prompt"
          className="scrollbar-hide"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            paddingLeft: SPACE[8],
            paddingRight: SPACE[20],
            paddingTop: SPACE[5],
            paddingBottom: SPACE[12],
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.md,
            lineHeight: LINE_HEIGHT.relaxed,
            color: COLORS.ink[900],
            boxSizing: 'border-box',
          }}
        />

        {/* Bottom controls — hint text in a fade strip, button positioned separately */}
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
            paddingLeft: SPACE[8],
            paddingRight: SPACE[20],
            background: `linear-gradient(to bottom, transparent, ${COLORS.surfaceMuted} 60%)`,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: FONT_SIZE.xs,
              color: COLORS.ink[500],
              pointerEvents: 'auto',
            }}
          >
            ⌘↵ to run · Esc to stop
          </span>
        </div>

        {/* Run / Stop button — positioned with explicit corner offsets */}
        <div
          style={{
            position: 'absolute',
            bottom: SPACE[4],
            right: SPACE[4],
            pointerEvents: 'auto',
          }}
        >
          {isRunning ? (
              <RoundRunButton onClick={onStop} ariaLabel="Stop (Esc)" title="Stop (Esc)">
                <Square size={16} strokeWidth={ICON.strokeWidth} aria-hidden fill={COLORS.surface} />
              </RoundRunButton>
            ) : (
              <RoundRunButton
                onClick={onRun}
                disabled={!canRun}
                ariaLabel="Run comparison (⌘↵)"
                title="Run comparison (⌘↵)"
              >
                <ArrowUp size={18} strokeWidth={2.5} aria-hidden />
              </RoundRunButton>
            )}
        </div>
      </div>
    </div>
  );
}

function RoundRunButton({
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

