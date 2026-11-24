import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackendProvider, useBackend } from './src/services/backend';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeChatScreen } from './src/screens/HomeChatScreen';
import { MoodChartScreen } from './src/screens/MoodChartScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BlipColors } from './src/theme';

type Page = 'home' | 'mood' | 'notes' | 'settings';

function AppContent() {
  const backend = useBackend();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<Page>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!backend.signedIn) {
    return (
      <SafeAreaView style={styles.sageSafe}>
        <LoginScreen />
      </SafeAreaView>
    );
  }

  const initial = (backend.username[0] ?? 'A').toUpperCase();

  function navTo(target: Page) {
    setPage(target);
    setDrawerOpen(false);
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[
        styles.sageSafe,
        page === 'settings' && { backgroundColor: BlipColors.slateTeal },
      ]}
    >
      {page === 'home' && <HomeChatScreen onMenuTap={() => setDrawerOpen(true)} />}
      {page === 'mood' && <MoodChartScreen onMenuTap={() => setDrawerOpen(true)} />}
      {page === 'notes' && <NotesScreen onMenuTap={() => setDrawerOpen(true)} />}
      {page === 'settings' && <SettingsScreen onBack={() => setPage('home')} />}

      {/* Slide-over Navigation Drawer */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.drawerOverlay}>
          <View
            style={[
              styles.drawerPanel,
              {
                paddingTop: insets.top + 12,
                paddingBottom: Math.max(20, insets.bottom),
              },
            ]}
          >
            <Pressable
              style={styles.drawerClose}
              onPress={() => setDrawerOpen(false)}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={28} color="#111" />
            </Pressable>

            <View style={styles.profileWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{initial}</Text>
              </View>
              <Text style={styles.username}>{backend.username}</Text>
            </View>

            <View style={styles.menuList}>
              <View style={styles.divider} />
              {(
                [
                  ['Home', 'home', 'chatbubble-ellipses-outline'],
                  ['Mood Chart & History', 'mood', 'bar-chart-outline'],
                  ['Notes', 'notes', 'document-text-outline'],
                  ['Settings', 'settings', 'settings-outline'],
                ] as const
              ).map(([label, target, icon]) => (
                <React.Fragment key={target}>
                  <Pressable
                    style={[
                      styles.menuItem,
                      page === target && styles.menuItemActive,
                    ]}
                    onPress={() => navTo(target)}
                  >
                    <Ionicons
                      name={icon}
                      size={20}
                      color={page === target ? BlipColors.slateDark : '#444'}
                    />
                    <Text
                      style={[
                        styles.menuText,
                        page === target && { fontWeight: '700' },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                  <View style={styles.divider} />
                </React.Fragment>
              ))}
              <Pressable
                style={styles.menuItem}
                onPress={async () => {
                  setDrawerOpen(false);
                  await backend.signOut();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#444" />
                <Text style={styles.menuText}>Log out</Text>
              </Pressable>
              <View style={styles.divider} />
            </View>
          </View>
          <Pressable style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <BackendProvider>
        <StatusBar style="dark" />
        <AppContent />
      </BackendProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  sageSafe: { flex: 1, backgroundColor: BlipColors.sage },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawerPanel: {
    width: 285,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
  },
  drawerClose: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileWrap: { alignItems: 'center', marginTop: 8, marginBottom: 24 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BlipColors.avatarIndigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 44, fontWeight: '500' },
  username: { marginTop: 12, fontSize: 18, fontStyle: 'italic', color: BlipColors.textDark },
  menuList: { width: '100%' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  menuItemActive: { backgroundColor: 'rgba(142,184,173,0.24)', borderRadius: 8 },
  menuText: { fontSize: 17, fontStyle: 'italic', color: BlipColors.textDark },
  divider: { height: 1, backgroundColor: '#ddd' },
});
