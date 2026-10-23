import { TextInput, type TextInputProps } from 'react-native';

import { maxFontSizeMultiplier, useTheme } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  /** right=行の右側に置く（既定）、left=全幅で左寄せ（メモ等） */
  align?: 'right' | 'left';
  style?: TextInputProps['style'];
};

/** フォーム行の中に置く素の入力欄（枠なし。区切りはカードとヘアライン） */
export function TextField({ align = 'right', style, multiline, ...props }: Props) {
  const { colors, typography } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textTertiary}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      multiline={multiline}
      {...props}
      style={[
        typography.body,
        {
          color: colors.textPrimary,
          textAlign: align,
          alignSelf: 'stretch',
          paddingVertical: 2,
          minHeight: multiline ? 72 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        style,
      ]}
    />
  );
}
