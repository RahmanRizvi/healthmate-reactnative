import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar, ChevronRight, Droplets, Flame, Footprints } from 'lucide-react-native';
import { Card } from '../../../components';
import { Colors, IconSize, Radius, Spacing, Typography } from '../../../core/theme';
import { formatReadableDate } from '../../../core/utils/dateUtils';
import { HealthRecord } from '../../../models/HealthRecord';

interface HealthRecordCardProps {
  record: HealthRecord;
  onPress: () => void;
}

export function HealthRecordCard({ record, onPress }: HealthRecordCardProps) {
  return (
    <Card
      onPress={onPress}
      style={styles.card}
      testID={`health-record-card-${record.date}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.dateRow}>
          <Calendar size={IconSize.sm} color={Colors.primary} />
          <Text style={styles.dateTitle} numberOfLines={1}>
            {formatReadableDate(record.date)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.isoDateBadge}>{record.date}</Text>
          <ChevronRight size={IconSize.sm} color={Colors.textSecondary} />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCell}>
          <View style={styles.metricTop}>
            <View style={[styles.iconBadge, { backgroundColor: Colors.stepsMuted }]}>
              <Footprints size={14} color={Colors.steps} />
            </View>
            <Text style={styles.metricLabel}>Steps</Text>
          </View>
          <Text style={styles.metricValue} numberOfLines={1}>
            {record.steps.toLocaleString()}
          </Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.metricCell}>
          <View style={styles.metricTop}>
            <View
              style={[styles.iconBadge, { backgroundColor: Colors.caloriesMuted }]}
            >
              <Flame size={14} color={Colors.calories} />
            </View>
            <Text style={styles.metricLabel}>Calories</Text>
          </View>
          <Text style={styles.metricValue} numberOfLines={1}>
            {record.calories.toLocaleString()}{' '}
            <Text style={styles.unitSmall}>kcal</Text>
          </Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.metricCell}>
          <View style={styles.metricTop}>
            <View style={[styles.iconBadge, { backgroundColor: Colors.waterMuted }]}>
              <Droplets size={14} color={Colors.water} />
            </View>
            <Text style={styles.metricLabel}>Water</Text>
          </View>
          <Text style={styles.metricValue} numberOfLines={1}>
            {record.water.toLocaleString()}{' '}
            <Text style={styles.unitSmall}>ml</Text>
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  dateTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    flexShrink: 1,
  },
  isoDateBadge: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  verticalDivider: {
    width: 1,
    height: 34,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  unitSmall: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
