import { Code2, Settings as SettingsIcon } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Switch from '../../../components/ui/Switch';
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
} from '../../../constants';

type Props = {
  errorDemo: boolean;
  onErrorDemoChange: (v: boolean) => void;
  settingsOpen: boolean;
  onSettingsToggle: () => void;
};

/**
 * Sticky page header — title + Error demo toggle + settings gear + Get Code.
 * The gear toggles the right-hand Chat Settings sidebar.
 */
export default function InferenceHeader({
  errorDemo,
  onErrorDemoChange,
  settingsOpen,
  onSettingsToggle,
}: Props) {
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

      <button
        type="button"
        onClick={onSettingsToggle}
        aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
        aria-pressed={settingsOpen}
        title="Chat settings"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: SPACE[18],
          height: SPACE[18],
          borderRadius: RADIUS.pill,
          border: `1px solid ${settingsOpen ? COLORS.border.strong : 'transparent'}`,
          backgroundColor: settingsOpen ? COLORS.cream[300] : 'transparent',
          color: COLORS.ink[700],
          cursor: 'pointer',
          transition: 'background-color 120ms, border-color 120ms',
        }}
        className="hover:bg-tatva-surface-secondary focus-visible:outline-none focus-visible:ring-2"
      >
        <SettingsIcon
          size={ICON.feature}
          strokeWidth={ICON.strokeWidth}
          aria-hidden
        />
      </button>

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
