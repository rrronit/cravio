import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme';

type Props = { title: string; subtitle?: string; action?: string; onPress?: () => void };

export function SectionHeader({ title, subtitle, action = 'See all', onPress }: Props) {
  const styles = createStyles();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onPress ? (
        <Pressable style={styles.action} onPress={onPress}>
          <Text style={styles.actionText}>{action}</Text>
          <Feather name="arrow-up-right" size={15} color={colors.green} />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles() { return StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  title: { fontSize: 23, lineHeight: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 3 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingBottom: 3 },
  actionText: { fontSize: 13, fontWeight: '700', color: colors.green },
}); }
