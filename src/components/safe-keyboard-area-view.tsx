import { Platform, KeyboardAvoidingView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
};

export function SafeKeyboardAreaView({ children, edges = ['top'], style }: Props) {
  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});