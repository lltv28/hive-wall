export interface CartesianPosition {
  x: number;
  y: number;
}

export function angleForIndex(index: number, count: number): number {
  return (index / count) * Math.PI * 2;
}

export function polarToCartesian(
  centerX: number,
  centerY: number,
  angle: number,
  radius: number,
): CartesianPosition {
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

export function wheelRadiusFor(width: number, height: number): number {
  return 0.42 * Math.min(width, height);
}
