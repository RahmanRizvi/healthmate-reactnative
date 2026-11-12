import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { Colors, IconSize, Radius, Spacing, Typography } from '../core/theme';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectDropdownProps<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SelectDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  containerStyle,
  testID,
}: SelectDropdownProps<T>) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (newValue: T) => {
    onChange(newValue);
    setOpen(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[Typography.label, styles.label]}>{label}</Text>

      <Pressable
        testID={testID}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.trigger,
          Boolean(error) && styles.triggerError,
          pressed && styles.triggerPressed,
        ]}
      >
        <Text style={styles.selectedText}>
          {selectedOption ? selectedOption.label : 'Select an option'}
        </Text>
        <ChevronDown size={IconSize.md} color={Colors.textSecondary} />
      </Pressable>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.menuCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle}>{label}</Text>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  testID={`dropdown-option-${option.value}`}
                  onPress={() => handleSelect(option.value)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    isSelected && styles.optionRowSelected,
                    pressed && styles.optionRowPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Check size={IconSize.md} color={Colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  triggerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorMuted,
  },
  triggerPressed: {
    backgroundColor: Colors.background,
  },
  selectedText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xxs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 43, 39, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  menuCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  menuTitle: {
    ...Typography.h3,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: 2,
  },
  optionRowSelected: {
    backgroundColor: Colors.primaryMuted,
  },
  optionRowPressed: {
    backgroundColor: Colors.background,
  },
  optionText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
