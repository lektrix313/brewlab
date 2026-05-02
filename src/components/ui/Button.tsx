import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  size?: 'default' | 'large';
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'default',
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseClasses = 'flex-row items-center justify-center rounded-[10px]';
  const sizeClasses = size === 'large' ? 'h-14 px-6' : 'h-12 px-5';

  const variantClasses: Record<Variant, string> = {
    primary: 'bg-copper',
    secondary: 'bg-cream-soft border border-ink/10',
    ghost: 'bg-transparent',
    destructive: 'bg-critical/10 border border-critical/20',
  };

  const textClasses: Record<Variant, string> = {
    primary: 'text-cream font-semibold',
    secondary: 'text-ink font-semibold',
    ghost: 'text-copper font-semibold',
    destructive: 'text-critical font-semibold',
  };

  const opacity = isDisabled ? 'opacity-50' : 'opacity-100';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${opacity}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#F5F0E6' : '#B8633A'} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`text-[15px] ${textClasses[variant]}`}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
