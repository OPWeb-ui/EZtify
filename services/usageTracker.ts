
const STORAGE_KEY = 'eztify_tool_stats';

interface UsageMap {
  [toolId: string]: number;
}

const getUsageMap = (): UsageMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to parse usage stats', e);
    return {};
  }
};

export const incrementToolUsage = (toolId: string): void => {
  try {
    const stats = getUsageMap();
    stats[toolId] = (stats[toolId] || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    // Ignore storage errors (quota, privacy mode, etc)
  }
};

export const getToolUsage = (toolId: string): number => {
  const stats = getUsageMap();
  return stats[toolId] || 0;
};

export const formatUsageCount = (count: number): string => {
  if (count === 0) return '';
  if (count < 1000) return `${count}`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}m`;
};
