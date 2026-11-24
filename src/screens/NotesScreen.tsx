import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { formatShortDate, NoteFolder, NoteItem } from '../models';
import { useBackend } from '../services/backend';
import { BlipColors } from '../theme';

export function NotesScreen({ onMenuTap }: { onMenuTap: () => void }) {
  const backend = useBackend();
  const insets = useSafeAreaInsets();
  const [activeFolder, setActiveFolder] = useState<NoteFolder | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Add Folder modal
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState('');

  // Note Editor modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteFolderId, setNoteFolderId] = useState<string | null>(null);
  const [noteImage, setNoteImage] = useState<string | null>(null);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 2400);
  }

  const q = query.trim().toLowerCase();
  const visibleNotes = backend.notes.filter((n) => {
    const inFolder = !activeFolder || n.folderId === activeFolder.id;
    const matches =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.body.toLowerCase().includes(q);
    return inFolder && matches;
  });

  function folderNameFor(id?: string | null): string | null {
    if (!id) return null;
    return backend.folders.find((f) => f.id === id)?.name ?? null;
  }

  function openEditor(existing?: NoteItem) {
    setEditingId(existing?.id ?? '');
    setNoteTitle(existing?.title ?? '');
    setNoteBody(existing?.body ?? '');
    setNoteFolderId(existing ? (existing.folderId ?? null) : (activeFolder?.id ?? null));
    setNoteImage(existing?.imageUri ?? null);
    setBold(existing?.bold ?? false);
    setItalic(existing?.italic ?? false);
    setUnderline(existing?.underline ?? false);
    setAlign(existing?.align ?? 'left');
    setEditorOpen(true);
  }

  const canSave = noteTitle.trim().length > 0 || noteBody.trim().length > 0;

  async function handleSaveNote() {
    if (!canSave || saving) {
      if (!canSave) Alert.alert('BLIP!', 'Add a title or some text before saving.');
      return;
    }
    setSaving(true);
    try {
      await backend.saveNote({
        id: editingId,
        title: noteTitle.trim() || 'Untitled',
        body: noteBody.trim(),
        folderId: noteFolderId,
        imageUri: noteImage,
        bold,
        italic,
        underline,
        align,
      });
      setEditorOpen(false);
      showToast(editingId ? 'Note updated!' : 'Note saved!');
    } catch {
      Alert.alert('BLIP!', 'Could not save note. Check your Firestore connection.');
    } finally {
      setSaving(false);
    }
  }

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setNoteImage(res.assets[0].uri);
    }
  }

  async function handleCreateFolder() {
    const clean = folderName.trim();
    if (clean) {
      await backend.addFolder(clean);
      showToast(`Folder "${clean}" added!`);
    }
    setFolderName('');
    setFolderModalOpen(false);
  }

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={onMenuTap} hitSlop={8}>
          <Ionicons name="menu" size={28} color="#111" />
        </Pressable>
        {searching && (
          <TextInput
            style={styles.searchField}
            placeholder="Search notes…"
            placeholderTextColor="#555"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        )}
        <Pressable
          style={styles.pillBtn}
          onPress={() => {
            setSearching((v) => !v);
            if (searching) setQuery('');
          }}
        >
          <Ionicons name={searching ? 'close' : 'search'} size={16} color="#fff" />
          <Text style={styles.pillText}>{searching ? 'Close' : 'Search'}</Text>
        </Pressable>
      </View>

      {toast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Folders strip or Inside-folder header */}
      {!activeFolder ? (
        <View style={styles.folderStripWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.folderRow}
          >
            {backend.folders.map((f) => (
              <Pressable
                key={f.id}
                style={styles.folderItem}
                onPress={() => setActiveFolder(f)}
              >
                <Ionicons name="folder" size={52} color="#111" />
                <Text style={styles.folderLabel} numberOfLines={1}>
                  {f.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.insideFolderHeader}>
          <Pressable style={styles.iconBtn} onPress={() => setActiveFolder(null)} hitSlop={8}>
            <Ionicons name="chevron-back" size={30} color="#111" />
          </Pressable>
          <Ionicons name="folder-open" size={44} color="#111" />
          <Text style={styles.insideFolderTitle} numberOfLines={1}>
            {activeFolder.name}
          </Text>
        </View>
      )}

      {/* Notes list */}
      <FlatList
        data={visibleNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notesList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notes here yet. Tap "Add notes" below.</Text>
        }
        renderItem={({ item }) => {
          const fName = folderNameFor(item.folderId);
          return (
            <Pressable style={styles.noteCard} onPress={() => openEditor(item)}>
              <View style={styles.noteCardHeader}>
                <Text style={styles.noteTitle} numberOfLines={1}>
                  {item.title || 'Untitled'}
                </Text>
                {fName && !activeFolder && (
                  <View style={styles.folderBadge}>
                    <Ionicons name="folder-outline" size={12} color={BlipColors.slateDark} />
                    <Text style={styles.folderBadgeText}>{fName}</Text>
                  </View>
                )}
              </View>
              {!!item.body && (
                <Text style={styles.notePreview} numberOfLines={2}>
                  {item.body}
                </Text>
              )}
              <Text style={styles.noteDate}>{formatShortDate(item.updatedAt)}</Text>
            </Pressable>
          );
        }}
      />

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <Pressable style={styles.bottomAction} onPress={() => setFolderModalOpen(true)}>
          <Ionicons name="folder-open-outline" size={28} color="#111" />
          <Text style={styles.bottomLabel}>Add Folder</Text>
        </Pressable>
        <Pressable style={styles.bottomAction} onPress={() => openEditor()}>
          <Ionicons name="create-outline" size={28} color="#111" />
          <Text style={styles.bottomLabel}>Add notes</Text>
        </Pressable>
      </View>

      {/* Add Folder Modal */}
      <Modal
        visible={folderModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFolderModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              style={styles.folderInput}
              placeholder="Name folder"
              placeholderTextColor="#666"
              value={folderName}
              onChangeText={setFolderName}
              onSubmitEditing={handleCreateFolder}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalActionBtn} onPress={handleCreateFolder}>
                <Text style={[styles.modalActionText, { color: BlipColors.accentBlue }]}>
                  Add
                </Text>
              </Pressable>
              <Text style={{ fontSize: 20, color: '#bbb' }}>|</Text>
              <Pressable
                style={styles.modalActionBtn}
                onPress={() => setFolderModalOpen(false)}
              >
                <Text style={[styles.modalActionText, { color: '#666' }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Note Editor Modal */}
      <Modal
        visible={editorOpen}
        animationType="slide"
        onRequestClose={() => setEditorOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.editorRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Editor Header with clear Save CTA */}
          <View style={[styles.editorHeader, { paddingTop: insets.top + 10 }]}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => setEditorOpen(false)}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={28} color="#111" />
            </Pressable>
            <TextInput
              style={styles.editorTitle}
              placeholder="Note title…"
              placeholderTextColor="#666"
              value={noteTitle}
              onChangeText={setNoteTitle}
            />
            {!!editingId && (
              <Pressable
                style={styles.iconBtn}
                onPress={async () => {
                  await backend.deleteNote(editingId);
                  setEditorOpen(false);
                  showToast('Note deleted');
                }}
              >
                <Ionicons name="trash-outline" size={22} color={BlipColors.danger} />
              </Pressable>
            )}
            <Pressable
              style={[styles.savePill, (!canSave || saving) && { opacity: 0.45 }]}
              onPress={handleSaveNote}
              disabled={!canSave || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.savePillText}>Done</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Folder selector strip inside editor */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.folderPickerBar}
            contentContainerStyle={styles.folderPickerContent}
          >
            <Pressable
              style={[styles.folderChip, noteFolderId === null && styles.folderChipActive]}
              onPress={() => setNoteFolderId(null)}
            >
              <Text
                style={[
                  styles.folderChipText,
                  noteFolderId === null && { color: '#fff' },
                ]}
              >
                All Notes
              </Text>
            </Pressable>
            {backend.folders.map((f) => {
              const active = noteFolderId === f.id;
              return (
                <Pressable
                  key={f.id}
                  style={[styles.folderChip, active && styles.folderChipActive]}
                  onPress={() => setNoteFolderId(f.id)}
                >
                  <Text style={[styles.folderChipText, active && { color: '#fff' }]}>
                    {f.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Formatting bar */}
          <View style={styles.formatBar}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <Pressable
                key={a}
                style={[styles.fmtBtn, align === a && styles.fmtActive]}
                onPress={() => setAlign(a)}
              >
                <Ionicons
                  name={
                    a === 'left'
                      ? 'reorder-three-outline'
                      : a === 'center'
                      ? 'menu-outline'
                      : 'filter-outline'
                  }
                  size={18}
                  color={align === a ? '#fff' : '#111'}
                />
              </Pressable>
            ))}
            <Pressable
              style={styles.fmtBtn}
              onPress={() =>
                setNoteBody((b) => (b && !b.endsWith('\n') ? `${b}\n• ` : `${b}• `))
              }
            >
              <Ionicons name="list" size={18} color="#111" />
            </Pressable>
            <Pressable
              style={[styles.fmtBtn, bold && styles.fmtActive]}
              onPress={() => setBold((v) => !v)}
            >
              <Text style={[styles.fmtText, { fontWeight: '800' }, bold && { color: '#fff' }]}>
                B
              </Text>
            </Pressable>
            <Pressable
              style={[styles.fmtBtn, italic && styles.fmtActive]}
              onPress={() => setItalic((v) => !v)}
            >
              <Text style={[styles.fmtText, { fontStyle: 'italic' }, italic && { color: '#fff' }]}>
                I
              </Text>
            </Pressable>
            <Pressable
              style={[styles.fmtBtn, underline && styles.fmtActive]}
              onPress={() => setUnderline((v) => !v)}
            >
              <Text
                style={[
                  styles.fmtText,
                  { textDecorationLine: 'underline' },
                  underline && { color: '#fff' },
                ]}
              >
                U
              </Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {noteImage && (
              <View style={styles.imgWrap}>
                <Image source={{ uri: noteImage }} style={styles.noteImg} />
                <Pressable style={styles.removeImg} onPress={() => setNoteImage(null)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            )}
            <TextInput
              style={[
                styles.editorBody,
                {
                  textAlign: align,
                  fontWeight: bold ? '700' : '400',
                  fontStyle: italic ? 'italic' : 'normal',
                  textDecorationLine: underline ? 'underline' : 'none',
                },
              ]}
              placeholder="Write your note here…"
              placeholderTextColor="#777"
              multiline
              textAlignVertical="top"
              value={noteBody}
              onChangeText={setNoteBody}
            />
          </ScrollView>

          <View style={[styles.editorBottom, { paddingBottom: Math.max(14, insets.bottom) }]}>
            <Pressable
              style={[styles.bottomAction, (!canSave || saving) && { opacity: 0.45 }]}
              onPress={handleSaveNote}
              disabled={!canSave || saving}
            >
              <Ionicons name="save-outline" size={28} color="#111" />
              <Text style={styles.bottomLabel}>{saving ? 'Saving…' : 'Save note'}</Text>
            </Pressable>
            <Pressable style={styles.bottomAction} onPress={pickImage}>
              <Ionicons name="image-outline" size={28} color="#111" />
              <Text style={styles.bottomLabel}>Add Image</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BlipColors.sage },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  searchField: {
    flex: 1,
    backgroundColor: BlipColors.inputFill,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: BlipColors.textDark,
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
  toast: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BlipColors.slateDark,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 4,
  },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  folderStripWrap: { paddingVertical: 6 },
  folderRow: { paddingHorizontal: 18, gap: 18, alignItems: 'center' },
  folderItem: { alignItems: 'center', width: 78 },
  folderLabel: { color: '#fff', fontSize: 15, fontStyle: 'italic', marginTop: 2 },
  insideFolderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  insideFolderTitle: { flex: 1, color: '#fff', fontSize: 22, fontStyle: 'italic' },
  notesList: { paddingHorizontal: 18, paddingVertical: 10, gap: 12 },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  noteTitle: { flex: 1, fontSize: 19, fontWeight: '600', color: BlipColors.textDark },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(142,184,173,0.28)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  folderBadgeText: { fontSize: 11, fontWeight: '600', color: BlipColors.slateDark },
  notePreview: { fontSize: 14, color: BlipColors.textMuted, marginTop: 6, lineHeight: 20 },
  noteDate: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 12 },
  emptyText: { color: 'rgba(0,0,0,0.55)', textAlign: 'center', marginTop: 40, fontSize: 15 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    backgroundColor: BlipColors.sage,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  bottomAction: { alignItems: 'center', gap: 3, paddingHorizontal: 16, paddingVertical: 4 },
  bottomLabel: { fontSize: 12, fontWeight: '600', color: BlipColors.textDark },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 19, fontWeight: '700', marginBottom: 12, color: BlipColors.textDark },
  folderInput: {
    backgroundColor: BlipColors.inputFill,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BlipColors.textDark,
  },
  modalActions: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  modalActionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  modalActionText: { fontSize: 17, fontWeight: '600' },
  editorRoot: { flex: 1, backgroundColor: '#fff' },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BlipColors.inputFill,
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  editorTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: BlipColors.textDark,
    paddingVertical: 4,
  },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BlipColors.accentBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  savePillText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  folderPickerBar: {
    maxHeight: 46,
    backgroundColor: '#F3F6F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8E6',
  },
  folderPickerContent: { paddingHorizontal: 12, alignItems: 'center', gap: 8 },
  folderChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#DDE7E4',
  },
  folderChipActive: { backgroundColor: BlipColors.slateTeal },
  folderChipText: { fontSize: 13, fontWeight: '600', color: BlipColors.textDark },
  formatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fmtBtn: {
    minWidth: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  fmtActive: { backgroundColor: BlipColors.accentBlue },
  fmtText: { fontSize: 15, color: '#111' },
  imgWrap: { position: 'relative', marginBottom: 14 },
  noteImg: { width: '100%', height: 180, borderRadius: 12 },
  removeImg: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorBody: { fontSize: 17, lineHeight: 25, minHeight: 240, color: BlipColors.textDark },
  editorBottom: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    backgroundColor: BlipColors.inputFill,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
});
