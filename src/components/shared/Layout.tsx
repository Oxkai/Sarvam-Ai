import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { COLORS, FONTS, RADIUS, SPACE } from '../../constants';

export default function Layout({ children }: { children: ReactNode }) {
  const inset = SPACE[4]; // 8px gap between sidebar and white panel

  return (
    <div
      className="flex h-svh max-h-svh w-full max-w-full overflow-hidden"
      style={{
        backgroundColor: COLORS.surfaceMuted,
        fontFamily: FONTS.sans,
        // Matches dashboard.sarvam.ai DOM: rgb(51, 51, 51). Headings override to ink[900].
        color: COLORS.ink[700],
      }}
    >
      <Sidebar />
      <main
        className="flex-1 min-w-0 overflow-hidden"
        style={{
          paddingTop: inset,
          paddingRight: inset,
          paddingBottom: inset,
        }}
      >
        <div
          className="h-full overflow-y-auto"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border.DEFAULT}`,
            borderRadius: RADIUS.lg, // rounded-tatva-lg — matches dashboard.sarvam.ai main panel
            display: 'flex',
            flexDirection: 'column',
            // Flex column so child pages can use `flex: 1` + justifyContent
            // to fill remaining space (Vision empty state needs this).
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
