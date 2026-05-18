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

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

// dashboard.sarvam.ai:
//   px-tatva-12 py-tatva-8 border-b border-tatva-border
//   bg-tatva-background-primary sticky top-0 z-10 flex-shrink-0
export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACE[4],
        paddingTop: SPACE[8],    // 16px — py-tatva-8
        paddingBottom: SPACE[8], // 16px — py-tatva-8
        paddingLeft: SPACE[12],  // 24px — px-tatva-12
        paddingRight: SPACE[12],
        borderBottom: `1px solid ${COLORS.border.DEFAULT}`,
        backgroundColor: COLORS.surface,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
        minHeight: 70,
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: FONTS.display,         // Season Mix
            fontSize: FONT_SIZE.xl,            // 20px per Sarvam
            fontWeight: FONT_WEIGHT.medium,    // 500
            color: COLORS.ink[900],            // rgb(20,20,20)
            letterSpacing: LETTER_SPACING.tight,
            lineHeight: LINE_HEIGHT.tight,     // 24px / 20px = 1.2
            margin: 0,
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
      {action}
    </header>
  );
}
