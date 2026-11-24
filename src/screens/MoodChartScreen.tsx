import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlipMascot } from '../components/BlipMascot';
import {
  formatMonthDayYear,
  formatRelativeTime,
  isSameDay,
  latestMoodByDay,
  weekDaysFor,
} from '../models';
import { useBackend } from '../services/backend';
import { BlipColors, getMoodMeta, MOODS, MoodId } from '../theme';

const DAY_LABELS = ['M', 'T', 'W', 'TH', 'F', 'SA', 'SU'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function MoodChartScreen({ onMenuTap }: { onMenuTap: () => void }) {
  const backend = useBackend();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [moodModalOpen, setMoodModalOpen] = useState(false);
  const [pickedMood, setPickedMood] = useState<MoodId | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  const [calYear, setCalYear] = useState(selectedDate.getFullYear());
  const [calMonth, setCalMonth] = useState(selectedDate.getMonth());
  const [calMode, setCalMode] = useState<'day' | 'month' | 'year'>('day');
  const [toast, setToast] = useState<string | null>(null);

  const weekDays = weekDaysFor(selectedDate);
  const byDay = latestMoodByDay(backend.moods, selectedDate);

  const visibleLogs =
    selectedDayIdx === null
      ? backend.moods
      : backend.moods.filter((m) =>
          isSameDay(new Date(m.createdAt), weekDays[selectedDayIdx])
        );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 2200);
  }

  async function saveMood() {
    if (!pickedMood) return;
    const label = getMoodMeta(pickedMood).label;
    await backend.logMood(pickedMood);
    setPickedMood(null);
    setMoodModalOpen(false);
    showToast(`Logged ${label}!`);
  }

  function openCalendar() {
    setCalYear(selectedDate.getFullYear());
    setCalMonth(selectedDate.getMonth());
    setCalMode('day');
    setCalOpen(true);
  }

  const firstWeekday = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const dayCells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={onMenuTap} hitSlop={8}>
          <Ionicons name="menu" size={28} color="#111" />
        </Pressable>
        <Pressable style={styles.pillBtn} onPress={openCalendar}>
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.pillText}>History</Text>
        </Pressable>
      </View>

      {toast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <Text style={styles.subHeading}>1 week(s)</Text>

      {/* Weekly bar chart */}
      <View style={styles.chartRow}>
        {DAY_LABELS.map((label, i) => {
          const moodId = byDay[i];
          const meta = moodId ? getMoodMeta(moodId) : null;
          const height = meta ? 170 * meta.chartWeight : 36;
          const active = selectedDayIdx === i;
          return (
            <Pressable
              key={label}
              style={styles.barSlot}
              onPress={() => setSelectedDayIdx(active ? null : i)}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: meta
                      ? meta.barColor
                      : 'rgba(82,119,127,0.35)',
                    borderWidth: active ? 2.5 : 0,
                    borderColor: '#fff',
                  },
                ]}
              >
                <Text style={styles.barLabel}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.dateLabel}>
        {formatMonthDayYear(
          selectedDayIdx !== null ? weekDays[selectedDayIdx] : selectedDate
        )}
      </Text>

      {/* Mood logs */}
      <View style={styles.logsArea}>
        <FlatList
          data={visibleLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 14 }}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No moods logged for this day yet.</Text>
          }
          renderItem={({ item }) => {
            const meta = getMoodMeta(item.mood);
            return (
              <View style={styles.logRow}>
                <View style={[styles.dot, { backgroundColor: meta.barColor }]} />
                <Text style={styles.logLabel}>{meta.label}</Text>
                <Text style={styles.logTime}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
            );
          }}
        />
      </View>

      {/* Bottom Log Mood CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(14, insets.bottom) }]}>
        <Pressable
          style={styles.logMoodBtn}
          onPress={() => {
            setPickedMood(null);
            setMoodModalOpen(true);
          }}
        >
          <Text style={styles.logMoodText}>Log Mood</Text>
        </Pressable>
      </View>

      {/* How We Feeling? Modal */}
      <Modal
        visible={moodModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMoodModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How We Feeling?</Text>
            <View style={styles.moodGrid}>
              {MOODS.map((m) => {
                const selected = pickedMood === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setPickedMood(m.id)}
                    style={[
                      styles.moodTile,
                      {
                        backgroundColor: m.cardColor,
                        borderColor: selected ? BlipColors.accentBlue : 'transparent',
                      },
                    ]}
                  >
                    <BlipMascot mood={m.id} size={44} />
                    <Text style={styles.moodTileLabel} numberOfLines={1} adjustsFontSizeToFit>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalActionBtn}
                onPress={saveMood}
                disabled={!pickedMood}
              >
                <Text
                  style={[
                    styles.modalActionText,
                    { color: pickedMood ? BlipColors.accentBlue : '#aaa' },
                  ]}
                >
                  Save
                </Text>
              </Pressable>
              <Text style={styles.actionSep}>|</Text>
              <Pressable
                style={styles.modalActionBtn}
                onPress={() => setMoodModalOpen(false)}
              >
                <Text style={[styles.modalActionText, { color: '#666' }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Date / Month / Year Picker Modal */}
      <Modal
        visible={calOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.calHeader}>
              <Pressable
                onPress={() => setCalMode(calMode === 'month' ? 'day' : 'month')}
              >
                <Text style={styles.calHeaderText}>{MONTH_NAMES[calMonth]} ▾</Text>
              </Pressable>
              <Pressable
                onPress={() => setCalMode(calMode === 'year' ? 'day' : 'year')}
              >
                <Text style={styles.calHeaderText}>{calYear} ▾</Text>
              </Pressable>
            </View>

            {calMode === 'day' && (
              <>
                <View style={styles.calWeekRow}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                    <Text key={idx} style={styles.calWeekLabel}>
                      {d}
                    </Text>
                  ))}
                </View>
                <View style={styles.calGrid}>
                  {dayCells.map((day, idx) => {
                    const isSel =
                      day !== null &&
                      selectedDate.getFullYear() === calYear &&
                      selectedDate.getMonth() === calMonth &&
                      selectedDate.getDate() === day;
                    return (
                      <Pressable
                        key={idx}
                        style={styles.calCell}
                        disabled={day === null}
                        onPress={() => {
                          if (day === null) return;
                          setSelectedDate(new Date(calYear, calMonth, day));
                          setSelectedDayIdx(null);
                          setCalOpen(false);
                        }}
                      >
                        {day !== null && (
                          <View style={[styles.calDayCircle, isSel && styles.calDayActive]}>
                            <Text style={[styles.calDayText, isSel && { color: '#fff' }]}>
                              {day}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {calMode === 'month' && (
              <View style={styles.calPickGrid}>
                {SHORT_MONTHS.map((m, idx) => (
                  <Pressable
                    key={m}
                    style={[
                      styles.calPickCell,
                      idx === calMonth && styles.calPickActive,
                    ]}
                    onPress={() => {
                      setCalMonth(idx);
                      setCalMode('day');
                    }}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        idx === calMonth && { color: '#fff' },
                      ]}
                    >
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {calMode === 'year' && (
              <View style={styles.calPickGrid}>
                {Array.from({ length: 16 }, (_, i) => 2020 + i).map((y) => (
                  <Pressable
                    key={y}
                    style={[styles.calPickCell, y === calYear && styles.calPickActive]}
                    onPress={() => {
                      setCalYear(y);
                      setCalMode('day');
                    }}
                  >
                    <Text
                      style={[styles.calDayText, y === calYear && { color: '#fff' }]}
                    >
                      {y}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable onPress={() => setCalOpen(false)} style={{ marginTop: 14 }}>
              <Text style={[styles.modalActionText, { color: '#666' }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
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
  subHeading: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: BlipColors.textDark },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 184,
    paddingHorizontal: 18,
    marginTop: 8,
    gap: 8,
  },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: {
    width: '100%',
    borderRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 7,
  },
  barLabel: { color: '#fff', fontWeight: '700', fontSize: 12 },
  dateLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: BlipColors.textDark,
    marginVertical: 10,
  },
  logsArea: { flex: 1, backgroundColor: BlipColors.slateTeal },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  logLabel: { flex: 1, color: '#fff', fontSize: 20 },
  logTime: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  emptyText: { color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 30, fontSize: 15 },
  bottomBar: { backgroundColor: BlipColors.sage, paddingHorizontal: 32, paddingTop: 12 },
  logMoodBtn: {
    backgroundColor: BlipColors.accentBlue,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  logMoodText: { color: '#fff', fontSize: 19, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 21, fontWeight: '700', marginBottom: 14, color: BlipColors.textDark },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    width: '100%',
  },
  moodTile: {
    width: '23.5%',
    borderRadius: 12,
    borderWidth: 2.5,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 6,
  },
  moodTileLabel: { fontSize: 11, fontWeight: '600', color: BlipColors.textDark },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  modalActionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  modalActionText: { fontSize: 18, fontWeight: '600' },
  actionSep: { fontSize: 20, color: '#bbb' },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  calHeaderText: { fontSize: 19, fontWeight: '600', color: BlipColors.textDark },
  calWeekRow: { flexDirection: 'row', width: '100%', marginBottom: 8 },
  calWeekLabel: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 14 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calDayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayActive: { backgroundColor: BlipColors.accentBlue },
  calDayText: { fontSize: 15, color: BlipColors.textDark },
  calPickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    rowGap: 8,
  },
  calPickCell: {
    width: '25%',
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
  },
  calPickActive: { backgroundColor: BlipColors.accentBlue },
});
