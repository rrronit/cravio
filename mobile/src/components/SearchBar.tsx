import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, shadow } from '../theme';

type Props = { value: string; onChangeText: (value: string) => void; placeholder?: string; onFilter?: () => void };

export function SearchBar({ value, onChangeText, placeholder = 'Search your cookbook', onFilter }: Props) {
  const styles = createStyles();
  return (
    <View style={styles.wrap}>
      <Feather name="search" size={20} color={colors.muted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA39F"
        selectionColor={colors.green}
      />
      {value ? <Pressable onPress={() => onChangeText('')}><Feather name="x" size={18} color={colors.muted} /></Pressable> : null}
      {onFilter ? <Pressable style={styles.filter} onPress={onFilter}><Feather name="sliders" size={18} color={colors.onPrimary} /></Pressable> : null}
    </View>
  );
}

function createStyles() { return StyleSheet.create({
  wrap: { height: 56, borderRadius: 18, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 8, gap: 11, ...shadow },
  input: { flex: 1, fontSize: 15, color: colors.ink, height: '100%' },
  filter: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
}); }
