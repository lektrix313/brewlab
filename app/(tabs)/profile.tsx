import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth, useClerk } from '@clerk/clerk-expo';
import { useAppStore } from '../../src/stores/appStore';
import { useFadeIn } from '../../src/lib/animations';
import { Animated } from 'react-native';
import { Settings, Award, Beaker, FlaskConical, TrendingUp, LogOut, Wifi, WifiOff, Cloud, Ruler, Droplets } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const F = {
  display: { fontFamily: 'Newsreader_600SemiBold' },
  body: { fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontFamily: 'Inter_500Medium' },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold' },
  mono: { fontFamily: 'SpaceGrotesk_500Medium' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  const isOnline = useAppStore((s) => s.isOnline);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);

  const batches = useAppStore((s) => s.batches);
  const recipes = useAppStore((s) => s.recipes);
  const fade = useFadeIn(0);

  const totalBrews = batches.length;
  const completedBrews = batches.filter((b) => b.status === 'ready' || b.status === 'archived').length;
  const activeBrews = batches.filter((b) => b.status === 'active-fermentation' || b.status === 'lag-phase' || b.status === 'brew-day').length;
  const totalRecipes = recipes.length;

  const avgAbv = batches.length > 0
    ? batches.reduce((s, b) => s + b.recipe_snapshot.estimated_abv_pct, 0) / batches.length
    : 0;

  const displayName = user?.firstName || user?.username || 'Brewer';
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0E6' }} edges={['top']}>
      <Animated.ScrollView style={{ flex: 1, opacity: fade.opacity, transform: [{ translateY: fade.translateY }] }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, paddingBottom: 8 }}>
          <Text style={[F.display, { fontSize: 32, lineHeight: 40, color: '#1A1A1A', letterSpacing: -0.5 }]}>
            Profile
          </Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Settings size={24} color="#1A1A1A" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Sync status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          {isOnline ? (
            <Wifi size={14} color="#5C6A54" strokeWidth={1.5} />
          ) : (
            <WifiOff size={14} color="#8E4A2A" strokeWidth={1.5} />
          )}
          <Text style={[F.body, { fontSize: 12, color: isOnline ? '#5C6A54' : '#8E4A2A' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          {lastSyncedAt && (
            <>
              <Text style={[F.body, { fontSize: 12, color: '#A0A0A0' }]}>·</Text>
              <Cloud size={14} color="#A0A0A0" strokeWidth={1.5} />
              <Text style={[F.body, { fontSize: 12, color: '#A0A0A0' }]}>
                Synced {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </>
          )}
        </View>

        {/* Avatar + name */}
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isSignedIn ? '#B8633A' : '#EBE3D2', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 36 }}>{isSignedIn ? '🍺' : '👤'}</Text>
          </View>
          <Text style={[F.display, { fontSize: 24, lineHeight: 30, color: '#1A1A1A', marginTop: 12 }]}>
            {displayName}
          </Text>
          {email ? (
            <Text style={[F.body, { fontSize: 14, color: '#6E6E6E', marginTop: 4 }]}>
              {email}
            </Text>
          ) : (
            <Text style={[F.body, { fontSize: 15, color: '#6E6E6E', marginTop: 4 }]}>
              Master of Malt
            </Text>
          )}

          {/* Auth status */}
          {!isSignedIn && (
            <TouchableOpacity
              onPress={() => router.push('/auth')}
              style={{ backgroundColor: '#B8633A', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 16 }}
              activeOpacity={0.8}
            >
              <Text style={[F.bodySemiBold, { fontSize: 14, color: '#F5F0E6' }]}>Sign In to Sync</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats grid */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <View style={[styles.statCard, { backgroundColor: '#F1DCC9' }]}>
            <FlaskConical size={20} color="#8E4A2A" strokeWidth={1.5} />
            <Text style={[F.mono, { fontSize: 24, lineHeight: 30, color: '#8E4A2A', marginTop: 8 }]}>{totalBrews}</Text>
            <Text style={[F.body, { fontSize: 11, color: '#8E4A2A' }]}>Total Brews</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E2E8DE' }]}>
            <Award size={20} color="#5C6A54" strokeWidth={1.5} />
            <Text style={[F.mono, { fontSize: 24, lineHeight: 30, color: '#5C6A54', marginTop: 8 }]}>{completedBrews}</Text>
            <Text style={[F.body, { fontSize: 11, color: '#5C6A54' }]}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D5D9DD' }]}>
            <Beaker size={20} color="#2E3842" strokeWidth={1.5} />
            <Text style={[F.mono, { fontSize: 24, lineHeight: 30, color: '#2E3842', marginTop: 8 }]}>{totalRecipes}</Text>
            <Text style={[F.body, { fontSize: 11, color: '#2E3842' }]}>Recipes</Text>
          </View>
        </View>

        {/* Active brews mini list */}
        {activeBrews > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[F.display, { fontSize: 20, lineHeight: 26, color: '#1A1A1A', marginBottom: 12 }]}>
              Currently Brewing
            </Text>
            {batches
              .filter((b) => b.status === 'active-fermentation' || b.status === 'lag-phase' || b.status === 'brew-day')
              .map((batch) => (
                <View key={batch.id} style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <View>
                    <Text style={[F.bodySemiBold, { fontSize: 15, color: '#1A1A1A' }]}>{batch.recipe_snapshot.name}</Text>
                    <Text style={[F.body, { fontSize: 13, color: '#6E6E6E', marginTop: 2 }]}>
                      Day {Math.floor((Date.now() - new Date(batch.started_at).getTime()) / 86400000) + 1} · {batch.status.replace(/-/g, ' ')}
                    </Text>
                  </View>
                  <TrendingUp size={18} color="#B8633A" strokeWidth={1.5} />
                </View>
              ))}
          </View>
        )}

        {/* Avg ABV */}
        <View style={[styles.card, { alignItems: 'center', marginBottom: 24 }]}>
          <Text style={[F.body, { fontSize: 11, color: '#6E6E6E', textTransform: 'uppercase', letterSpacing: 1.5 }]}>Average ABV</Text>
          <Text style={[F.mono, { fontSize: 36, lineHeight: 44, color: '#1A1A1A', marginTop: 4 }]}>{avgAbv.toFixed(1)}%</Text>
        </View>

        {/* Settings */}
        <View style={{ marginBottom: 16 }}>
          <Text style={[F.display, { fontSize: 20, lineHeight: 26, color: '#1A1A1A', marginBottom: 12 }]}>
            Settings
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/settings/units')}
            style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ruler size={18} color="#6E6E6E" strokeWidth={1.5} />
              <Text style={[F.body, { fontSize: 15, color: '#1A1A1A' }]}>Units</Text>
            </View>
            <Text style={{ fontSize: 18, color: '#6E6E6E' }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/settings/equipment')}
            style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Droplets size={18} color="#6E6E6E" strokeWidth={1.5} />
              <Text style={[F.body, { fontSize: 15, color: '#1A1A1A' }]}>Equipment</Text>
            </View>
            <Text style={{ fontSize: 18, color: '#6E6E6E' }}>›</Text>
          </TouchableOpacity>
          {['Notifications', 'Data Export', 'About TUN'].map((item) => (
            <TouchableOpacity key={item} style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} activeOpacity={0.8}>
              <Text style={[F.body, { fontSize: 15, color: '#1A1A1A' }]}>{item}</Text>
              <Text style={{ fontSize: 18, color: '#6E6E6E' }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        {isSignedIn && (
          <TouchableOpacity
            onPress={() => signOut()}
            style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }]}
            activeOpacity={0.8}
          >
            <LogOut size={18} color="#8E4A2A" strokeWidth={1.5} />
            <Text style={[F.bodySemiBold, { fontSize: 15, color: '#8E4A2A' }]}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF6EE',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBE3D2',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
});
