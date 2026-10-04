import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Compass } from 'lucide-react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Compass size={40} color={Palette.green} />
        </View>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Text style={styles.subtitle}>Let's get you back to your corporate wellness benefits.</Text>
        <Link href="/index" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Go to Access Pass</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: '#071521',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(40, 209, 124, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: Spacing.two,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  button: {
    backgroundColor: Palette.green,
    paddingHorizontal: Spacing.five,
    paddingVertical: 12,
    borderRadius: Radius.btn,
  },
  buttonText: {
    color: '#0B1F33',
    fontWeight: '700',
    fontSize: 14,
  },
});
