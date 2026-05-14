import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

export function useAudio() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const load = useCallback(async (source: any) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        }
      );
      soundRef.current = sound;
      setIsLoaded(true);
    } catch (err) {
      console.warn('Audio load failed:', err);
      setIsLoaded(false);
    }
  }, []);

  const play = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Audio play failed:', err);
    }
  }, []);

  const stop = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
    } catch (err) {
      console.warn('Audio stop failed:', err);
    }
  }, []);

  const unload = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsLoaded(false);
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      unload();
    };
  }, [unload]);

  return { load, play, stop, unload, isPlaying, isLoaded };
}
