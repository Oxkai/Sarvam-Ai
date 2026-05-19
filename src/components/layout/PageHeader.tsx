import type { ReactNode } from 'react';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
  LINE_HEIGHT,
  SPACE,
} from '../../constants';
import { useIsMobile } from '../../hooks/useIsMobile';
import MenuButton from './MenuButton';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

// dashboard.sarvam.ai:
//   px-tatva-12 py-tatva-8 border-b border-tatva-border
//   bg-tatva-background-primary sticky top-0 z-10 flex-shrink-0
export default function PageHeader({ title, subtitle, action }: Props) {
  const isMobile = useIsMobile();
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACE[4],
        paddingTop: SPACE[8],
        paddingBottom: SPACE[8],
        paddingLeft: isMobile ? SPACE[6] : SPACE[12],
        paddingRight: isMobile ? SPACE[6] : SPACE[12],
        borderBottom: `1px solid ${COLORS.border.DEFAULT}`,
        backgroundColor: COLORS.surface,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
        minHeight: 70,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], minWidth: 0 }}>
        <MenuButton />
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: FONTS.display,
              fontSize: FONT_SIZE.xl,
              fontWeight: FONT_WEIGHT.medium,
              color: COLORS.ink[900],
              letterSpacing: LETTER_SPACING.tight,
              lineHeight: LINE_HEIGHT.tight,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: FONT_SIZE.sm,
                color: COLORS.ink[500],
                marginTop: SPACE[2],
                lineHeight: LINE_HEIGHT.relaxed,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </header>
  );
}
