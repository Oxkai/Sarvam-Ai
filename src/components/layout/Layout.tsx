import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LayoutContext } from './LayoutContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { COLORS, FONTS, RADIUS, SPACE } from '../../constants';

export default function Layout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  // 8px gutter on all sides; on desktop the left edge butts up against the
  // sidebar (no extra gap), on mobile we add it back since the sidebar is
  // off-canvas. Matches Sarvam's `p-tatva-4 md:pl-0` pattern.
  const inset = SPACE[4];
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), []);

  // Close the mobile drawer whenever the route changes (after the user picks
  // a nav item) so the page they land on is fully visible.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on route change
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the drawer is open so the page underneath doesn't
  // scroll along with the user's drag inside the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <LayoutContext.Provider
      value={{
        mobileOpen,
        openMobile,
        closeMobile,
        toggleMobile,
        collapsed,
        toggleCollapsed,
      }}
    >
      <div
        className="flex h-svh max-h-svh w-full max-w-full overflow-hidden"
        style={{
          backgroundColor: COLORS.surfaceMuted,
          fontFamily: FONTS.sans,
          color: COLORS.ink[700],
        }}
      >
        <Sidebar />
        {isMobile && mobileOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMobile}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              background: 'rgba(0,0,0,0.4)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              animation: 'fadeIn 160ms ease-out',
            }}
          />
        )}
        <main
          className="flex-1 min-w-0 flex flex-col"
          style={{
            paddingTop: inset,
            paddingRight: inset,
            paddingBottom: inset,
            paddingLeft: isMobile ? inset : 0,
          }}
        >
          <div
            className="flex-1 min-h-0 overflow-auto overflow-x-hidden"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border.DEFAULT}`,
              borderRadius: RADIUS.lg,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </LayoutContext.Provider>
  );
}
