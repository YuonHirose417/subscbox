import { popularServices, type ServicePreset } from '@/data/popularServices';
import { normalizeForSearch } from '@/domain/search';
import type { Subscription } from '@/domain/types';

/** プリセットを ServiceIcon に渡せる形にする */
export function presetIconSubject(
  preset: ServicePreset,
): Pick<Subscription, 'serviceKey' | 'name' | 'icon' | 'categoryId'> {
  return {
    serviceKey: preset.key,
    name: preset.name,
    categoryId: preset.categoryId,
    icon: { type: 'monogram', value: preset.monogram, color: preset.brandColor },
  };
}

/** サービス名・別名（カタカナ等）で人気サービスを検索する */
export function searchPresets(query: string): ServicePreset[] {
  const q = normalizeForSearch(query);
  if (!q) return [];
  return popularServices.filter((p) =>
    [p.name, p.shortName ?? '', ...(p.aliases ?? [])].some((text) =>
      normalizeForSearch(text).includes(q),
    ),
  );
}

export function presetsInCategory(categoryId: string): ServicePreset[] {
  return popularServices.filter((p) => p.categoryId === categoryId);
}
