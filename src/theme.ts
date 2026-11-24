export const BlipColors = {
  sage: '#8EB8AD',
  sageLight: '#A7CAC0',
  slateTeal: '#52777F',
  slateDark: '#3E5E66',
  accentBlue: '#3F92D2',
  avatarIndigo: '#6B74B8',
  inputFill: '#D9D9D9',
  white: '#FFFFFF',
  orbDark: '#2F2F2F',
  orbRim: '#3D3D3D',
  orbHighlight: '#4B4B4B',
  orbFace: '#E6E6E6',
  danger: '#E53935',
  textDark: '#1A1A1A',
  textMuted: '#666666',
} as const;

export type MoodId =
  | 'neutral'
  | 'happy'
  | 'excited'
  | 'calm'
  | 'tired'
  | 'anxious'
  | 'angry'
  | 'sad';

export interface MoodMeta {
  id: MoodId;
  label: string;
  cardColor: string;
  barColor: string;
  chartWeight: number;
}

export const MOODS: MoodMeta[] = [
  { id: 'neutral', label: 'Neutral', cardColor: '#C8DFD8', barColor: '#82A812', chartWeight: 0.44 },
  { id: 'happy', label: 'Happy', cardColor: '#ECE9A8', barColor: '#E4C45A', chartWeight: 0.92 },
  { id: 'excited', label: 'Excited', cardColor: '#FAC3A8', barColor: '#F0935B', chartWeight: 1.0 },
  { id: 'calm', label: 'Calm', cardColor: '#CCD7DF', barColor: '#5CA4C4', chartWeight: 0.72 },
  { id: 'tired', label: 'Tired', cardColor: '#C9CDC6', barColor: '#7D8E7A', chartWeight: 0.48 },
  { id: 'anxious', label: 'Anxious', cardColor: '#D1C7DF', barColor: '#9378B5', chartWeight: 0.68 },
  { id: 'angry', label: 'Angry', cardColor: '#F5B0B2', barColor: '#F25252', chartWeight: 0.85 },
  { id: 'sad', label: 'Sad', cardColor: '#B4D6F8', barColor: '#24729A', chartWeight: 0.56 },
];

export function getMoodMeta(id?: string | null): MoodMeta {
  return MOODS.find((m) => m.id === id) ?? MOODS[0];
}
