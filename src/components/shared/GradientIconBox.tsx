import type { ReactNode } from 'react';
import { COLORS, RADIUS } from '../../constants';

export type GradientPreset = 'green' | 'coral' | 'blueOrange';

const GRADIENTS: Record<GradientPreset, string> = {
  green: COLORS.gradient.green,
  coral: COLORS.gradient.coral,
  blueOrange: COLORS.gradient.indigo,
};

type Props = {
  preset: GradientPreset;
  icon: ReactNode;
  size?: number;
};

export default function GradientIconBox({ preset, icon, size = 44 }: Props) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: RADIUS.md,
        background: GRADIENTS[preset],
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
  );
}
