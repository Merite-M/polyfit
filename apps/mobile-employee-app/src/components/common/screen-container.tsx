import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Spacing } from '@/constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
  withHorizontalPadding?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  edges = ['top', 'left', 'right'],
  backgroundColor = Palette.navyDark,
  withHorizontalPadding = true,
}) => {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    paddingTop: edges.includes('top') ? Math.max(insets.top, 16) : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
    paddingHorizontal: withHorizontalPadding ? Spacing.four : 0,
  };

  return <View style={[styles.container, containerStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
