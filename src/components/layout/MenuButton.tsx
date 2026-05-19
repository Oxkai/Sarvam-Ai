import { useState } from 'react';
import { COLORS, ICON, RADIUS, SPACE } from '../../constants';
import { SidebarToggleIcon } from '../../icons';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useLayout } from './LayoutContext';

/**
 * Mobile-only hamburger that opens the sidebar drawer. Renders nothing on
 * desktop so page headers can drop this in unconditionally.
 */
export default function MenuButton() {
  const isMobile = useIsMobile();
  const { openMobile } = useLayout();
  const [hover, setHover] = useState(false);

  if (!isMobile) return null;

  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={openMobile}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: SPACE[18],
        height: SPACE[18],
        borderRadius: RADIUS.pill,
        border: 'none',
        background: hover ? COLORS.cream[200] : 'transparent',
        color: COLORS.ink[900],
        cursor: 'pointer',
        transition: 'background-color 120ms',
      }}
      className="focus-visible:outline-none focus-visible:ring-2"
    >
      <SidebarToggleIcon size={ICON.nav} strokeWidth={ICON.strokeWidth} />
    </button>
  );
}
