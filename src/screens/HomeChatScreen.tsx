import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlipMascot } from '../components/BlipMascot';
import { formatTimeOfDay } from '../models';
import { getAiReply } from '../services/ai';
import { useBackend } from '../services/backend';
import { BlipColors } from '../theme';

export function HomeChatScreen({ onMenuTap }: { onMenuTap: () => void }) {
  const backend = useBackend();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef<FlatList>(null);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setSending(true);
    await backend.addMessage(text, true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

    const reply = await getAiReply({
      userMessage: text,
      history: backend.messages,
      currentMood: backend.latestMood,
      username: backend.username,
    });
    await backend.addMessage(reply, false);
    setSending(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }

  const initial = (backend.username[0] ?? 'A').toUpperCase();
  const q = searchQuery.trim().toLowerCase();
  const searchResults = backend.messages.filter(
    (m) => !q || m.text.toLowerCase().includes(q)
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 12}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={onMenuTap} hitSlop={8}>
          <Ionicons name="menu" size={28} color="#111" />
        </Pressable>
        <Pressable style={styles.pillBtn} onPress={() => setSearchOpen(true)}>
          <Ionicons name="search" size={16} color="#fff" />
          <Text style={styles.pillText}>Search</Text>
        </Pressable>
      </View>

      {/* Mascot + speech bubble */}
      <View style={styles.hero}>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>How are you {backend.username}?</Text>
        </View>
        <View style={styles.speechTail} />
        <BlipMascot mood={backend.latestMood} size={130} />
      </View>

      {/* Chat thread */}
      <View style={styles.chatArea}>
        <FlatList
          ref={listRef}
          data={
            sending
              ? [
                  ...backend.messages,
                  { id: 'typing', text: 'BLIP! is thinking…', isUser: false, createdAt: '' },
                ]
              : backend.messages
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Say hi to BLIP! anytime.</Text>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.isUser ? styles.userBubble : styles.blipBubble,
              ]}
            >
              <Text style={styles.bubbleText}>{item.text}</Text>
              {!!item.createdAt && (
                <Text style={[styles.bubbleTime, item.isUser && { textAlign: 'right' }]}>
                  {formatTimeOfDay(item.createdAt)}
                </Text>
              )}
            </View>
          )}
        />
      </View>

      {/* Bottom input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <TextInput
          style={styles.chatInput}
          placeholder="Write a message…"
          placeholderTextColor="#666"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendBtn, (!draft.trim() || sending) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!draft.trim() || sending}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Search Convo Modal */}
      <Modal
        visible={searchOpen}
        animationType="slide"
        onRequestClose={() => setSearchOpen(false)}
      >
        <View style={[styles.searchRoot, { paddingTop: insets.top + 10 }]}>
          <View style={styles.searchHeader}>
            <Pressable style={styles.iconBtn} onPress={() => setSearchOpen(false)}>
              <Ionicons name="chevron-back" size={28} color="#111" />
            </Pressable>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.8)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversation…"
                placeholderTextColor="rgba(255,255,255,0.75)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {!!searchQuery && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
                </Pressable>
              )}
            </View>
          </View>
          <View style={styles.searchBody}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20 }}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No matching messages.</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.searchRow}>
                  {item.isUser ? (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarLetter}>{initial}</Text>
                    </View>
                  ) : (
                    <BlipMascot mood="neutral" size={46} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchMsg}>{item.text}</Text>
                    <Text style={styles.searchTime}>{formatTimeOfDay(item.createdAt)}</Text>
                  </View>
                </View>
              )}
            />
            <Pressable
              style={[styles.closeChevron, { paddingBottom: Math.max(12, insets.bottom) }]}
              onPress={() => setSearchOpen(false)}
            >
              <Ionicons name="chevron-down" size={38} color="#fff" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BlipColors.sage },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 52,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BlipColors.accentBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 2,
  },
  pillText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  hero: { alignItems: 'center', paddingTop: 2, paddingBottom: 10 },
  speechBubble: {
    backgroundColor: BlipColors.inputFill,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  speechText: { fontSize: 14, fontWeight: '600', color: BlipColors.textDark },
  speechTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: BlipColors.inputFill,
    marginBottom: 4,
  },
  chatArea: { flex: 1, backgroundColor: BlipColors.slateTeal },
  chatList: { padding: 16, gap: 12 },
  emptyText: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 15,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
  },
  blipBubble: {
    alignSelf: 'flex-start',
    backgroundColor: BlipColors.inputFill,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#E7EEF0',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 15, color: BlipColors.textDark, lineHeight: 20 },
  bubbleTime: { fontSize: 11, color: '#666', marginTop: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BlipColors.sage,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: BlipColors.inputFill,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 15,
    color: BlipColors.textDark,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BlipColors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  searchRoot: { flex: 1, backgroundColor: BlipColors.sage },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BlipColors.slateTeal,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontStyle: 'italic',
    padding: 0,
  },
  searchBody: { flex: 1, backgroundColor: BlipColors.slateTeal },
  searchRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingVertical: 8 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: BlipColors.avatarIndigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 20, fontWeight: '600' },
  searchMsg: { color: '#fff', fontSize: 16, lineHeight: 22 },
  searchTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'right', marginTop: 6 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 10 },
  closeChevron: { alignItems: 'center', paddingTop: 8 },
});
