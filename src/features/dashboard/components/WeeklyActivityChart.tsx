import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { Card } from '../../../components';
import { Colors, Radius, Spacing, Typography } from '../../../core/theme';
import {
  ChartMetric,
  WeeklyChartDayPoint,
} from '../viewmodels/useDashboardViewModel';

interface WeeklyActivityChartProps {
  points: WeeklyChartDayPoint[];
  selectedMetric: ChartMetric;
  onSelectMetric: (metric: ChartMetric) => void;
  goalValue: number;
}

const METRIC_TABS: { key: ChartMetric; label: string; color: string; unit: string }[] = [
  { key: 'steps', label: 'Steps', color: Colors.steps, unit: 'steps' },
  { key: 'calories', label: 'Calories', color: Colors.calories, unit: 'kcal' },
  { key: 'water', label: 'Water', color: Colors.water, unit: 'ml' },
];

export function WeeklyActivityChart({
  points,
  selectedMetric,
  onSelectMetric,
  goalValue,
}: WeeklyActivityChartProps) {
  const activeMeta =
    METRIC_TABS.find((t) => t.key === selectedMetric) ?? METRIC_TABS[0];

  const values = points.map((p) => p[selectedMetric]);
  const maxDataVal = values.reduce((acc, v) => Math.max(acc, v), 0);
  const yAxisMax = Math.max(maxDataVal, goalValue, 100);

  const svgWidth = 340;
  const svgHeight = 190;
  const topPad = 24;
  const bottomPad = 34;
  const leftPad = 14;
  const rightPad = 14;
  const chartHeight = svgHeight - topPad - bottomPad;
  const chartWidth = svgWidth - leftPad - rightPad;

  const slotWidth = points.length > 0 ? chartWidth / points.length : chartWidth;
  const barWidth = Math.min(28, slotWidth * 0.56);

  const goalRatio = Math.min(1, Math.max(0, goalValue / yAxisMax));
  const goalY = topPad + chartHeight * (1 - goalRatio);

  const formatCompact = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;
    }
    return String(num);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Last 7 Days Activity</Text>
          <Text style={styles.subtitle}>
            Goal line: {goalValue.toLocaleString()} {activeMeta.unit}
          </Text>
        </View>

        <View style={styles.tabsRow}>
          {METRIC_TABS.map((tab) => {
            const isSelected = tab.key === selectedMetric;
            return (
              <Pressable
                key={tab.key}
                testID={`chart-metric-tab-${tab.key}`}
                onPress={() => onSelectMetric(tab.key)}
                style={[
                  styles.tabChip,
                  isSelected && {
                    backgroundColor: tab.color,
                    borderColor: tab.color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.tabTextActive,
                  ]}
                >
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

          {/* Goal reference dashed line */}
          <Line
            x1={leftPad}
            y1={goalY}
            x2={svgWidth - rightPad}
            y2={goalY}
            stroke={activeMeta.color}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.6}
          />

          {points.map((pt, idx) => {
            const val = pt[selectedMetric];
            const ratio = Math.min(1, Math.max(0, val / yAxisMax));
            const barHeight = val > 0 ? Math.max(6, ratio * chartHeight) : 3;
            const x = leftPad + idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = topPad + chartHeight - barHeight;

            return (
              <React.Fragment key={pt.date}>
                {/* Track bar */}
                <Rect
                  x={x}
                  y={topPad}
                  width={barWidth}
                  height={chartHeight}
                  rx={6}
                  fill={Colors.background}
                />
                {/* Value bar */}
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={val > 0 ? activeMeta.color : Colors.border}
                  opacity={pt.isToday ? 1 : 0.78}
                />
                {/* Value label above bar */}
                {val > 0 ? (
                  <SvgText
                    x={x + barWidth / 2}
                    y={Math.max(12, y - 5)}
                    fontSize="10"
                    fontWeight="600"
                    fill={Colors.textSecondary}
                    textAnchor="middle"
                  >
                    {formatCompact(val)}
                  </SvgText>
                ) : null}
                {/* Day label below bar */}
                <SvgText
                  x={x + barWidth / 2}
                  y={svgHeight - 12}
                  fontSize="11"
                  fontWeight={pt.isToday ? '700' : '500'}
                  fill={pt.isToday ? Colors.primary : Colors.textSecondary}
                  textAnchor="middle"
                >
                  {pt.isToday ? 'Today' : pt.dayLabel}
                </SvgText>
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
    marginBottom: Spacing.lg,
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
