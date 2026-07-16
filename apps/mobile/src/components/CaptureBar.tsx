import React, { useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../ui/Icon';

interface Props {
  variant: 'phone' | 'web';
  onSubmit: (text: string) => void;
  busy?: boolean;
}

/**
 * The AI capture bar — locked to the top on both shapes. Typing here and submitting
 * opens the review sheet; nothing is written until the user confirms.
 */
export function CaptureBar({ variant, onSubmit, busy }: Props) {
  const { colors, font, radius } = useTheme();
  const [text, setText] = useState('');

  const submit = () => {
    if (busy) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };

  const isWeb = variant === 'web';
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: isWeb ? radius.sm : radius.pill,
        },
      ]}
    >
      <View style={[styles.spark, { backgroundColor: colors.primary }]} />
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        placeholder={isWeb ? 'Tell LifeLike what happened, or search everything…' : 'Tell LifeLike what happened…'}
        placeholderTextColor={colors.textDim}
        returnKeyType="send"
        style={[styles.input, { color: colors.text, fontFamily: font.families.bodyRegular }]}
      />
      {!isWeb && (
        <Pressable accessibilityLabel="Voice input" style={styles.mic} hitSlop={8}>
          <Icon name="mic" size={19} color={colors.textDim} />
        </Pressable>
      )}
      <Pressable
        accessibilityLabel="Capture"
        onPress={submit}
        style={[styles.send, { backgroundColor: colors.primary, borderRadius: isWeb ? radius.xs : 999, opacity: busy ? 0.7 : 1 }]}
      >
        {busy ? <ActivityIndicator size="small" color={colors.onPrimary} />
              : <Icon name={isWeb ? 'plus' : 'send'} size={19} color={colors.onPrimary} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  spark: { width: 24, height: 24, borderRadius: 12 },
  input: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 6 },
  mic: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  send: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
});
