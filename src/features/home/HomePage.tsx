import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/layout/PageHeader';
import DashboardSection from '../../components/ui/DashboardSection';
import ListItem from '../../components/ui/ListItem';
import { SPACE } from '../../constants';

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

export default function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <PageHeader title="Welcome" />

      <div
        style={{
          // dashboard.sarvam.ai: `gap-tatva-28 py-tatva-16 px-tatva-12`
          paddingTop: SPACE[16],
          paddingBottom: SPACE[16],
          paddingLeft: SPACE[12],
          paddingRight: SPACE[12],
          display: 'flex',
          flexDirection: 'column',
          gap: SPACE[28], // 56px between hero sections
        }}
      >
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
