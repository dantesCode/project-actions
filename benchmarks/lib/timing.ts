export interface Stats {
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

export function computeStats(timings: number[]): Stats {
  const sorted = [...timings].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const percentile = (p: number) => sorted[Math.ceil(p * sorted.length) - 1];
  return {
    min: Math.round(min),
    max: Math.round(max),
    mean: Math.round(mean),
    p50: Math.round(percentile(0.5)),
    p95: Math.round(percentile(0.95)),
    p99: Math.round(percentile(0.99)),
  };
}

export async function benchmark(
  fn: () => void | Promise<void>,
  options: { warmup: number; iterations: number },
): Promise<Stats> {
  for (let i = 0; i < options.warmup; i++) {
    await fn();
  }
  const timings: number[] = [];
  for (let i = 0; i < options.iterations; i++) {
    const start = process.hrtime.bigint();
    await fn();
    const elapsed = Number(process.hrtime.bigint() - start) / 1000;
    timings.push(elapsed);
  }
  return computeStats(timings);
}
