import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { Card } from '../../../components';
import { Colors, Radius, Spacing, Typography } from '../../../core/theme';
import {
  ProgressChartBar,
  ProgressChartMetric,
  ProgressPeriodType,
} from '../viewmodels/useProgressViewModel';

interface ProgressPeriodChartProps {
  bars: ProgressChartBar[];
  periodType: ProgressPeriodType;
  selectedMetric: ProgressChartMetric;
  onSelectMetric: (metric: ProgressChartMetric) => void;
  goalValue: number;
}

const METRICS: {
  key: ProgressChartMetric;
  label: string;
  color: string;
  unit: string;
}[] = [
  { key: 'steps', label: 'Steps', color: Colors.steps, unit: 'steps' },
  { key: 'calories', label: 'Calories', color: Colors.calories, unit: 'kcal' },
  { key: 'water', label: 'Water', color: Colors.water, unit: 'ml' },
];

export function ProgressPeriodChart({
  bars,
  periodType,
  selectedMetric,
  onSelectMetric,
  goalValue,
}: ProgressPeriodChartProps) {
  const activeMeta =
    METRICS.find((m) => m.key === selectedMetric) ?? METRICS[0];

  const values = bars.map((b) => b[selectedMetric]);
  const maxVal = values.reduce((acc, v) => Math.max(acc, v), 0);
  const yAxisMax = Math.max(maxVal, goalValue, 100);

  const svgWidth = 340;
  const svgHeight = 200;
  const topPad = 24;
  const bottomPad = 34;
  const leftPad = 12;
  const rightPad = 12;
  const chartHeight = svgHeight - topPad - bottomPad;
  const chartWidth = svgWidth - leftPad - rightPad;

  const count = Math.max(1, bars.length);
  const slotWidth = chartWidth / count;
  const barWidth =
    periodType === 'monthly'
      ? Math.max(5, slotWidth * 0.65)
      : Math.min(36, slotWidth * 0.55);

  const goalRatio = Math.min(1, Math.max(0, goalValue / yAxisMax));
  const goalY = topPad + chartHeight * (1 - goalRatio);

  const shouldRenderLabel = (index: number): boolean => {
    if (periodType !== 'monthly') return true;
    const dayNum = index + 1;
    return dayNum === 1 || dayNum % 5 === 0 || index === bars.length - 1;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Activity Distribution</Text>
          <Text style={styles.subtitle}>
            Daily target: {goalValue.toLocaleString()} {activeMeta.unit}
          </Text>
        </View>

        <View style={styles.tabsRow}>
          {METRICS.map((tab) => {
            const active = tab.key === selectedMetric;
            return (
              <Pressable
                key={tab.key}
                testID={`progress-chart-tab-${tab.key}`}
                onPress={() => onSelectMetric(tab.key)}
                style={[
                  styles.tabChip,
                  active && {
                    backgroundColor: tab.color,
                    borderColor: tab.color,
                  },
                ]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <Svg
          width="100%"
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          {/* Baseline */}
          <Line
            x1={leftPad}
            y1={topPad + chartHeight}
            x2={svgWidth - rightPad}
            y2={topPad + chartHeight}
            stroke={Colors.border}
            strokeWidth={1}
          />

          {/* Dashed Daily Goal Line */}
          <Line
            x1={leftPad}
            y1={goalY}
            x2={svgWidth - rightPad}
            y2={goalY}
            stroke={activeMeta.color}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.65}
          />

          {bars.map((bar, idx) => {
            const val = bar[selectedMetric];
            const ratio = Math.min(1, Math.max(0, val / yAxisMax));
            const h = val > 0 ? Math.max(6, ratio * chartHeight) : 3;
            const x = leftPad + idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = topPad + chartHeight - h;

            return (
              <React.Fragment key={bar.date}>
                <Rect
                  x={x}
                  y={topPad}
                  width={barWidth}
                  height={chartHeight}
                  rx={periodType === 'monthly' ? 3 : 6}
                  fill={Colors.background}
                />
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={periodType === 'monthly' ? 3 : 6}
                  fill={val > 0 ? activeMeta.color : Colors.border}
                />
                {shouldRenderLabel(idx) ? (
                  <SvgText
                    x={x + barWidth / 2}
                    y={svgHeight - 10}
                    fontSize="10"
                    fontWeight="500"
                    fill={Colors.textSecondary}
                    textAnchor="middle"
                  >
                    {bar.label}
                  </SvgText>
                ) : null}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h3,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.surface,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
});
