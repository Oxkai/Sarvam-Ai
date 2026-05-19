import { NavLink } from 'react-router-dom';
import {
  Mic,
  Languages,
  Sparkles,
  FileText,
  ExternalLink,
  ArrowRight,
  Zap,
  GitCompare,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  FONT_WEIGHT,
  ICON,
  LINE_HEIGHT,
  RADIUS,
  SPACE,
  SIZE,
} from '../../constants';
import { SidebarToggleIcon, HomeIcon } from '../../icons';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useLayout } from './LayoutContext';

// ---------------------------------------------------------------------------
// Sidebar — desktop: inline 240px rail with collapse-to-64 toggle.
//           mobile:  fixed off-canvas drawer (translate-x), opens via menu
//                    button in page headers, closes via toggle / backdrop / route change.
// ---------------------------------------------------------------------------

const COLLAPSED_WIDTH = 64;
const MOBILE_WIDTH = 280;

type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean };

const iconProps = {
  size: ICON.nav,
  strokeWidth: ICON.strokeWidth,
  'aria-hidden': true as const,
};

const PLAYGROUND_ITEMS: NavItem[] = [
  { to: '/inference', label: 'Inference Playground', icon: <Zap {...iconProps} /> },
  { to: '/diff', label: 'Model Output Diff', icon: <GitCompare {...iconProps} /> },
];

const MORE_ITEMS: NavItem[] = [
  { to: '/playground', label: 'Speech to Text', icon: <Mic {...iconProps} /> },
  { to: '/translate', label: 'Translate', icon: <Languages {...iconProps} /> },
  { to: '/vision', label: 'Vision', icon: <Sparkles {...iconProps} /> },
];

export default function Sidebar() {
  const isMobile = useIsMobile();
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useLayout();
  // On mobile the sidebar is always at "expanded" width inside the drawer —
  // collapsed-rail mode is desktop-only.
  const effectiveCollapsed = isMobile ? false : collapsed;

  const baseStyle: React.CSSProperties = {
    width: isMobile
      ? MOBILE_WIDTH
      : effectiveCollapsed
        ? COLLAPSED_WIDTH
        : SIZE.sidebarWidth,
    flexShrink: 0,
    paddingLeft: SPACE[6],
    paddingRight: SPACE[6],
    backgroundColor: COLORS.surfaceMuted,
    fontFamily: FONTS.sans,
    color: COLORS.ink[700],
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    transition: isMobile
      ? 'transform 220ms ease'
      : 'width 200ms ease',
    overflow: 'hidden',
  };

  const mobileStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        boxShadow: mobileOpen ? '0 10px 30px rgba(0,0,0,0.25)' : 'none',
      }
    : {};

  return (
    <aside
      aria-label="Primary"
      aria-hidden={isMobile && !mobileOpen}
      style={{ ...baseStyle, ...mobileStyle }}
    >
      <LogoRow
        isMobile={isMobile}
        collapsed={effectiveCollapsed}
        onToggle={isMobile ? closeMobile : toggleCollapsed}
        toggleLabel={isMobile ? 'Close menu' : effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      />

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div
          style={{
            height: '100%',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingTop: SPACE[6],
            paddingBottom: SPACE[6],
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[10] }}>
            <div>
              <NavRow
                to="/"
                label="Home"
                icon={<HomeIcon {...iconProps} />}
                collapsed={effectiveCollapsed}
                end
              />
            </div>

            <NavGroup
              label="Playground"
              items={PLAYGROUND_ITEMS}
              collapsed={effectiveCollapsed}
            />
            <NavGroup
              label="More"
              items={MORE_ITEMS}
              collapsed={effectiveCollapsed}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          paddingTop: SPACE[6],
          paddingBottom: SPACE[6],
          marginTop: 'auto',
        }}
      >
        <DocumentationLink collapsed={effectiveCollapsed} />
      </div>

      <div style={{ flexShrink: 0 }}>
        <div style={{ paddingTop: SPACE[4], paddingBottom: SPACE[4] }}>
          <SignInRow collapsed={effectiveCollapsed} />
        </div>
      </div>
    </aside>
  );
}

// ---- Logo row ------------------------------------------------------------

function LogoRow({
  isMobile,
  collapsed,
  onToggle,
  toggleLabel,
}: {
  isMobile: boolean;
  collapsed: boolean;
  onToggle: () => void;
  toggleLabel: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  // Wordmark hidden when the desktop rail is collapsed; always shown on mobile.
  const showWordmark = isMobile || !collapsed;

  return (
    <div style={{ paddingTop: SPACE[6], paddingBottom: SPACE[6] }}>
      <div
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: showWordmark ? 'space-between' : 'center',
          paddingTop: SPACE[4],
          paddingBottom: SPACE[4],
        }}
      >
        {showWordmark && (
          <div
            style={{
              display: 'flex',
              height: 40,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: SPACE[6],
                paddingRight: SPACE[6],
              }}
            >
              {imgFailed ? (
                <span
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: FONT_SIZE.wordmark,
                    fontWeight: FONT_WEIGHT.regular,
                    color: COLORS.ink[700],
                    lineHeight: LINE_HEIGHT.normal,
                  }}
                >
                  sarvam
                </span>
              ) : (
                <img
                  src="/sarvam.png"
                  alt="Sarvam"
                  onError={() => setImgFailed(true)}
                  style={{
                    height: SPACE[8],
                    width: 'auto',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              )}
            </div>
          </div>
        )}
        <CollapseButton onClick={onToggle} label={toggleLabel} expanded={!collapsed} />
      </div>
    </div>
  );
}

