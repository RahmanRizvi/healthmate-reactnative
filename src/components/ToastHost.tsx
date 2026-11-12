import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import { Colors, IconSize, Radius, Spacing, Typography } from '../core/theme';
import { ToastType, useToastStore } from '../store/useToastStore';

const TOAST_THEMES: Record<
  ToastType,
  { borderColor: string; bgColor: string; iconColor: string }
> = {
  success: {
    borderColor: Colors.steps,
    bgColor: Colors.surface,
    iconColor: Colors.steps,
  },
  error: {
    borderColor: Colors.error,
    bgColor: Colors.surface,
    iconColor: Colors.error,
  },
  info: {
    borderColor: Colors.primary,
    bgColor: Colors.surface,
    iconColor: Colors.primary,
  },
};

export function ToastHost() {
  const currentToast = useToastStore((state) => state.currentToast);
  const hideToast = useToastStore((state) => state.hideToast);
  const insets = useSafeAreaInsets();

  if (!currentToast) {
    return null;
  }

  const theme = TOAST_THEMES[currentToast.type];

  const renderIcon = () => {
    if (currentToast.type === 'error') {
      return <AlertCircle size={IconSize.md} color={theme.iconColor} />;
    }
    if (currentToast.type === 'info') {
      return <Info size={IconSize.md} color={theme.iconColor} />;
    }
    return <CheckCircle2 size={IconSize.md} color={theme.iconColor} />;
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          top: Math.max(insets.top + Spacing.xs, Spacing.md),
        },
      ]}
    >
      <View
        testID="app-toast-banner"
        accessibilityRole="alert"
        style={[
          styles.toastCard,
          {
            backgroundColor: theme.bgColor,
            borderColor: theme.borderColor,
          },
        ]}
      >
        <View
          style={[
            styles.accentBar,
            { backgroundColor: theme.borderColor },
          ]}
        />
        <View style={styles.iconBox}>{renderIcon()}</View>
        <Text style={styles.messageText}>{currentToast.message}</Text>
        <Pressable
          onPress={hideToast}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <X size={16} color={Colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm + 2,
    paddingRight: Spacing.sm,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: Spacing.sm,
  },
  iconBox: {
    marginRight: Spacing.xs,
    flexShrink: 0,
  },
  messageText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  closeBtn: {
    padding: Spacing.xxs,
    marginLeft: Spacing.xs,
    flexShrink: 0,
  },
});
