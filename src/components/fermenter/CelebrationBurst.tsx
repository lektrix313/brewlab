/**
 * CelebrationBurst — Simple particle burst for dopamine moments.
 * Uses React Native Animated (no external deps).
 * Trigger when batch reaches 'ready' or a brew step completes.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const PARTICLE_COUNT = 24;
const COLORS = ['#B8633A', '#5C6A54', '#D5A021', '#8E4A2A', '#E2E8DE', '#F1DCC9'];

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    scale: new Animated.Value(0),
    opacity: new Animated.Value(1),
    rotate: new Animated.Value(0),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 6,
  }));
}

interface CelebrationBurstProps {
  visible: boolean;
  onComplete?: () => void;
}

export default function CelebrationBurst({ visible, onComplete }: CelebrationBurstProps) {
  const [particles] = useState(() => createParticles());
  const hasRun = useRef(false);

  useEffect(() => {
    if (!visible || hasRun.current) return;
    hasRun.current = true;

    const animations = particles.map((p) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 100;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 40; // upward bias

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: dx,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: dy,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(p.scale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(p.scale, {
            toValue: 0.5,
            duration: 600 + Math.random() * 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.rotate, {
          toValue: Math.random() * 360,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 1000,
          delay: 200 + Math.random() * 300,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(30, animations).start(() => {
      onComplete?.();
    });
  }, [visible, particles, onComplete]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.center}>
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                  { rotate: p.rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
                ],
                opacity: p.opacity,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    borderRadius: 3,
  },
});
