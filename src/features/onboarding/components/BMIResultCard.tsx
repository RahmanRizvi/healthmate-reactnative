import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Info, Scale, User } from 'lucide-react-native';
import { Card } from '../../../components';
import { Colors, IconSize, Radius, Spacing, Typography } from '../../../core/theme';
import { BMICategory, BMIResult } from '../../../core/utils/healthCalculations';

interface BMIResultCardProps {
  bmiResult: BMIResult;
  age: number | null;
  heightCm: number;
  weightKg: number;
}

const CATEGORY_RANGES: {
  category: BMICategory;
  rangeLabel: string;
  color: string;
  bgColor: string;
}[] = [
  {
    category: 'Underweight',
    rangeLabel: 'Below 18.5',
    color: Colors.water,
    bgColor: Colors.waterMuted,
  },
  {
    category: 'Normal',
    rangeLabel: '18.5 – 24.9',
    color: Colors.steps,
    bgColor: Colors.stepsMuted,
  },
  {
    category: 'Overweight',
    rangeLabel: '25.0 – 29.9',
    color: Colors.warning,
    bgColor: Colors.warningMuted,
  },
  {
    category: 'Obese',
    rangeLabel: '30.0 and above',
    color: Colors.error,
    bgColor: Colors.errorMuted,
  },
];

export function BMIResultCard({
  bmiResult,
  age,
  heightCm,
  weightKg,
}: BMIResultCardProps) {
  const activeStyle =
    CATEGORY_RANGES.find((item) => item.category === bmiResult.category) ??
    CATEGORY_RANGES[1];

  return (
    <View>
      <Card style={styles.summaryCard}>
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <Scale size={IconSize.lg} color={Colors.primary} />
          </View>
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: activeStyle.bgColor,
                  borderColor: activeStyle.color,
                },
              ]}
            >
              <Text style={[styles.categoryBadgeText, { color: activeStyle.color }]}>
                {bmiResult.category}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bmiValueSection}>
          <Text style={styles.bmiLabel}>Body Mass Index (BMI)</Text>
          <Text style={styles.bmiNumber} testID="bmi-result-value">
            {bmiResult.bmi.toFixed(1)}
          </Text>
          <Text style={styles.formulaCaption}>
            Calculated as {weightKg} kg / ({(heightCm / 100).toFixed(2)} m)²
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Age</Text>
            <Text style={styles.metricValue}>
              {age !== null ? `${age} yrs` : '—'}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Height</Text>
            <Text style={styles.metricValue}>{heightCm} cm</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Weight</Text>
            <Text style={styles.metricValue}>{weightKg} kg</Text>
          </View>
        </View>

        <Text style={styles.descriptionText}>{bmiResult.description}</Text>

        <View style={styles.healthyRangeBox}>
          <User size={IconSize.sm} color={Colors.secondary} />
          <Text style={styles.healthyRangeText}>
            Estimated normal weight range for your height:{' '}
            <Text style={styles.healthyRangeBold}>
              {bmiResult.healthyWeightRangeKg.min} kg – {bmiResult.healthyWeightRangeKg.max} kg
            </Text>
          </Text>
        </View>
      </Card>

      <Card style={styles.tableCard}>
        <Text style={styles.tableTitle}>Adult BMI Categories</Text>
        {CATEGORY_RANGES.map((row) => {
          const isCurrent = row.category === bmiResult.category;
          return (
            <View
              key={row.category}
              style={[
                styles.tableRow,
                isCurrent && {
                  backgroundColor: row.bgColor,
                  borderColor: row.color,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.dot, { backgroundColor: row.color }]} />
                <Text
                  style={[
                    styles.rowCategory,
                    isCurrent && styles.rowCategoryActive,
                  ]}
                >
                  {row.category}
                </Text>
              </View>
              <Text
                style={[
                  styles.rowRange,
                  isCurrent && { color: row.color, fontWeight: '700' },
                ]}
              >
                {row.rangeLabel}
              </Text>
            </View>
          );
        })}
      </Card>

      <View style={styles.disclaimerBox}>
        <Info size={IconSize.sm} color={Colors.textSecondary} />
        <Text style={styles.disclaimerText}>
          These BMI categories apply to adults and are provided as an informational
          wellness estimate, not a medical diagnosis.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xxs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryBadgeText: {
    ...Typography.label,
    fontWeight: '700',
  },
  bmiValueSection: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  bmiLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  bmiNumber: {
    ...Typography.display,
    fontSize: 44,
    lineHeight: 52,
    color: Colors.primary,
    marginVertical: Spacing.xxs,
  },
  formulaCaption: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metricValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    marginTop: 2,
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  healthyRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  healthyRangeText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  healthyRangeBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  tableCard: {
    marginBottom: Spacing.md,
  },
  tableTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: Spacing.xxs,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  rowCategory: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  rowCategoryActive: {
    fontWeight: '700',
  },
  rowRange: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
});
