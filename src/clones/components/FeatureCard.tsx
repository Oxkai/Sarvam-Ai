import type { ReactNode } from 'react';
import GradientIconBox, { type GradientPreset } from './GradientIconBox';
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHT,
  RADIUS,
  SPACE,
} from '../../constants';

type Props = {
  preset: GradientPreset;
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
};

const cardStyle = {
  display: 'flex' as const,
  alignItems: 'center' as const,
  gap: SPACE[4],
  padding: `${SPACE[3]}px ${SPACE[4]}px`,
  border: `1px solid ${COLORS.border.DEFAULT}`,
  borderRadius: RADIUS.lg,
  backgroundColor: COLORS.surface,
};

function CardBody({
  preset,
  icon,
  title,
  description,
}: Omit<Props, 'onClick'>) {
  return (
    <>
      <GradientIconBox preset={preset} icon={icon} />
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.medium,
            color: COLORS.ink[900],
            lineHeight: LINE_HEIGHT.snug,
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: FONT_SIZE.sm,
            color: COLORS.ink[600],
            lineHeight: LINE_HEIGHT.snug,
          }}
        >
          {description}
        </p>
      </div>
    </>
  );
}

export default function FeatureCard(props: Props) {
  const { onClick, ...rest } = props;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 transition hover:opacity-95"
        style={{ ...cardStyle, cursor: 'pointer' }}
      >
        <CardBody {...rest} />
      </button>
    );
  }

  return (
    <div style={cardStyle}>
      <CardBody {...rest} />
    </div>
  );
}
