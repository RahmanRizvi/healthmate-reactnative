import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius } from '../core/theme';

interface ProgressBarProps {
  percentage: number; // 0 to 100
  color?: string;
  height?: number;
}

export function ProgressBar({
  percentage,
  color = Colors.primary,
  height = 8,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.full,
  },
});
