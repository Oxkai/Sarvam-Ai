import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, AudioLines, Sparkles } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/layout/PageHeader';
import DashboardSection from '../../components/ui/DashboardSection';
import ListItem from '../../components/ui/ListItem';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
  LINE_HEIGHT,
  RADIUS,
  SPACE,
} from '../../constants';
import { useIsMobile } from '../../hooks/useIsMobile';

const INFERENCE_FEATURES = [
  {
    gradient: 'indigo' as const,
    title: 'Multi-modal input',
    description: 'Text prompt or live audio recording',
  },
  {
    gradient: 'mint' as const,
    title: 'Token-by-token streaming',
    description: 'Fetch + ReadableStream — no waiting for full response',
  },
  {
    gradient: 'peach' as const,
    title: 'Live metrics & resilience',
    description: 'Token count, tokens-per-second, mid-stream error recovery',
  },
];

const DIFF_FEATURES = [
  {
    gradient: 'sky' as const,
    title: 'Side-by-side & unified views',
    description: 'Compare two model versions at a glance',
  },
  {
    gradient: 'sand' as const,
    title: 'Token-level highlighting',
    description: 'Word-shaped diffs with added / removed chips',
  },
  {
    gradient: 'rose' as const,
    title: 'Hand-rolled LCS algorithm',
    description: 'O(n·m) time complexity, zero external libraries',
  },
];

// Sarvam-hosted avatar SVGs — same source the dashboard uses for its
// "Start building" cards. Mapping matches the official site so the green /
// pink / blue-orange ordering matches the design reference.
const STARTER_AVATARS = {
  green: 'https://dashboard.sarvam.ai/assets/voices/avatar-1.svg',
  pink: 'https://dashboard.sarvam.ai/assets/voices/avatar-2.svg',
  blueOrange: 'https://dashboard.sarvam.ai/assets/voices/avatar-3.svg',
} as const;

export default function Home() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <Layout>
      <PageHeader title="Welcome" />

      <div
        style={{
          // Sarvam's `py-tatva-16 px-tatva-12` — same gutters on mobile and
          // desktop so the rounded panel hugs content consistently.
          paddingTop: SPACE[16],
          paddingBottom: SPACE[16],
          paddingLeft: SPACE[12],
          paddingRight: SPACE[12],
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? SPACE[16] : SPACE[28],
        }}
      >
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACE[12],
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: FONTS.display,
              fontSize: FONT_SIZE['2xl'],
              fontWeight: FONT_WEIGHT.medium,
              color: COLORS.ink[900],
              letterSpacing: LETTER_SPACING.tight,
              lineHeight: LINE_HEIGHT.tight,
            }}
          >
            Start building!
          </h2>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              flexWrap: 'wrap',
              gap: SPACE[4],
            }}
          >
            <StarterCard
              avatar={STARTER_AVATARS.green}
              icon={<Mic size={20} strokeWidth={2} aria-hidden />}
              title="Speech to Text"
              description="Accurate Speech Recognition"
              onClick={() => navigate('/playground')}
              isMobile={isMobile}
            />
            <StarterCard
              avatar={STARTER_AVATARS.pink}
              icon={<AudioLines size={20} strokeWidth={2} aria-hidden />}
              title="Text to Speech"
              description="Try our Speech Models"
              onClick={() => navigate('/playground')}
              isMobile={isMobile}
            />
            <StarterCard
              avatar={STARTER_AVATARS.blueOrange}
              icon={<Sparkles size={20} strokeWidth={2} aria-hidden />}
              title="Vision"
              description="Analyze images with AI-powered vision"
              onClick={() => navigate('/vision')}
              isMobile={isMobile}
            />
          </div>
        </section>

        <DashboardSection
          title="Inference Playground"
          tagline="Token-by-token streaming with live metrics, multi-modal input, and graceful error handling."
          ctaLabel="Open Playground"
          onCta={() => navigate('/inference')}
        >
          {INFERENCE_FEATURES.map((f) => (
            <ListItem key={f.title} {...f} />
          ))}
        </DashboardSection>

        <DashboardSection
          title="Model Output Diff"
          tagline="Side-by-side token-level comparison of two model outputs on the same prompt."
          ctaLabel="Open Diff View"
          onCta={() => navigate('/diff')}
        >
          {DIFF_FEATURES.map((f) => (
            <ListItem key={f.title} {...f} />
          ))}
        </DashboardSection>
      </div>
    </Layout>
  );
}

/**
 * Mobile-only "Start building" row card. Pixel-port of the Sarvam dashboard
 * structure: 56px square thumbnail (rounded-md, avatar SVG cover + white icon
 * overlay) + title + description, wrapped in an outlined rounded-lg pill.
 */
function StarterCard({
  avatar,
  icon,
  title,
  description,
  onClick,
  isMobile,
}: {
  avatar: string;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isMobile: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-visible:outline-none focus-visible:ring-2"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACE[6],
        // Mobile (parent is flex-column): full-width row, content height.
        // Desktop (parent is flex-row): cap at 320px so the cards read as
        // compact tiles instead of stretched billboards. flex-basis along the
        // wrong axis would otherwise force a 320px min height on mobile.
        ...(isMobile
          ? { width: '100%' }
          : { flex: '0 1 320px', minWidth: 0, maxWidth: '100%' }),
        padding: SPACE[6],
        border: `1px solid ${COLORS.border.DEFAULT}`,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.surface,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: SPACE[28],
          height: SPACE[28],
          minWidth: SPACE[28],
          borderRadius: RADIUS.md,
          overflow: 'hidden',
          backgroundImage: `url(${avatar})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          {icon}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.md,
            fontWeight: FONT_WEIGHT.regular,
            color: COLORS.ink[900],
            lineHeight: LINE_HEIGHT.relaxed,
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.regular,
            color: COLORS.ink[600],
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
    </button>
  );
}
