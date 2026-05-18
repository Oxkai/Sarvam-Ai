import { Code2, Equal, Minus, Plus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  FONT_WEIGHT,
  ICON,
  LETTER_SPACING,
  LINE_HEIGHT,
  SPACE,
} from '../../../constants';
import type { DiffStats } from '../lib';
import StatChip from './StatChip';

type Props = {
  stats: DiffStats;
  onReset: () => void;
  /** Hide the +/-/= chips until the user has actually generated something. */
  showStats: boolean;
};

/** Sticky page header — title, stats summary, New Chat, Get Code. */
export default function DiffHeader({ stats, onReset, showStats }: Props) {
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

      {showStats && (
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
      )}

      <Button
        variant="outlined"
        size="sm"
        onClick={onReset}
        leftIcon={
          <Plus size={ICON.button} strokeWidth={ICON.strokeWidth} aria-hidden />
        }
      >
        New Chat
      </Button>

      <Button
        variant="outlined"
        size="sm"
        leftIcon={
          <Code2 size={ICON.button} strokeWidth={ICON.strokeWidth} aria-hidden />
        }
      >
        Get Code
      </Button>
    </header>
  );
}
