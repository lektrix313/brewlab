import React from 'react';
import { View, TouchableOpacity } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export function Card({ children, onPress, className = '' }: CardProps) {
  const baseClasses = 'bg-cream-soft rounded-[14px] p-5 border border-cream-deep';

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        className={`${baseClasses} ${className}`}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View className={`${baseClasses} ${className}`}>{children}</View>;
}
