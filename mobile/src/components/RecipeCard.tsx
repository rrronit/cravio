import { Feather, Ionicons } from '@expo/vector-icons';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Recipe } from '../types';
import { colors, shadow } from '../theme';

type Props = { recipe: Recipe; onPress: () => void; onFavorite?: () => void; compact?: boolean };

export function RecipeCard({ recipe, onPress, onFavorite, compact }: Props) {
  if (compact) {
    return (
      <Pressable style={styles.compact} onPress={onPress}>
        <Image source={{ uri: recipe.image }} style={styles.compactImage} />
        <View style={styles.compactBody}>
          <Text style={styles.compactTitle} numberOfLines={2}>{recipe.title}</Text>
          <Text style={styles.meta}>{recipe.time} min · {recipe.cuisine}</Text>
          <View style={styles.matchRow}>
            <View style={[styles.dot, { backgroundColor: recipe.match === 100 ? colors.green : colors.orange }]} />
            <Text style={styles.matchText}>{recipe.match === 100 ? 'Ready to cook' : `${recipe.match}% match`}</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color="#ADB3AF" />
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <ImageBackground source={{ uri: recipe.image }} style={styles.image} imageStyle={styles.imageRadius}>
        <View style={styles.topRow}>
          <View style={[styles.matchBadge, recipe.match === 100 && styles.exactBadge]}>
            <View style={[styles.dot, { backgroundColor: recipe.match === 100 ? colors.green : colors.orange }]} />
            <Text style={styles.badgeText}>{recipe.match === 100 ? 'Can make now' : `${recipe.match}% match`}</Text>
          </View>
          <Pressable style={styles.heart} onPress={(event) => { event.stopPropagation(); onFavorite?.(); }}>
            <Ionicons name={recipe.favorite ? 'heart' : 'heart-outline'} size={19} color={recipe.favorite ? colors.red : colors.ink} />
          </Pressable>
        </View>
      </ImageBackground>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.creator}>{recipe.creator}</Text>
        <View style={styles.footer}>
          <View style={styles.smallMeta}><Feather name="clock" size={14} color={colors.muted} /><Text style={styles.meta}>{recipe.time} min</Text></View>
          <View style={styles.smallMeta}><Ionicons name="flame-outline" size={15} color={colors.muted} /><Text style={styles.meta}>{recipe.calories} kcal</Text></View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 265, backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden', ...shadow },
  image: { height: 176, padding: 12 }, imageRadius: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchBadge: { height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: colors.orangeSoft, flexDirection: 'row', alignItems: 'center', gap: 6 },
  exactBadge: { backgroundColor: colors.greenSoft }, dot: { width: 7, height: 7, borderRadius: 4 }, badgeText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  heart: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, paddingTop: 14 }, title: { color: colors.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.25 },
  creator: { color: colors.muted, fontSize: 12, marginTop: 4 }, footer: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 13, paddingTop: 11, flexDirection: 'row', gap: 15 },
  smallMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 }, meta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  compact: { backgroundColor: colors.surface, borderRadius: 19, padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 10, ...shadow },
  compactImage: { width: 78, height: 78, borderRadius: 14 }, compactBody: { flex: 1, paddingHorizontal: 13, gap: 5 },
  compactTitle: { color: colors.ink, fontSize: 15, lineHeight: 19, fontWeight: '800' }, matchRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, matchText: { color: colors.green, fontSize: 11, fontWeight: '700' },
});
