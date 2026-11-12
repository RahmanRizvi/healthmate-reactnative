import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { Colors, IconSize, Radius, Spacing, Typography } from '../core/theme';
import {
  formatDateToISO,
  formatReadableDate,
  isValidISODate,
  parseISODate,
} from '../core/utils/dateUtils';
import { Button } from './Button';
import { FormInput } from './FormInput';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (dateISO: string) => void;
  error?: string;
  helperText?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  allowManualEntry?: boolean;
  testID?: string;
}

export function DatePickerField({
  label,
  value,
  onChange,
  error,
  helperText,
  maximumDate,
  minimumDate,
  allowManualEntry = true,
  testID,
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const currentDateObject = isValidISODate(value) ? parseISODate(value) : new Date(1996, 0, 15);

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChange(formatDateToISO(selectedDate));
    }
  };

  if (Platform.OS === 'web') {
    return (
      <FormInput
        testID={testID}
        label={label}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        error={error}
        helperText={helperText ?? 'Format: YYYY-MM-DD'}
        leftIcon={<Calendar size={IconSize.md} color={Colors.textSecondary} />}
      />
    );
  }

  return (
    <View style={styles.container}>
      {allowManualEntry ? (
        <View>
          <FormInput
            testID={testID}
            label={label}
            value={value}
            onChangeText={onChange}
            placeholder="YYYY-MM-DD"
            error={error}
            helperText={
              isValidISODate(value)
                ? `Selected: ${formatReadableDate(value)}`
                : helperText ?? 'Format: YYYY-MM-DD'
            }
            leftIcon={<Calendar size={IconSize.md} color={Colors.textSecondary} />}
          />
          <Pressable
            onPress={() => setShowPicker(true)}
            style={styles.calendarTriggerButton}
            accessibilityRole="button"
            accessibilityLabel={`Open calendar picker for ${label}`}
          >
            <Calendar size={IconSize.sm} color={Colors.primary} />
            <Text style={styles.calendarTriggerText}>Pick from Calendar</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.fieldWrapper}>
          <Text style={[Typography.label, styles.label]}>{label}</Text>
          <Pressable
            testID={testID}
            onPress={() => setShowPicker(true)}
            style={[styles.selectorBox, Boolean(error) && styles.selectorBoxError]}
          >
            <Calendar size={IconSize.md} color={Colors.textSecondary} />
            <Text style={styles.selectorValue}>
              {isValidISODate(value) ? `${formatReadableDate(value)} (${value})` : 'Select date'}
            </Text>
          </Pressable>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      )}

      {showPicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={currentDateObject}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={handlePickerChange}
        />
      ) : null}

      {showPicker && Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPicker(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>{label}</Text>
              <DateTimePicker
                value={currentDateObject}
                mode="date"
                display="spinner"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={handlePickerChange}
              />
              <Button
                title="Done"
                onPress={() => setShowPicker(false)}
                variant="primary"
                style={styles.doneButton}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  fieldWrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  selectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  selectorBoxError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorMuted,
  },
  selectorValue: {
    ...Typography.body,
    marginLeft: Spacing.sm,
    color: Colors.textPrimary,
  },
  calendarTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
  },
  calendarTriggerText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.xxs,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xxs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 43, 39, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  doneButton: {
    marginTop: Spacing.md,
  },
});
