import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  showDots?: boolean;
  className?: string;
}

export const Sparkline = ({
  data,
  width = 80,
  height = 24,
  strokeWidth = 1.5,
  color = 'hsl(var(--primary))',
  showDots = false,
  className,
}: SparklineProps) => {
  const pathData = useMemo(() => {
    if (data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    const path = points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, '');

    return path;
  }, [data, width, height]);

  const dots = useMemo(() => {
    if (!showDots || data.length < 2) return [];

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    return data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * chartWidth,
      y: padding + chartHeight - ((value - min) / range) * chartHeight,
    }));
  }, [data, width, height, showDots]);

  if (data.length < 2) {
    return (
      <div 
        className={cn('flex items-center justify-center text-xs text-muted-foreground', className)}
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  const trend = data[data.length - 1] - data[0];
  const trendColor = trend > 0 ? 'hsl(0, 70%, 50%)' : trend < 0 ? 'hsl(142, 70%, 45%)' : color;

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={pathData}
        fill="none"
        stroke={trendColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={2}
          fill={trendColor}
        />
      ))}
    </svg>
  );
};
