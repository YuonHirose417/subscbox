import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  ListRow,
  Screen,
  ScreenHeader,
  SearchField,
  SectionHeader,
  SegmentedControl,
  Skeleton,
  Toggle,
} from '@/components/ui';
import { usePremium } from '@/features/premium/usePremium';
import { useSettingsStore, type ThemePreference } from '@/features/settings/store';
import { renewalBadgeTone } from '@/features/subscriptions/renewalBadge';
import { ja } from '@/i18n/ja';
import { premiumService } from '@/services/premium';
import { accentPresets, useTheme, withAlpha, type AccentPresetId } from '@/theme';
import type { TypographyVariant } from '@/theme/typography';

const THEME_OPTIONS = [
  { value: 'system', label: 'システム' },
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
] as const;

const PERIODS = [
  { value: 'month', label: ja.period.month },
  { value: 'year', label: ja.period.year },
  { value: 'all', label: ja.period.all },
] as const;

const CHIPS = ['すべて', '動画・音楽', '仕事効率化', 'クラウド', 'ゲーム', 'SNS', 'その他'];

const TYPE_SAMPLES: { variant: TypographyVariant; text: string }[] = [
  { variant: 'display', text: '¥12,340' },
  { variant: 'largeTitle', text: 'サブスク一覧' },
  { variant: 'title', text: 'カテゴリ別の支出' },
  { variant: 'headline', text: 'Netflix' },
  { variant: 'body', text: '契約中のサービスを追加して、毎月の支出を把握しましょう' },
  { variant: 'callout', text: '¥1,590/月' },
  { variant: 'footnote', text: '2025年10月20日に更新' },
  { variant: 'caption', text: 'あと3日' },
];

const CATEGORY_LABELS: Record<string, string> = {
  video_music: '動画・音楽',
  productivity: '仕事効率化',
  cloud: 'クラウド',
  game: 'ゲーム',
  sns: 'SNS',
  other: 'その他',
};

