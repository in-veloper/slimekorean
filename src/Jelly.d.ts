import { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

export interface JellyProps {
  color: string;
  dark: string;
  radius?: number;
  lip?: number;
  style?: StyleProp<ViewStyle>;
  inner?: StyleProp<ViewStyle>;
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  gloss?: boolean;
  [key: string]: any;
}

export const Jelly: ForwardRefExoticComponent<JellyProps & RefAttributes<View>>;
