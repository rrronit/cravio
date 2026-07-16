import { Feather, Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadow } from '../theme';
import { TabName } from '../types';

type Props = { active: TabName; onChange: (tab: TabName) => void };
const tabs: { name: TabName; icon: keyof typeof Feather.glyphMap }[] = [
  { name: 'Home', icon: 'home' }, { name: 'Cookbook', icon: 'book-open' }, { name: 'Import', icon: 'plus' },
  { name: 'Pantry', icon: 'archive' }, { name: 'Profile', icon: 'user' },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <View style={styles.shell}>
      {tabs.map((tab) => {
        const selected = active === tab.name;
        if (tab.name === 'Import') return (
          <Pressable key={tab.name} style={styles.importWrap} onPress={() => onChange(tab.name)}>
            <View style={styles.import}><Ionicons name="add" size={30} color={colors.surface} /></View>
            <Text style={styles.label}>Import</Text>
          </Pressable>
        );
        return (
          <Pressable key={tab.name} style={styles.item} onPress={() => onChange(tab.name)}>
            {selected ? <View style={styles.activePill}><Feather name={tab.icon} size={19} color={colors.green} /></View> : <Feather name={tab.icon} size={20} color="#89928D" />}
            <Text style={[styles.label, selected && styles.activeLabel]}>{tab.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 86, paddingBottom: 15, paddingHorizontal: 10, backgroundColor: colors.surface, borderTopLeftRadius: 25, borderTopRightRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', ...shadow },
  item: { width: 64, height: 58, alignItems: 'center', justifyContent: 'center', gap: 4 }, label: { fontSize: 10, fontWeight: '700', color: '#89928D' }, activeLabel: { color: colors.green },
  activePill: { backgroundColor: colors.greenSoft, borderRadius: 13, height: 30, minWidth: 45, alignItems: 'center', justifyContent: 'center' },
  importWrap: { width: 66, alignItems: 'center', marginTop: -28, gap: 4 }, import: { width: 58, height: 58, borderRadius: 21, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: colors.background, transform: [{ rotate: '45deg' }] },
});