function CollapseButton({
  onClick,
  label,
  expanded,
}: {
  onClick: () => void;
  label: string;
  expanded: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: SPACE[18],
        minWidth: SPACE[18],
        borderRadius: RADIUS.pill,
        background: hover ? COLORS.cream[200] : 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: COLORS.ink[900],
        transition: 'background-color 120ms',
        flexShrink: 0,
      }}
    >
      <SidebarToggleIcon size={ICON.nav} strokeWidth={ICON.strokeWidth} />
    </button>
  );
}

// ---- Nav group -----------------------------------------------------------

function NavGroup({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[4] }}>
      {!collapsed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: SPACE[6],
            paddingRight: SPACE[6],
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: FONT_SIZE.md,
              fontWeight: FONT_WEIGHT.regular,
              lineHeight: LINE_HEIGHT.relaxed,
              color: COLORS.ink[500],
            }}
          >
            {label}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
        {items.map((item) => (
          <NavRow key={item.label} {...item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}

// ---- Nav row -------------------------------------------------------------

function NavRow({
  to,
  label,
  icon,
  end,
  collapsed,
}: NavItem & { collapsed: boolean }) {
  const [hover, setHover] = useState(false);

  const rowStyle = (isActive: boolean) =>
    ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: SPACE[4],
      height: SPACE[18],
      paddingLeft: collapsed ? 0 : SPACE[6],
      paddingRight: collapsed ? 0 : SPACE[6],
      borderRadius: RADIUS.pill,
      backgroundColor: isActive
        ? COLORS.cream[300]
        : hover
          ? COLORS.cream[200]
          : 'transparent',
      color: isActive ? COLORS.ink[900] : COLORS.ink[600],
      textDecoration: 'none',
      transition: 'background-color 200ms, padding 200ms',
    }) as const;

  const labelStyle = {
    margin: 0,
    fontFamily: FONTS.sans,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: LINE_HEIGHT.relaxed,
    color: 'inherit',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  };

  const content = () => (
    <>
      <span
        style={{ display: 'inline-flex', flexShrink: 0 }}
        title={collapsed ? label : undefined}
      >
        {icon}
      </span>
      {!collapsed && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={labelStyle}>{label}</p>
        </div>
      )}
    </>
  );

  return (
    <NavLink
      to={to}
      end={end}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="focus-visible:outline-none focus-visible:ring-2"
      style={({ isActive }) => rowStyle(isActive)}
      title={collapsed ? label : undefined}
    >
      {content()}
    </NavLink>
  );
}

// ---- Documentation -------------------------------------------------------

function DocumentationLink({ collapsed }: { collapsed: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href="https://docs.sarvam.ai"
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={collapsed ? 'Documentation' : undefined}
      className="group focus-visible:outline-none focus-visible:ring-2"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: SPACE[4],
        height: SPACE[18],
        paddingLeft: collapsed ? 0 : SPACE[6],
        paddingRight: collapsed ? 0 : SPACE[6],
        borderRadius: RADIUS.pill,
        backgroundColor: hover ? COLORS.cream[200] : 'transparent',
        color: COLORS.ink[600],
        textDecoration: 'none',
        transition: 'background-color 200ms, padding 200ms',
      }}
    >
      <FileText {...iconProps} />
      {!collapsed && (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: SPACE[4],
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: FONTS.sans,
              fontSize: FONT_SIZE.md,
              fontWeight: FONT_WEIGHT.regular,
              lineHeight: LINE_HEIGHT.relaxed,
              color: 'inherit',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Documentation
          </p>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              opacity: hover ? 1 : 0,
              transition: 'opacity 120ms',
              color: COLORS.ink[600],
            }}
          >
            <ExternalLink
              size={ICON.nav}
              strokeWidth={ICON.strokeWidth}
              aria-hidden
            />
          </div>
        </div>
      )}
    </a>
  );
}

// ---- Sign-in -------------------------------------------------------------

function SignInRow({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      type="button"
      title={collapsed ? 'Sign in' : undefined}
      className="focus-visible:outline-none focus-visible:ring-2 hover:opacity-90"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE[2],
        width: '100%',
        minHeight: SPACE[22],
        paddingLeft: collapsed ? 0 : SPACE[8],
        paddingRight: collapsed ? 0 : SPACE[8],
        border: 'none',
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.ink[900],
        color: COLORS.surface,
        cursor: 'pointer',
        fontFamily: FONTS.sans,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.regular,
        lineHeight: 1,
        transition: 'opacity 120ms, padding 200ms',
      }}
    >
      {collapsed ? (
        <ArrowRight
          size={ICON.button}
          strokeWidth={ICON.strokeWidth}
          aria-hidden
        />
      ) : (
        <>Sign in →</>
      )}
    </button>
  );
}
