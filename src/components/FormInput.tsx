import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../core/theme';

interface FormInputProps extends TextInputProps {
  label: string;
  unit?: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
}

export function FormInput({
  label,
  unit,
  error,
  helperText,
  containerStyle,
  leftIcon,
  style,
  ...rest
}: FormInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelRow}>
        <Text style={Typography.label}>{label}</Text>
      </View>

      <View
        style={[
          styles.inputWrapper,
          Boolean(error) && styles.inputWrapperError,
          rest.editable === false && styles.inputWrapperDisabled,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor={Colors.textSecondary}
          style={[styles.input, style]}
          {...rest}
        />
        {unit ? <Text style={styles.unitSuffix}>{unit}</Text> : null}
      </View>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
    overflow: 'hidden',
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorMuted,
  },
  inputWrapperDisabled: {
    backgroundColor: Colors.background,
  },
  iconLeft: {
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    ...Typography.body,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  unitSuffix: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    flexShrink: 0,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xxs,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
});
