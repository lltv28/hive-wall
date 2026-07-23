export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function computeTopScrollTop(args: {
  containerTop: number;
  containerScrollTop: number;
  containerHeight: number;
  containerScrollHeight: number;
  elementTop: number;
  elementHeight: number;
  margin: number;
}) {
  const {
    containerTop,
    containerScrollTop,
    containerScrollHeight,
    elementTop,
    margin,
  } = args;

  const delta = elementTop - containerTop;
  const raw = containerScrollTop + delta - margin;
  const { containerHeight } = args;
  const max = Math.max(0, containerScrollHeight - containerHeight);

  return clamp(raw, 0, max);
}
