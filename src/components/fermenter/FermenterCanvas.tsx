/**
 * FermenterCanvas — Animated SVG fermenter vessel.
 *
 * Cross-platform: uses react-native-svg + Animated API.
 * Works on iOS, Android, and Web without Skia/Reanimated.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { BatchStatus } from '../../lib/beerjson/types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

interface FermenterCanvasProps {
  srmColor: string;
  status: BatchStatus;
  abv: number;
  gravity: number;
  tempC: number;
  stepName: string;
  width?: number;
  height?: number;
}

function bubbleRateForStatus(status: BatchStatus): number {
  switch (status) {
    case 'lag-phase':
      return 1;
    case 'active-fermentation':
      return 6;
    case 'attenuating':
      return 3;
    case 'conditioning':
    case 'cold-crash':
    case 'ready':
      return 0;
    default:
      return 2;
  }
}

function tempTint(tempC: number): string {
  if (tempC < 5) return 'rgba(100,180,255,0.15)';
  if (tempC < 12) return 'rgba(150,200,255,0.10)';
  if (tempC > 30) return 'rgba(255,150,80,0.15)';
  if (tempC > 26) return 'rgba(255,180,100,0.12)';
  return 'rgba(255,255,255,0)';
}

interface BubbleDef {
  x: number;
  r: number;
  duration: number;
  delay: number;
  opacity: number;
}

function generateBubbles(count: number, width: number, height: number): BubbleDef[] {
  const bubbles: BubbleDef[] = [];
  for (let i = 0; i < count; i++) {
    bubbles.push({
      x: 30 + Math.random() * (width - 60),
      r: 1.5 + Math.random() * 3.5,
      duration: 2000 + Math.random() * 3000,
      delay: Math.random() * 4000,
      opacity: 0.3 + Math.random() * 0.4,
    });
  }
  return bubbles;
}

function AnimatedBubble({
  b,
  liquidY,
  liquidH,
}: {
  b: BubbleDef;
  liquidY: number;
  liquidH: number;
}) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(animValue, {
        toValue: 1,
        duration: b.duration,
        delay: b.delay,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [animValue, b.duration, b.delay]);

  const bubbleY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [liquidY + 34 + liquidH - 10, liquidY + 34 + 20],
  });

  const bubbleOpacity = animValue.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [b.opacity, b.opacity, 0],
  });

  return (
    <AnimatedCircle
      cx={b.x}
      cy={bubbleY}
      r={b.r}
      fill="rgba(255,255,255,0.5)"
      opacity={bubbleOpacity}
    />
  );
}

export default function FermenterCanvas({
  srmColor,
  status,
  abv,
  gravity,
  tempC,
  stepName,
  width = 120,
  height = 200,
}: FermenterCanvasProps) {
  const bubbleCount = bubbleRateForStatus(status) * 3;
  const hasKrausen = status === 'active-fermentation' || status === 'attenuating';
  const showSediment =
    status === 'conditioning' || status === 'cold-crash' || status === 'ready';
  const liquidLevel = status === 'planned' || status === 'brew-day' ? 0.35 : 0.72;
  const tint = tempTint(tempC);

  const bubbles = useMemo(
    () => generateBubbles(bubbleCount, width, height),
    [bubbleCount, width, height]
  );

  // Krausen pulse animation
  const krausenScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!hasKrausen) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(krausenScale, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(krausenScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [hasKrausen, krausenScale]);

  // Airlock bubble animation
  const airlockBubble = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (bubbleCount === 0) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(airlockBubble, {
          toValue: 1,
          duration: 1500 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(airlockBubble, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [bubbleCount, airlockBubble]);

  const liquidY = height * (1 - liquidLevel);
  const liquidH = height * liquidLevel;

  const fontFamilyMono = 'SpaceGrotesk_500Medium';
  const fontFamilyBody = 'Inter_400Regular';

  return (
    <View style={styles.container}>
      <Svg width={width} height={height + 40} viewBox={`0 0 ${width} ${height + 40}`}>
        <Defs>
          <LinearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="rgba(255,255,255,0.15)" />
            <Stop offset="0.5" stopColor="rgba(255,255,255,0.05)" />
            <Stop offset="1" stopColor="rgba(255,255,255,0.15)" />
          </LinearGradient>
          <LinearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={srmColor} stopOpacity="0.9" />
            <Stop offset="1" stopColor={srmColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Vessel shadow */}
        <Rect x="8" y="38" width={width - 16} height={height - 16} rx="18" fill="rgba(0,0,0,0.06)" />

        {/* Vessel body */}
        <Rect x="4" y="34" width={width - 8} height={height - 8} rx="16" fill="#FAF6EE" stroke="#D5C4B0" strokeWidth="2" />

        {/* Vessel neck */}
        <Rect x={width / 2 - 14} y="14" width="28" height="24" fill="#FAF6EE" stroke="#D5C4B0" strokeWidth="2" />
        <Rect x={width / 2 - 18} y="8" width="36" height="10" rx="5" fill="#EBE3D2" stroke="#D5C4B0" strokeWidth="1.5" />

        {/* Airlock */}
        <Rect x={width / 2 - 4} y="0" width="8" height="12" rx="2" fill="rgba(255,255,255,0.6)" stroke="#D5C4B0" strokeWidth="1" />

        {/* Airlock bubble */}
        {bubbleCount > 0 && (
          <AnimatedCircle
            cx={width / 2}
            r="2.5"
            fill="rgba(255,255,255,0.7)"
            opacity={airlockBubble.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, 0],
            })}
            cy={airlockBubble.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 2],
            })}
          />
        )}

        {/* Liquid */}
        <AnimatedRect
          x="6"
          y={liquidY + 34}
          width={width - 12}
          height={liquidH}
          rx="14"
          fill="url(#liquidGrad)"
        />

        {/* Temperature tint overlay */}
        {tint !== 'rgba(255,255,255,0)' && (
          <Rect
            x="6"
            y={liquidY + 34}
            width={width - 12}
            height={liquidH}
            rx="14"
            fill={tint}
          />
        )}

        {/* Measurement tick marks */}
        {[50, 90, 130, 170].map((y) => (
          <Rect key={y} x={width - 18} y={y} width="10" height="1.5" fill="#D5C4B0" opacity="0.6" />
        ))}

        {/* Bubbles */}
        {bubbles.map((b, i) => (
          <AnimatedBubble key={`bubble-${i}`} b={b} liquidY={liquidY} liquidH={liquidH} />
        ))}

        {/* Krausen */}
        {hasKrausen && (
          <AnimatedG
            style={{
              transform: [
                { translateY: liquidY + 30 },
                { scaleY: krausenScale },
                { translateY: -(liquidY + 30) },
              ],
            }}
          >
            <Path
              d={`M 6 ${liquidY + 34} Q ${width / 4} ${liquidY + 24} ${width / 2} ${liquidY + 34} Q ${(width * 3) / 4} ${liquidY + 44} ${width - 6} ${liquidY + 34} L ${width - 6} ${liquidY + 42} L 6 ${liquidY + 42} Z`}
              fill="rgba(255,255,255,0.75)"
            />
          </AnimatedG>
        )}

        {/* Sediment */}
        {showSediment && (
          <Path
            d={`M 10 ${height + 28} Q ${width / 3} ${height + 18} ${width / 2} ${height + 22} Q ${(width * 2) / 3} ${height + 26} ${width - 10} ${height + 28} L ${width - 10} ${height + 30} L 10 ${height + 30} Z`}
            fill="rgba(60,40,20,0.25)"
          />
        )}

        {/* Glass highlight */}
        <Rect x="6" y="36" width={width - 12} height={height - 12} rx="14" fill="url(#glassGrad)" pointerEvents="none" />
      </Svg>

      {/* Stats overlay */}
      <View style={styles.statsOverlay}>
        <View style={styles.statBlock}>
          <View style={styles.statLabel}>
            <View style={styles.dot} />
            <View>
              <Animated.Text style={[styles.statValue, { fontFamily: fontFamilyMono }]}>
                {gravity.toFixed(3)}
              </Animated.Text>
              <Animated.Text style={[styles.statLabelText, { fontFamily: fontFamilyBody }]}>SG</Animated.Text>
            </View>
          </View>
        </View>

        <View style={styles.statBlock}>
          <View style={styles.statLabel}>
            <View style={[styles.dot, { backgroundColor: '#5C6A54' }]} />
            <View>
              <Animated.Text style={[styles.statValue, { fontFamily: fontFamilyMono }]}>
                {abv.toFixed(1)}%
              </Animated.Text>
              <Animated.Text style={[styles.statLabelText, { fontFamily: fontFamilyBody }]}>ABV</Animated.Text>
            </View>
          </View>
        </View>

        <View style={styles.statBlock}>
          <View style={styles.statLabel}>
            <View style={[styles.dot, { backgroundColor: '#8E4A2A' }]} />
            <View>
              <Animated.Text style={[styles.statValue, { fontFamily: fontFamilyMono }]}>
                {tempC.toFixed(0)}°
              </Animated.Text>
              <Animated.Text style={[styles.statLabelText, { fontFamily: fontFamilyBody }]}>{stepName}</Animated.Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  statsOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  statBlock: {
    alignItems: 'center',
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B8633A',
  },
  statValue: {
    fontSize: 20,
    lineHeight: 24,
    color: '#1A1A1A',
  },
  statLabelText: {
    fontSize: 11,
    color: '#6E6E6E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
});
