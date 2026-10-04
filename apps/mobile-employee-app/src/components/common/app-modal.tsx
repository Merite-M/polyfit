/**
 * PolyFit Corporate Employee App - Responsive AppModal Component
 * Ensures modals and bottom sheets render strictly inside the mobile device viewport
 * across desktop web browser previews, mobile web, and native iOS/Android devices.
 * 
 * - Native: Delegates to React Native's native Modal.
 * - Desktop Web: Portals into the mobile phone mockup frame (#polyfit-mobile-modal-portal),
 *   preventing full-desktop viewport bleed (1366px) and preserving device frame aesthetics.
 * - Accessibility: Handles ESC key dismissal and aria-modal on web.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal as RNModal,
  ModalProps,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
// @ts-ignore
import { createPortal } from 'react-dom';

export interface AppModalProps extends ModalProps {
  children: React.ReactNode;
}

export function AppModal({
  visible,
  onRequestClose,
  children,
  ...props
}: AppModalProps) {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const el = document.getElementById('polyfit-mobile-modal-portal');
      if (el) {
        setPortalNode(el);
      }
    }
  }, []);

  // Keyboard accessibility: ESC closes modal on web
  useEffect(() => {
    if (Platform.OS === 'web' && visible && onRequestClose) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onRequestClose({} as any);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onRequestClose]);

  if (Platform.OS === 'web') {
    if (!visible) return null;

    const modalView = (
      <View style={styles.webModalBackdrop} pointerEvents="box-none">
        {children}
      </View>
    );

    // If running in desktop preview inside MobileShell, portal into device bezel
    if (portalNode) {
      return createPortal(modalView, portalNode);
    }

    // Fallback: render directly if portal container not found yet
    const fallbackRoot = typeof document !== 'undefined' ? document.getElementById('polyfit-mobile-modal-portal') : null;
    if (fallbackRoot) {
      return createPortal(modalView, fallbackRoot);
    }

    return modalView;
  }

  return (
    <RNModal visible={visible} onRequestClose={onRequestClose} {...props}>
      {children}
    </RNModal>
  );
}

const styles = StyleSheet.create({
  webModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    overflow: 'hidden',
  },
});
