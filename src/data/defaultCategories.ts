import type { Category, DefaultCategoryId } from '@/domain/types';
import { categoryColors } from '@/theme/tokens';

type DefaultCategory = Category & { id: DefaultCategoryId };

/** 既定カテゴリ（フェーズ3でマイグレーション version 1 の初期データとして INSERT する） */
export const defaultCategories: readonly DefaultCategory[] = [
  {
    id: 'video_music',
    name: '動画・音楽',
    color: categoryColors.video_music,
    icon: 'play.rectangle.fill',
    sortOrder: 0,
    isDefault: true,
  },
  {
    id: 'productivity',
    name: '仕事効率化',
    color: categoryColors.productivity,
    icon: 'laptopcomputer',
    sortOrder: 1,
    isDefault: true,
  },
  {
    id: 'cloud',
    name: 'クラウド',
    color: categoryColors.cloud,
    icon: 'cloud.fill',
    sortOrder: 2,
    isDefault: true,
  },
  {
    id: 'game',
    name: 'ゲーム',
    color: categoryColors.game,
    icon: 'gamecontroller.fill',
    sortOrder: 3,
    isDefault: true,
  },
  {
    id: 'sns',
    name: 'SNS',
    color: categoryColors.sns,
    icon: 'person.2.fill',
    sortOrder: 4,
    isDefault: true,
  },
  {
    id: 'other',
    name: 'その他',
    color: categoryColors.other,
    icon: 'ellipsis.circle.fill',
    sortOrder: 5,
    isDefault: true,
  },
];
