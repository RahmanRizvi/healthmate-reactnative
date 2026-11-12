import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Colors, IconSize, Radius, Spacing, Typography } from '../core/theme';

interface ErrorBannerProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({
  message,
  actionLabel,
  onAction,
  onDismiss,
}: ErrorBannerProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.row}>
        <AlertCircle size={IconSize.md} color={Colors.error} />
        <Text style={styles.message}>{message}</Text>
      </View>

      {(actionLabel && onAction) || onDismiss ? (
        <View style={styles.actionsRow}>
          {actionLabel && onAction ? (
            <Pressable onPress={onAction} style={styles.actionButton}>
              <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
          {onDismiss ? (
            <Pressable onPress={onDismiss} style={styles.actionButton}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.errorMuted,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  message: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  actionButton: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
  },
  actionText: {
    ...Typography.label,
    color: Colors.error,
  },
  dismissText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
