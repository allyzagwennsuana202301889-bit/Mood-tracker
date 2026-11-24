import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBackend } from '../services/backend';
import { BlipColors } from '../theme';

type CredField = 'Username' | 'Email' | 'Password' | null;

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const backend = useBackend();
  const [accountOpen, setAccountOpen] = useState(false);
  const [credField, setCredField] = useState<CredField>(null);
  const [currVal, setCurrVal] = useState('');
  const [nextVal, setNextVal] = useState('');
  const [confirmVal, setConfirmVal] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  async function confirmCredentialChange() {
    if (nextVal !== confirmVal) {
      Alert.alert('BLIP!', 'New values do not match.');
      return;
    }
    const err =
      credField === 'Username'
        ? await backend.updateUsername(nextVal)
        : credField === 'Email'
        ? await backend.updateEmail(nextVal)
        : await backend.updatePassword(nextVal);
    setCurrVal('');
    setNextVal('');
    setConfirmVal('');
    const label = credField;
    setCredField(null);
    Alert.alert('BLIP!', err ?? `${label} updated.`);
  }

  return (
    <View style={styles.root}>
      {/* Slate-teal header */}
      <View style={styles.header}>
        <Ionicons name="settings" size={32} color="#fff" />
        <Text style={styles.headerTitle}>Settings</Text>
        <Pressable style={styles.iconBtn} onPress={onBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={30} color="#fff" />
        </Pressable>
      </View>

      <ScrollView>
        <Pressable style={styles.row} onPress={() => setAccountOpen(true)}>
          <View style={styles.avatarIcon}>
            <Ionicons name="person-outline" size={28} color={BlipColors.accentBlue} />
          </View>
          <Text style={styles.rowText}>Account Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </Pressable>
        <View style={styles.divider} />

        <Pressable style={styles.row} onPress={() => setNotifOpen(true)}>
          <View style={styles.iconBox}>
            <Ionicons name="mail-unread-outline" size={30} color="#111" />
          </View>
          <Text style={styles.rowText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </Pressable>
        <View style={styles.divider} />

        <Pressable style={styles.row} onPress={() => setFeedbackOpen(true)}>
          <View style={styles.iconBox}>
            <Ionicons name="document-text-outline" size={30} color="#111" />
          </View>
          <Text style={styles.rowText}>Feedback</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </Pressable>
        <View style={styles.divider} />

        <Pressable style={styles.row} onPress={() => setHelpOpen(true)}>
          <View style={styles.iconBox}>
            <Ionicons name="help-circle-outline" size={32} color="#111" />
          </View>
          <Text style={styles.rowText}>Help</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </Pressable>
      </ScrollView>

      {/* Account Settings Modal */}
      <Modal
        visible={accountOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Pressable
              style={styles.accRow}
              onPress={() => {
                setAccountOpen(false);
                setCredField('Username');
              }}
            >
              <View style={styles.accIconSmall}>
                <Ionicons name="person-outline" size={22} color={BlipColors.accentBlue} />
              </View>
              <Text style={styles.accLabel}>Change username</Text>
            </Pressable>
            <View style={styles.divider} />

            <Pressable
              style={styles.accRow}
              onPress={() => {
                setAccountOpen(false);
                setCredField('Email');
              }}
            >
              <View style={styles.accIconBox}>
                <Ionicons name="mail-outline" size={24} color="#111" />
              </View>
              <Text style={styles.accLabel}>Change Email</Text>
            </Pressable>
            <View style={styles.divider} />

            <Pressable
              style={styles.accRow}
              onPress={() => {
                setAccountOpen(false);
                setCredField('Password');
              }}
            >
              <View style={styles.accIconBox}>
                <Ionicons name="key-outline" size={24} color="#111" />
              </View>
              <Text style={styles.accLabel}>Change Password</Text>
            </Pressable>
            <View style={styles.divider} />

            <Pressable
              style={styles.accRow}
              onPress={() => {
                setAccountOpen(false);
                setDeleteOpen(true);
              }}
            >
              <View style={styles.accIconBox}>
                <Ionicons name="trash-outline" size={24} color={BlipColors.danger} />
              </View>
              <Text style={[styles.accLabel, { color: BlipColors.danger }]}>Delete Account</Text>
            </Pressable>

            <Pressable onPress={() => setAccountOpen(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Change Credential Modal */}
      <Modal
        visible={credField !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCredField(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.modalTitle}>Change {credField}</Text>
            <TextInput
              style={styles.input}
              placeholder={`Current ${credField}`}
              placeholderTextColor="#666"
              secureTextEntry={credField === 'Password'}
              value={currVal}
              onChangeText={setCurrVal}
            />
            <TextInput
              style={styles.input}
              placeholder={`New ${credField}`}
              placeholderTextColor="#666"
              secureTextEntry={credField === 'Password'}
              value={nextVal}
              onChangeText={setNextVal}
            />
            <TextInput
              style={styles.input}
              placeholder={`Confirm new ${credField}`}
              placeholderTextColor="#666"
              secureTextEntry={credField === 'Password'}
              value={confirmVal}
              onChangeText={setConfirmVal}
            />
            <View style={styles.actions}>
              <Pressable style={styles.actionBtn} onPress={confirmCredentialChange}>
                <Text style={[styles.actionText, { color: BlipColors.accentBlue }]}>
                  Confirm Change
                </Text>
              </Pressable>
              <Text style={{ fontSize: 20, color: '#bbb' }}>|</Text>
              <Pressable style={styles.actionBtn} onPress={() => setCredField(null)}>
                <Text style={[styles.actionText, { color: '#666' }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={[styles.modalTitle, { color: BlipColors.danger }]}>Delete Account?</Text>
            <Text style={styles.bodyText}>
              This will permanently delete your account and all your data. This can't be undone.
            </Text>
            <View style={styles.actions}>
              <Pressable
                style={styles.actionBtn}
                onPress={async () => {
                  const err = await backend.deleteAccount();
                  setDeleteOpen(false);
                  if (err) Alert.alert('BLIP!', err);
                }}
              >
                <Text style={[styles.actionText, { color: BlipColors.danger }]}>Confirm</Text>
              </Pressable>
              <Text style={{ fontSize: 20, color: '#bbb' }}>|</Text>
              <Pressable style={styles.actionBtn} onPress={() => setDeleteOpen(false)}>
                <Text style={[styles.actionText, { color: '#666' }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notifOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNotifOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600' }}>Daily mood check-in</Text>
                <Text style={{ fontSize: 13, color: '#666' }}>
                  Gentle reminder to log how you feel
                </Text>
              </View>
              <Switch
                value={backend.dailyReminder}
                onValueChange={backend.setDailyReminder}
              />
            </View>
            <Pressable onPress={() => setNotifOpen(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: BlipColors.accentBlue }]}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.modalTitle}>Feedback</Text>
            <TextInput
              style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
              placeholder="Share a suggestion or report a bug…"
              placeholderTextColor="#666"
              multiline
              value={feedbackText}
              onChangeText={setFeedbackText}
            />
            <View style={styles.actions}>
              <Pressable
                style={styles.actionBtn}
                onPress={async () => {
                  await backend.submitFeedback(feedbackText);
                  setFeedbackText('');
                  setFeedbackOpen(false);
                  Alert.alert('BLIP!', 'Thanks for your feedback!');
                }}
              >
                <Text style={[styles.actionText, { color: BlipColors.accentBlue }]}>Send</Text>
              </Pressable>
              <Text style={{ fontSize: 20, color: '#bbb' }}>|</Text>
              <Pressable style={styles.actionBtn} onPress={() => setFeedbackOpen(false)}>
                <Text style={[styles.actionText, { color: '#666' }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal
        visible={helpOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.modalTitle}>Help</Text>
            <Text style={styles.bodyText}>
              {'• Chat with BLIP! on the Home screen anytime.\n' +
                '• Log moods in Mood Chart & History to track your week.\n' +
                '• Organize journal entries into folders under Notes.\n\n' +
                'BLIP! is a supportive companion and not a substitute for professional mental health care.'}
            </Text>
            <Pressable onPress={() => setHelpOpen(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: BlipColors.accentBlue }]}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: BlipColors.slateTeal,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: '#fff', fontSize: 24, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 18,
  },
  avatarIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D6E6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, fontSize: 19, color: BlipColors.textDark, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#e4e4e4' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 10 },
  accRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 14 },
  accIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D6E6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accIconBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  accLabel: { fontSize: 17, color: BlipColors.textDark },
  cancelBtn: { alignItems: 'center', paddingTop: 10 },
  cancelText: { fontSize: 17, color: '#666', fontWeight: '600' },
  modalTitle: { fontSize: 21, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  bodyText: { fontSize: 15, lineHeight: 22, color: '#333', textAlign: 'center' },
  input: {
    backgroundColor: BlipColors.inputFill,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BlipColors.textDark,
  },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  actionText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
});
