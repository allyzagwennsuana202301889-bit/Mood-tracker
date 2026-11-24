import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { BlipColors, MoodId } from '../theme';

interface Props {
  mood?: MoodId;
  sleeping?: boolean;
  size?: number;
}

export function BlipMascot({ mood = 'happy', sleeping = false, size = 150 }: Props) {
  const showCalmEyes = sleeping || mood === 'calm';

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {sleeping && (
        <View style={[styles.zzzWrap, { left: -size * 0.14, top: -size * 0.12 }]}>
          <Text style={[styles.zzz, { fontSize: size * 0.085 }]}>z</Text>
          <Text style={[styles.zzz, { fontSize: size * 0.105, marginLeft: size * 0.05 }]}>z</Text>
          <Text style={[styles.zzz, { fontSize: size * 0.135, marginLeft: size * 0.12 }]}>Z</Text>
        </View>
      )}
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Orb body */}
        <Circle cx="50" cy="50" r="49" fill={BlipColors.orbRim} />
        <Circle cx="50" cy="50" r="45" fill={BlipColors.orbDark} />
        {/* Top-right glossy highlight */}
        <Ellipse
          cx="67"
          cy="22"
          rx="16"
          ry="7.5"
          transform="rotate(30 67 22)"
          fill={BlipColors.orbHighlight}
        />

        {/* Face expressions */}
        {showCalmEyes && (
          <>
            <Path d="M30 46 Q36 55 42 46" stroke={BlipColors.orbFace} strokeWidth="4.2" strokeLinecap="round" fill="none" />
            <Path d="M58 46 Q64 55 70 46" stroke={BlipColors.orbFace} strokeWidth="4.2" strokeLinecap="round" fill="none" />
            <Path d="M42 58 Q50 67 58 58" stroke={BlipColors.orbFace} strokeWidth="4.2" strokeLinecap="round" fill="none" />
          </>
        )}

        {!showCalmEyes && (mood === 'happy' || mood === 'excited') && (
          <>
            <Path d="M30 50 Q36 40 42 50" stroke={BlipColors.orbFace} strokeWidth="4.2" strokeLinecap="round" fill="none" />
            <Path d="M58 50 Q64 40 70 50" stroke={BlipColors.orbFace} strokeWidth="4.2" strokeLinecap="round" fill="none" />
            <Path
              d={mood === 'excited' ? 'M38 56 Q50 72 62 56 Z' : 'M41 57 Q50 69 59 57 Z'}
              fill={BlipColors.orbFace}
            />
          </>
        )}

        {!showCalmEyes && mood === 'neutral' && (
          <>
            <Ellipse cx="36" cy="46" rx="4" ry="6" fill={BlipColors.orbFace} />
            <Ellipse cx="64" cy="46" rx="4" ry="6" fill={BlipColors.orbFace} />
            <Path d="M43 58 Q50 65 57 58" stroke={BlipColors.orbFace} strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        )}

        {!showCalmEyes && mood === 'tired' && (
          <>
            <Line x1="29" y1="47" x2="42" y2="45" stroke={BlipColors.orbFace} strokeWidth="3.2" strokeLinecap="round" />
            <Line x1="58" y1="45" x2="71" y2="47" stroke={BlipColors.orbFace} strokeWidth="3.2" strokeLinecap="round" />
            <Circle cx="50" cy="60" r="4.8" fill={BlipColors.orbFace} />
          </>
        )}

        {!showCalmEyes && mood === 'anxious' && (
          <>
            <Ellipse cx="36" cy="46" rx="4" ry="6" fill={BlipColors.orbFace} />
            <Ellipse cx="64" cy="46" rx="4" ry="6" fill={BlipColors.orbFace} />
            <Path d="M43 63 Q50 56 57 63" stroke={BlipColors.orbFace} strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        )}

        {!showCalmEyes && mood === 'angry' && (
          <>
            <Circle cx="36" cy="49" r="3.8" fill={BlipColors.orbFace} />
            <Circle cx="64" cy="49" r="3.8" fill={BlipColors.orbFace} />
            <Line x1="30" y1="41" x2="42" y2="45" stroke={BlipColors.orbFace} strokeWidth="3.6" strokeLinecap="round" />
            <Line x1="70" y1="41" x2="58" y2="45" stroke={BlipColors.orbFace} strokeWidth="3.6" strokeLinecap="round" />
            <Path d="M43 64 Q50 57 57 64" stroke={BlipColors.orbFace} strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        )}

        {!showCalmEyes && mood === 'sad' && (
          <>
            <Circle cx="36" cy="47" r="4" fill={BlipColors.orbFace} />
            <Circle cx="64" cy="47" r="4" fill={BlipColors.orbFace} />
            <Path d="M42 65 Q50 56 58 65" stroke={BlipColors.orbFace} strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  zzzWrap: { position: 'absolute' },
  zzz: { color: 'rgba(255,255,255,0.92)', fontWeight: '500', lineHeight: 16 },
});