/** 開発用：全UIコンポーネントの一覧（__DEV__ のときだけ設定画面からリンク） */
export default function CatalogScreen() {
  const theme = useTheme();
  const { spacing, colors, accent, radius, categoryColors } = theme;
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const accentPreset = useSettingsStore((s) => s.accentPreset);
  const setAccentPreset = useSettingsStore((s) => s.setAccentPreset);
  const { isPremium } = usePremium();

  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [chip, setChip] = useState(CHIPS[0]);
  const [query, setQuery] = useState('');
  const [toggle, setToggle] = useState(true);

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen>
      <ScreenHeader showBack title={ja.screens.catalog.title} />

      <Section title="テーマ">
        <SegmentedControl<ThemePreference>
          options={THEME_OPTIONS}
          value={themePreference}
          onChange={setThemePreference}
        />
        <ListRow
          title="プレミアム（Mock）"
          trailing={
            <Toggle
              value={isPremium}
              accessibilityLabel="プレミアム（Mock）"
              onValueChange={(v) => premiumService.setPremiumForDev(v)}
            />
          }
        />
        <AppText variant="footnote" tone="secondary">
          テーマカラー（プレミアム時のみ反映）
        </AppText>
        <View style={[styles.wrap, { gap: spacing.xs }]}>
          {(Object.keys(accentPresets) as AccentPresetId[]).map((id) => (
            <Chip
              key={id}
              label={accentPresets[id].label}
              selected={accentPreset === id}
              onPress={() => setAccentPreset(id)}
            />
          ))}
        </View>
      </Section>

      <Section title="カラー">
        <View style={[styles.wrap, { gap: spacing.xs }]}>
          {(
            [
              ['background', colors.background],
              ['surface', colors.surface],
              ['surface2', colors.surfaceSecondary],
              ['text', colors.textPrimary],
              ['text2', colors.textSecondary],
              ['text3', colors.textTertiary],
              ['accent', accent.primary],
              ['accent2', accent.secondary],
              ['accent3', accent.tertiary],
              ['positive', colors.positive],
              ['negative', colors.negative],
              ['warning', colors.warning],
            ] as const
          ).map(([name, value]) => (
            <Swatch key={name} name={name} color={value} />
          ))}
        </View>
        <AppText variant="footnote" tone="secondary">
          カテゴリ（タイル背景は10%）
        </AppText>
        <View style={[styles.wrap, { gap: spacing.xs }]}>
          {Object.entries(categoryColors).map(([key, value]) => (
            <View
              key={key}
              style={[
                styles.tile,
                { backgroundColor: withAlpha(value, 0.1), borderRadius: radius.inner },
              ]}>
              <AppText variant="footnote" style={{ color: value, fontWeight: '600' }}>
                {CATEGORY_LABELS[key]}
              </AppText>
            </View>
          ))}
        </View>
      </Section>

      <Section title="タイポグラフィ">
        {TYPE_SAMPLES.map(({ variant, text }) => (
          <View key={variant}>
            <AppText variant="caption" tone="tertiary">
              {variant}
            </AppText>
            <AppText variant={variant}>{text}</AppText>
          </View>
        ))}
      </Section>

      <Section title="ボタン">
        <Button title="保存する" onPress={() => {}} />
        <Button title="カスタムで追加する" variant="soft" onPress={() => {}} />
        <Button title="キャンセル" variant="secondary" onPress={() => {}} />
        <Button title="削除" variant="destructive" icon="trash" onPress={() => {}} />
        <Button title="保存する（無効）" disabled />
        <Button title="読み込み中" loading />
        <View style={[styles.row, { gap: spacing.sm }]}>
          <IconButton icon="gearshape" fallback="settings-outline" accessibilityLabel="設定" />
          <IconButton icon="plus" fallback="add" variant="gradient" accessibilityLabel="追加" />
          <View
            style={[
              styles.darkBox,
              { backgroundColor: colors.scrim[1], borderRadius: radius.inner, gap: spacing.sm },
            ]}>
            <IconButton
              icon="chevron.left"
              fallback="chevron-back"
              variant="glass"
              size={36}
              accessibilityLabel="戻る"
            />
            <IconButton
              icon="ellipsis"
              fallback="ellipsis-horizontal"
              variant="glass"
              size={36}
              accessibilityLabel="その他"
            />
          </View>
        </View>
      </Section>

      <Section title="セグメント・チップ・検索">
        <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={ja.screens.subscriptions.searchPlaceholder}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs }}>
          {CHIPS.map((c) => (
            <Chip key={c} label={c} selected={chip === c} onPress={() => setChip(c)} />
          ))}
        </ScrollView>
      </Section>

      <Section title="バッジ">
        <View style={[styles.row, { gap: spacing.xs }]}>
          {[3, 7, 8, 14, 15, 28].map((d) => (
            <Badge key={d} label={`あと${d}日`} tone={renewalBadgeTone(d)} />
          ))}
        </View>
      </Section>

      <Section title="リスト行・トグル">
        <Card padding={0} style={{ paddingHorizontal: spacing.md }}>
          <ListRow icon="bell" title="通知設定" onPress={() => {}} separator />
          <ListRow icon="moon" title="テーマ" value="システム" onPress={() => {}} separator />
          <ListRow
            icon="bell"
            title="更新前に通知する"
            separator
            trailing={
              <Toggle
                value={toggle}
                onValueChange={setToggle}
                accessibilityLabel="更新前に通知する"
              />
            }
          />
          <ListRow
            icon="square.and.pencil"
            iconBackground={accent.gradientMuted[0]}
            title="編集"
            onPress={() => {}}
            separator
          />
          <ListRow
            icon="trash"
            iconBackground={colors.negativeSoft}
            title="削除"
            destructive
            onPress={() => {}}
            showChevron={false}
          />
        </Card>
      </Section>

      <Section title="セクション見出し">
        <Card>
          <SectionHeader title="まもなく更新" actionLabel={ja.common.seeAll} onAction={() => {}} />
        </Card>
        <Card>
          <SectionHeader title="月別の支出推移" trailing="平均 ¥11,200" />
        </Card>
      </Section>

      <Section title="スケルトン">
        <Card style={{ gap: spacing.xs }}>
          <Skeleton width="40%" height={14} />
          <Skeleton height={44} radius={radius.icon} />
          <Skeleton width="70%" height={14} />
        </Card>
      </Section>

      <Section title="空状態・エラー">
        <Card>
          <EmptyState
            icon="tray"
            title={ja.empty.homeTitle}
            description={ja.empty.homeBody}
            actionLabel={ja.empty.homeAction}
            onAction={() => {}}
          />
        </Card>
        <Card>
          <ErrorState onRetry={() => {}} />
        </Card>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
      <AppText variant="title">{title}</AppText>
      {children}
    </View>
  );
}

function Swatch({ name, color }: { name: string; color: string }) {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.swatch}>
      <View
        style={[
          styles.swatchColor,
          { backgroundColor: color, borderRadius: radius.sm, borderColor: colors.border },
        ]}
      />
      <AppText variant="caption" tone="secondary">
        {name}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { paddingHorizontal: 14, paddingVertical: 12 },
  darkBox: { flexDirection: 'row', padding: 8 },
  swatch: { alignItems: 'center', gap: 4, width: 64 },
  swatchColor: { width: 44, height: 44, borderWidth: 1 },
});
