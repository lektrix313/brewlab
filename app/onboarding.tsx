import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { copy } from '../src/lib/copy';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { useState } from 'react';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  const steps = [
    {
      title: copy.onboarding.welcome,
      body: copy.onboarding.welcomeBody,
      cta: copy.onboarding.getPitching,
      action: () => setStep(1),
    },
    {
      title: copy.onboarding.chooseLevel,
      body: copy.onboarding.levelHelp,
      cta: copy.onboarding.continue,
      action: () => setStep(2),
    },
    {
      title: copy.onboarding.unitsTitle,
      body: copy.onboarding.unitsBody,
      cta: copy.onboarding.done,
      action: () => router.replace('/(tabs)' as any),
    },
  ];

  const current = steps[step];

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pt-8 pb-6">
        {/* Progress dots */}
        <View className="flex-row justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full ${i === step ? 'bg-copper' : 'bg-cream-deep'}`}
            />
          ))}
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className="text-[32px] font-bold text-ink leading-tight"
            style={{ fontFamily: 'Georgia' }}
          >
            {current.title}
          </Text>
          <Text className="text-[17px] text-ink-soft mt-4 leading-relaxed">
            {current.body}
          </Text>

          {step === 1 && (
            <View className="gap-3 mt-8">
              {[
                { key: 'beginner', title: copy.onboarding.beginner, body: copy.onboarding.beginnerBody },
                { key: 'intermediate', title: copy.onboarding.intermediate, body: copy.onboarding.intermediateBody },
                { key: 'advanced', title: copy.onboarding.advanced, body: copy.onboarding.advancedBody },
              ].map((option) => (
                <Card
                  key={option.key}
                  onPress={() => setExperience(option.key)}
                  className={`${experience === option.key ? 'border-2 border-copper' : ''}`}
                >
                  <Text className="text-[17px] font-bold text-ink">{option.title}</Text>
                  <Text className="text-[14px] text-ink-soft mt-1">{option.body}</Text>
                </Card>
              ))}
            </View>
          )}

          {step === 2 && (
            <View className="flex-row gap-3 mt-8">
              <Card
                onPress={() => setUnitSystem('metric')}
                className={`flex-1 items-center ${unitSystem === 'metric' ? 'border-2 border-copper bg-copper-soft' : ''}`}
              >
                <Text className="text-[17px] font-bold text-ink">{copy.onboarding.metric}</Text>
                <Text className="text-[13px] text-ink-muted mt-2 font-mono">20L · 19°C · 1.061 SG</Text>
              </Card>
              <Card
                onPress={() => setUnitSystem('imperial')}
                className={`flex-1 items-center ${unitSystem === 'imperial' ? 'border-2 border-copper bg-copper-soft' : ''}`}
              >
                <Text className="text-[17px] font-bold text-ink">{copy.onboarding.imperial}</Text>
                <Text className="text-[13px] text-ink-muted mt-2 font-mono">5gal · 66°F · 14.9°P</Text>
              </Card>
            </View>
          )}
        </View>

        {/* CTA */}
        <View className="mt-6">
          <Button
            title={current.cta}
            onPress={current.action}
            disabled={step === 1 && !experience}
            size="large"
          />
          {step === 0 && (
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)' as any)}
              className="mt-4 self-center"
            >
              <Text className="text-[15px] text-copper font-medium">
                {copy.onboarding.hasAccount}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
