import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={32} color={Palette.green} />
            </View>
            <Text style={styles.title}>Something unexpected happened</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'The application encountered an unexpected error.'}
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={this.handleReset}
              accessibilityRole="button"
              accessibilityLabel="Retry loading application"
            >
              <RefreshCw size={16} color="#0B1F33" />
              <Text style={styles.retryButtonText}>Reload Interface</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071521',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    backgroundColor: '#0B1F33',
    borderRadius: Radius.card,
    padding: Spacing.five,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.four,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.green,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.btn,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B1F33',
  },
});
