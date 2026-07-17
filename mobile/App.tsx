import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, BackHandler, FlatList, ImageBackground, KeyboardAvoidingView, Linking, Modal, Platform, Pressable,
  ScrollView, Share, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomNav } from './src/components/BottomNav';
import { AuthScreen } from './src/components/AuthScreen';
import { RecipeCard } from './src/components/RecipeCard';
import { SearchBar } from './src/components/SearchBar';
import { SectionHeader } from './src/components/SectionHeader';
import {
  addShoppingListItem, AppNotification, AuthSession, createImport, createPantryItem, getCurrentUser, getImportedRecipe,
  getImport, getPreferences, ImportJob, listNotifications, listPantry, listRecipes, listRecommendations,
  logoutSession, markAllNotificationsRead, setAccessToken, updatePreferences, updateRecipeFavorite,
} from './src/services/api';
import { clearStoredSession, loadStoredSession, storeSession } from './src/services/session';
import { applyTheme, colors, shadow } from './src/theme';
import { PantryItem, Recipe, TabName } from './src/types';

const contentWidth = { width: '100%' as const, maxWidth: 720, alignSelf: 'center' as const };
type AuthIntent =
  | { kind: 'tab'; tab: TabName }
  | { kind: 'favorite'; recipeId: string }
  | { kind: 'pantry' }
  | { kind: 'shopping'; recipeId: string };
const protectedTabs = new Set<TabName>(['Import', 'Pantry', 'Profile']);
const mergeRecommendations = (recipes: Recipe[], recommendations: Recipe[]) => {
  const recommendationById = new Map(recommendations.map((recipe) => [recipe.id, recipe]));
  return recipes.map((recipe) => {
    const recommendation = recommendationById.get(recipe.id);
    return recommendation ? { ...recipe, match: recommendation.match, missing: recommendation.missing, ingredients: recommendation.ingredients } : recipe;
  });
};

function BrandHeader({ title, subtitle, back, onBack }: { title?: string; subtitle?: string; back?: boolean; onBack?: () => void }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const openNotifications = async () => {
    setNotificationsOpen(true);
    setNotificationsLoading(true);
    setNotificationsError('');
    try {
      const result = await listNotifications();
      setNotifications(result.data);
      setHasUnread(result.unread > 0);
      if (result.unread > 0) {
        await markAllNotificationsRead();
        setNotifications(items => items.map(item => ({ ...item, read: true })));
        setHasUnread(false);
      }
    } catch (error) {
      setNotificationsError((error as Error).message);
    } finally {
      setNotificationsLoading(false);
    }
  };
  return (
    <>
      <View style={styles.header}>
        {back ? <Pressable style={styles.iconButton} onPress={onBack}><Feather name="arrow-left" size={21} color={colors.ink} /></Pressable> : (
          <View style={styles.brandLogoFrame} accessibilityLabel="Cravio">
            <View style={styles.brandMark}>
              <Text style={styles.brandC}>C</Text>
              <View style={styles.brandRibbon}><View style={styles.brandRibbonCut} /></View>
            </View>
            <Text style={styles.brandWord}>cravio</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        <Pressable style={styles.iconButton} onPress={() => void openNotifications()} accessibilityRole="button" accessibilityLabel="Open notifications">
          <Feather name="bell" size={20} color={colors.ink} />
          {hasUnread ? <View style={styles.notifyDot} /> : null}
        </Pressable>
      </View>
      <Modal visible={notificationsOpen} transparent animationType="slide" onRequestClose={() => setNotificationsOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setNotificationsOpen(false)} />
        <View style={styles.notificationPosition}>
          <View style={styles.notificationSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.notificationHeader}>
              <View><Text style={styles.modalTitle}>Notifications</Text><Text style={styles.modalSubtitle}>Fresh from your kitchen</Text></View>
              <Pressable style={styles.iconButton} onPress={() => setNotificationsOpen(false)} accessibilityRole="button" accessibilityLabel="Close notifications"><Feather name="x" size={20} color={colors.ink} /></Pressable>
            </View>
            {notificationsLoading ? <View style={styles.notificationState}><ActivityIndicator color={colors.green} /><Text style={styles.notificationStateText}>Loading your kitchen updates…</Text></View> : null}
            {!notificationsLoading && notificationsError ? <View style={styles.notificationState}><Feather name="alert-circle" size={21} color={colors.red} /><Text style={styles.notificationStateText}>{notificationsError}</Text></View> : null}
            {!notificationsLoading && !notificationsError && notifications.length === 0 ? <View style={styles.notificationState}><Feather name="check-circle" size={22} color={colors.green} /><Text style={styles.notificationStateText}>You're all caught up.</Text></View> : null}
            {!notificationsLoading && notifications.map((item, index) => (
              <Pressable key={item.id} style={styles.notificationItem} onPress={() => setNotificationsOpen(false)}>
                <View style={[styles.notificationIcon, index === 1 && { backgroundColor: colors.orangeSoft }]}><Feather name={item.icon as any} size={20} color={index === 1 ? colors.orangeInk : colors.green} /></View>
                <View style={{ flex: 1 }}><Text style={styles.notificationTitle}>{item.title}</Text><Text style={styles.notificationBody}>{item.body}</Text></View>
                <Text style={styles.notificationTime}>{formatRelativeTime(item.createdAt)}</Text>
              </Pressable>
            ))}
            {!notificationsLoading && !notificationsError ? <Pressable style={styles.notificationAction} onPress={() => setNotificationsOpen(false)}><Text style={styles.notificationActionText}>You're all caught up</Text><Feather name="check" size={16} color={colors.green} /></Pressable> : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const formatRelativeTime = (value: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

function HomeScreen({ recipes, viewerName, onOpen, onTab, onFavorite }: { recipes: Recipe[]; viewerName: string; onOpen: (r: Recipe) => void; onTab: (t: TabName) => void; onFavorite: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const makeNow = recipes.filter((recipe) => recipe.match === 100);
  const recent = recipes.slice(0, 4);
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        <BrandHeader />
        <View style={styles.greetingRow}>
          <View><Text style={styles.eyebrow}>GOOD EVENING, {viewerName.toUpperCase()}</Text><Text style={styles.heroTitle}>What are we{`\n`}cooking today?</Text></View>
          <View style={styles.avatar}><Text style={styles.avatarText}>{viewerName.charAt(0).toUpperCase()}</Text></View>
        </View>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search recipes or ingredients" onFilter={() => onTab('Cookbook')} />
        {query ? (
          <View style={styles.searchResults}>
            {recipes.filter((r) => `${r.title} ${r.tags.join(' ')} ${r.ingredients.map(i => i.name).join(' ')}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} compact onPress={() => onOpen(recipe)} />
            ))}
          </View>
        ) : null}

        <Pressable style={styles.importHero} onPress={() => onTab('Import')}>
          <LinearGradient colors={['#1D6045', '#163D2F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.importGradient}>
            <View style={styles.importCopy}>
              <View style={styles.importEyebrow}><Ionicons name="sparkles" size={13} color={colors.lime} /><Text style={styles.importEyebrowText}>AI RECIPE IMPORT</Text></View>
              <Text style={[styles.importTitle, { color: colors.onPrimary }]}>Found something{`\n`}delicious?</Text>
              <Text style={styles.importText}>Paste a reel. We'll turn it into a recipe.</Text>
              <View style={styles.importButton}><Feather name="link-2" size={17} color={colors.onLime} /><Text style={styles.importButtonText}>Import a recipe</Text></View>
            </View>
            <View style={styles.heroArt}><Text style={styles.heroEmoji}>🍝</Text><View style={styles.sparkle}><Ionicons name="sparkles" size={20} color={colors.onLime} /></View></View>
          </LinearGradient>
        </Pressable>

        <View style={styles.section}><SectionHeader title="Cook with what you have" subtitle={`${makeNow.length} recipes match your pantry perfectly`} action="View matches" onPress={() => onTab('Cookbook')} /></View>
      </View>
      <FlatList
        horizontal data={makeNow} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList} renderItem={({ item }) => <RecipeCard recipe={item} onPress={() => onOpen(item)} onFavorite={() => onFavorite(item.id)} />}
        ItemSeparatorComponent={() => <View style={{ width: 14 }} />} scrollEnabled
      />
      <View style={styles.page}>
        <View style={styles.section}><SectionHeader title="Recently saved" subtitle="Fresh from your feed" onPress={() => onTab('Cookbook')} /></View>
        {recent.map((recipe) => <RecipeCard key={recipe.id} compact recipe={recipe} onPress={() => onOpen(recipe)} />)}
        <View style={styles.tipCard}><View style={styles.tipIcon}><Ionicons name="bulb-outline" size={25} color={colors.green} /></View><View style={{ flex: 1 }}><Text style={styles.tipLabel}>PANTRY TIP</Text><Text style={styles.tipTitle}>Your spinach expires tomorrow</Text><Text style={styles.tipText}>Use it in Creamy Tuscan Chicken tonight.</Text></View><Feather name="arrow-up-right" size={20} color={colors.green} /></View>
      </View>
    </ScrollView>
  );
}

function CookbookScreen({ recipes, onOpen, onFavorite }: { recipes: Recipe[]; onOpen: (r: Recipe) => void; onFavorite: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Can make now', 'Favorites', 'Under 20 min', 'High protein'];
  const filtered = useMemo(() => recipes.filter((recipe) => {
    const text = `${recipe.title} ${recipe.cuisine} ${recipe.creator} ${recipe.tags.join(' ')} ${recipe.ingredients.map(i => i.name).join(' ')}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Can make now' && recipe.match === 100) || (filter === 'Favorites' && recipe.favorite) || (filter === 'Under 20 min' && recipe.time < 20) || (filter === 'High protein' && recipe.tags.includes('High protein'));
    return matchesQuery && matchesFilter;
  }), [recipes, query, filter]);
  return (
    <View style={styles.flexScreen}><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.page}><BrandHeader /><Text style={styles.screenTitle}>My cookbook</Text><Text style={styles.screenSubtitle}>{recipes.length} recipes, ready whenever you are.</Text>
        <View style={{ marginTop: 20 }}><SearchBar value={query} onChangeText={setQuery} placeholder="Search recipes, tags, ingredients" onFilter={() => setFilter('All')} /></View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.chip, filter === item && styles.chipActive]}><Text style={[styles.chipText, filter === item && styles.chipTextActive, filter === item && { color: colors.onPrimary }]}>{item}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.page}>
        <View style={styles.collectionStats}><View><Text style={styles.statNumber}>{filtered.length}</Text><Text style={styles.statLabel}>RECIPES</Text></View><View style={styles.statDivider} /><View><Text style={styles.statNumber}>{recipes.filter(r => r.favorite).length}</Text><Text style={styles.statLabel}>FAVORITES</Text></View><View style={styles.statDivider} /><View><Text style={styles.statNumber}>{recipes.filter(r => r.match === 100).length}</Text><Text style={styles.statLabel}>READY NOW</Text></View></View>
        <View style={styles.resultHeader}><Text style={styles.resultText}>{filter === 'All' ? 'All recipes' : filter}</Text><View style={styles.sort}><Feather name="sliders" size={14} color={colors.muted} /><Text style={styles.sortText}>Recently added</Text></View></View>
        {filtered.length ? filtered.map((recipe) => <RecipeCard key={recipe.id} compact recipe={recipe} onPress={() => onOpen(recipe)} onFavorite={() => onFavorite(recipe.id)} />) : <View style={styles.empty}><Text style={styles.emptyEmoji}>🥣</Text><Text style={styles.emptyTitle}>Nothing found</Text><Text style={styles.emptyText}>Try another search or remove a filter.</Text></View>}
      </View>
    </ScrollView></View>
  );
}

function ImportScreen({ onComplete }: { onComplete: (recipe: Recipe) => void }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'queued' | 'extracting' | 'generating' | 'ready' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [pendingRecipe, setPendingRecipe] = useState<Recipe | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const startImport = async () => {
    if (!url.trim()) return Alert.alert('Paste a recipe link', 'Add an Instagram, TikTok, or YouTube link first.');
    controller.current?.abort();
    controller.current = new AbortController();
    setStatus('queued'); setProgress(0); setStatusMessage('Sending your link to Cravio…');
    try {
      let job = await createImport(url.trim(), controller.current.signal);
      updateImportState(job);
      while (job.status !== 'ready' && job.status !== 'failed') {
        await delay(650);
        job = await getImport(job.id, controller.current.signal);
        updateImportState(job);
      }
      if (job.status === 'failed' || !job.recipeId) throw new Error('The recipe could not be generated.');
      const recipe = await getImportedRecipe(job.recipeId, controller.current.signal);
      setPendingRecipe(recipe); setStatus('ready'); setProgress(100);
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      setStatus('failed'); setStatusMessage((error as Error).message);
    }
  };
  const saveImport = () => {
    if (!pendingRecipe) return;
    onComplete(pendingRecipe); setPendingRecipe(null); setUrl(''); setStatus('idle'); setProgress(0); setStatusMessage('');
  };
  const updateImportState = (job: ImportJob) => {
    setProgress(job.progress);
    setStatus(job.status === 'generating_recipe' ? 'generating' : job.status);
    setStatusMessage(job.events.at(-1)?.message ?? 'Processing your recipe…');
  };
  return (
    <KeyboardAvoidingView style={styles.flexScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><View style={styles.page}><BrandHeader />
        <View style={styles.importPageIcon}><Ionicons name="sparkles" size={28} color={colors.green} /></View><Text style={[styles.screenTitle, { textAlign: 'center' }]}>Reel to recipe,{`\n`}just like that.</Text><Text style={[styles.screenSubtitle, { textAlign: 'center', paddingHorizontal: 28 }]}>Paste a link from Instagram, TikTok, or YouTube. Cravio will do the rest.</Text>
        <View style={styles.urlCard}><Text style={styles.inputLabel}>RECIPE VIDEO LINK</Text><View style={styles.urlInput}><Feather name="link-2" size={20} color={colors.muted} /><TextInput value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder="https://instagram.com/reel/..." placeholderTextColor="#A2AAA5" style={styles.urlTextInput} /></View>
          <Pressable style={[styles.primaryButton, status !== 'idle' && status !== 'ready' && status !== 'failed' && { opacity: 0.7 }]} onPress={startImport} disabled={!['idle', 'failed'].includes(status)}><Ionicons name="sparkles" size={18} color={colors.lime} /><Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{status === 'failed' ? 'Try import again' : 'Create my recipe'}</Text><Feather name="arrow-right" size={18} color={colors.onPrimary} /></Pressable>
        </View>
        {status !== 'idle' ? <View style={styles.processCard}>
          <View style={styles.processTop}><Text style={styles.processTitle}>{status === 'ready' ? 'Your recipe is ready!' : status === 'failed' ? 'Import needs another try' : 'Creating your recipe'}</Text><Text style={styles.processPercent}>{progress}%</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressBar, { width: `${progress}%` as `${number}%` }]} /></View>
          <Text style={styles.processMessage}>{statusMessage}</Text>
          {['Reading the video', 'Building ingredients & steps', 'Estimating nutrition'].map((label, index) => { const complete = status === 'ready' || (status === 'generating' && index === 0); const active = (status === 'extracting' && index === 0) || (status === 'generating' && index === 1); return <View key={label} style={styles.processStep}>{complete ? <Ionicons name="checkmark-circle" size={20} color={colors.green} /> : <View style={[styles.stepDot, active && styles.stepDotActive]} />}<Text style={[styles.processStepText, complete && { color: colors.ink }]}>{label}</Text></View>; })}
          {status === 'ready' ? <Pressable style={styles.saveButton} onPress={saveImport}><Text style={styles.saveButtonText}>Review & save recipe</Text><Feather name="arrow-right" size={18} color={colors.onLime} /></Pressable> : null}
        </View> : null}
        <View style={styles.howCard}><Text style={styles.howTitle}>How to import</Text>{[['share-2', 'Copy a reel link', 'Tap Share on your favorite cooking video.'], ['link', 'Paste it here', 'Cravio reads the caption and video details.'], ['check-circle', 'Review & cook', 'Edit anything, then save to your cookbook.']].map(([icon, title, desc], index) => <View key={title} style={styles.howRow}><View style={styles.howNumber}><Feather name={icon as any} size={18} color={colors.green} /></View><View style={{ flex: 1 }}><Text style={styles.howRowTitle}>{title}</Text><Text style={styles.howRowText}>{desc}</Text></View>{index < 2 ? <View style={styles.howLine} /> : null}</View>)}</View>
        <View style={styles.platforms}><Text style={styles.platformLabel}>WORKS WITH</Text><View style={styles.platformRow}><View style={styles.platform}><Ionicons name="logo-instagram" size={24} color={colors.ink} /><Text style={styles.platformText}>Instagram</Text></View><View style={styles.platform}><Ionicons name="logo-tiktok" size={23} color={colors.ink} /><Text style={styles.platformText}>TikTok</Text></View><View style={styles.platform}><Ionicons name="logo-youtube" size={25} color="#D9433C" /><Text style={styles.platformText}>YouTube</Text></View></View></View>
      </View></ScrollView>
    </KeyboardAvoidingView>
  );
}

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function PantryScreen({ pantry, onAdd }: { pantry: PantryItem[]; onAdd: () => void }) {
  const [query, setQuery] = useState('');
  const filtered = pantry.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><View style={styles.page}><BrandHeader /><View style={styles.titleAction}><View><Text style={styles.screenTitle}>My pantry</Text><Text style={styles.screenSubtitle}>{pantry.length} ingredients on hand.</Text></View><Pressable style={styles.roundAdd} onPress={onAdd}><Feather name="plus" size={23} color={colors.onPrimary} /></Pressable></View>
    <View style={{ marginTop: 20 }}><SearchBar value={query} onChangeText={setQuery} placeholder="Find an ingredient" /></View>
    <View style={styles.pantryHero}><View style={{ flex: 1 }}><Text style={styles.pantryHeroLabel}>PANTRY POWER</Text><Text style={[styles.pantryHeroTitle, { color: colors.onPrimary }]}>You can make{`\n`}2 recipes right now</Text><Text style={styles.pantryHeroText}>And 3 more with just one ingredient.</Text></View><View style={styles.pantryScore}><Text style={[styles.pantryScoreNumber, { color: colors.onPrimary }]}>78</Text><Text style={styles.pantryScoreLabel}>PANTRY{`\n`}SCORE</Text></View></View>
    <SectionHeader title="Ingredients" subtitle="Use soon items appear first" />
    {filtered.map(item => <Pressable key={item.id} style={styles.pantryItem}><View style={styles.pantryIcon}><Text style={styles.pantryEmoji}>{item.icon}</Text></View><View style={{ flex: 1 }}><Text style={styles.pantryName}>{item.name}</Text><Text style={styles.pantryQty}>{item.quantity} · {item.category}</Text></View>{item.expiry ? <View style={[styles.expiry, item.expiry === 'Tomorrow' && styles.expirySoon]}><Text style={[styles.expiryText, item.expiry === 'Tomorrow' && styles.expirySoonText]}>{item.expiry}</Text></View> : <Feather name="more-horizontal" size={20} color={colors.muted} />}</Pressable>)}
    <Pressable style={styles.outlineButton} onPress={onAdd}><Feather name="plus" size={18} color={colors.green} /><Text style={styles.outlineButtonText}>Add ingredient</Text></Pressable>
  </View></ScrollView>;
}

function ProfileScreen({ recipes, pantryCount, darkMode, notificationsEnabled, session, onDarkModeChange, onNotificationsChange, onLogout }: { recipes: Recipe[]; pantryCount: number; darkMode: boolean; notificationsEnabled: boolean; session: AuthSession; onDarkModeChange: (value: boolean) => void; onNotificationsChange: (value: boolean) => void; onLogout: () => void }) {
  const favoriteCount = recipes.filter(recipe => recipe.favorite).length;
  const displayName = session.user.name?.trim() || session.user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();
  const rows = [['heart', 'Favorites', `${favoriteCount} saved recipes`], ['folder', 'Collections', '4 collections'], ['bell', 'Notifications', 'Import and expiry alerts']];
  return <ScrollView contentContainerStyle={styles.scroll}><View style={styles.page}><BrandHeader /><View style={styles.profileTop}><View style={styles.profileAvatar}><Text style={styles.profileInitial}>{initial}</Text></View><Text style={styles.profileName}>{displayName}</Text><Text style={styles.profileEmail}>{session.user.email}</Text><View style={styles.memberBadge}><Ionicons name="sparkles" size={13} color={colors.onLime} /><Text style={styles.memberText}>CRAVIO EARLY TASTER</Text></View></View>
    <View style={styles.profileStats}><View><Text style={styles.profileStatNum}>{recipes.length}</Text><Text style={styles.profileStatText}>Recipes</Text></View><View><Text style={styles.profileStatNum}>{favoriteCount}</Text><Text style={styles.profileStatText}>Favorites</Text></View><View><Text style={styles.profileStatNum}>{pantryCount}</Text><Text style={styles.profileStatText}>Pantry items</Text></View></View>
    <Text style={styles.settingsLabel}>YOUR COOKBOOK</Text><View style={styles.settingsCard}>{rows.map(([icon, title, subtitle]) => <Pressable style={styles.settingRow} key={title}><View style={styles.settingIcon}><Feather name={icon as any} size={18} color={colors.green} /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingSub}>{subtitle}</Text></View><Feather name="chevron-right" size={19} color={colors.muted} /></Pressable>)}</View>
    <Text style={styles.settingsLabel}>PREFERENCES</Text><View style={styles.settingsCard}><View style={styles.settingRow}><View style={styles.settingIcon}><Feather name="bell" size={18} color={colors.green} /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>Smart notifications</Text><Text style={styles.settingSub}>Recipe and pantry reminders</Text></View><Switch value={notificationsEnabled} onValueChange={onNotificationsChange} trackColor={{ false: colors.line, true: colors.green }} thumbColor={colors.onPrimary} /></View><View style={styles.settingRow}><View style={styles.settingIcon}><Feather name="moon" size={18} color={colors.green} /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>Dark mode</Text><Text style={styles.settingSub}>{darkMode ? 'Easy on the eyes' : 'Switch to the midnight kitchen'}</Text></View><Switch value={darkMode} onValueChange={onDarkModeChange} trackColor={{ false: colors.line, true: colors.green }} thumbColor={colors.onPrimary} /></View></View>
    <Pressable style={styles.logoutButton} onPress={onLogout} accessibilityRole="button"><Feather name="log-out" size={18} color={colors.red} /><Text style={styles.logoutText}>Sign out</Text></Pressable>
    <Text style={styles.version}>Cravio 1.0 · Made for people who are always hungry</Text>
  </View></ScrollView>;
}

function RecipeDetail({ recipe, onBack, onFavorite, onShoppingList }: { recipe: Recipe; onBack: () => void; onFavorite: () => void; onShoppingList: () => void }) {
  const [servings, setServings] = useState(recipe.servings); const [checked, setChecked] = useState<number[]>([]);
  const scale = servings / recipe.servings;
  return <View style={styles.detailScreen}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
    <ImageBackground source={{ uri: recipe.image }} style={styles.detailHero}><LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.68)']} style={StyleSheet.absoluteFill} /><SafeAreaView style={styles.detailTop} edges={['top']}><Pressable style={[styles.detailIcon, { backgroundColor: colors.surface }]} onPress={onBack}><Feather name="arrow-left" size={21} color={colors.ink} /></Pressable><View style={styles.detailActions}><Pressable style={[styles.detailIcon, { backgroundColor: colors.surface }]} onPress={() => Share.share({ message: `${recipe.title} — saved with Cravio` })}><Feather name="share-2" size={19} color={colors.ink} /></Pressable><Pressable style={[styles.detailIcon, { backgroundColor: colors.surface }]} onPress={onFavorite}><Ionicons name={recipe.favorite ? 'heart' : 'heart-outline'} size={21} color={recipe.favorite ? colors.red : colors.ink} /></Pressable></View></SafeAreaView>
      <View style={styles.detailCopy}><View style={styles.sourceBadge}><Ionicons name={recipe.platform === 'Instagram' ? 'logo-instagram' : recipe.platform === 'TikTok' ? 'logo-tiktok' : 'logo-youtube'} size={14} color={colors.onPrimary} /><Text style={[styles.sourceText, { color: colors.onPrimary }]}>{recipe.creator}</Text></View><Text style={[styles.detailTitle, { color: colors.onPrimary }]}>{recipe.title}</Text><Text style={styles.detailDesc}>{recipe.description}</Text></View>
    </ImageBackground>
    <View style={styles.detailBody}>
      <Pressable style={styles.originalVideo} onPress={() => Linking.openURL(recipe.sourceUrl)}><View style={styles.playButton}><Ionicons name="play" size={17} color={colors.onPrimary} /></View><View style={{ flex: 1 }}><Text style={styles.originalLabel}>ORIGINAL VIDEO</Text><Text style={styles.originalCreator}>Watch {recipe.creator}'s reel</Text></View><Feather name="external-link" size={18} color={colors.green} /></Pressable>
      <View style={styles.quickStats}>{[[`${recipe.prepTime}m`, 'PREP'], [`${recipe.time}m`, 'COOK'], [recipe.difficulty, 'LEVEL']].map(([value, label]) => <View key={label} style={styles.quickStat}><Text style={styles.quickStatValue}>{value}</Text><Text style={styles.quickStatLabel}>{label}</Text></View>)}</View>
      <View style={styles.nutritionHeader}><View><Text style={styles.detailSectionTitle}>Nutrition</Text><Text style={styles.estimated}>Estimated per serving</Text></View><Ionicons name="information-circle-outline" size={19} color={colors.muted} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nutritionRow}>{[[recipe.calories, 'CALORIES'], [`${recipe.protein}g`, 'PROTEIN'], [`${recipe.carbs}g`, 'CARBS'], [`${recipe.fat}g`, 'FAT']].map(([value, label], i) => <View key={label} style={[styles.nutritionCard, i === 1 && { backgroundColor: colors.greenSoft }]}><Text style={styles.nutritionValue}>{value}</Text><Text style={styles.nutritionLabel}>{label}</Text></View>)}</ScrollView>
      <View style={styles.divider} />
      <View style={styles.ingredientHeader}><View><Text style={styles.detailSectionTitle}>Ingredients</Text><Text style={styles.estimated}>{recipe.ingredients.length} ingredients · {recipe.missing.length ? `${recipe.missing.length} missing` : 'all in pantry'}</Text></View><View style={styles.servings}><Pressable onPress={() => setServings(Math.max(1, servings - 1))}><Feather name="minus" size={16} color={colors.green} /></Pressable><Text style={styles.servingsText}>{servings} servings</Text><Pressable onPress={() => setServings(servings + 1)}><Feather name="plus" size={16} color={colors.green} /></Pressable></View></View>
      <View style={styles.ingredientList}>{recipe.ingredients.map((item, index) => <Pressable key={item.name} style={styles.ingredientRow} onPress={() => setChecked(checked.includes(index) ? checked.filter(i => i !== index) : [...checked, index])}><View style={[styles.check, checked.includes(index) && styles.checkActive]}>{checked.includes(index) ? <Feather name="check" size={13} color={colors.onPrimary} /> : null}</View><Text style={[styles.ingredientName, checked.includes(index) && styles.strike]}>{item.name}</Text><Text style={styles.ingredientQty}>{scale === 1 ? item.quantity : `${scale.toFixed(1)}× ${item.quantity}`}</Text>{item.owned ? <View style={styles.ownedDot} /> : <View style={styles.missingDot} />}</Pressable>)}</View>
      {recipe.missing.length ? <Pressable style={styles.shoppingButton} onPress={onShoppingList}><Feather name="shopping-bag" size={18} color={colors.green} /><Text style={styles.shoppingText}>Add {recipe.missing.join(', ')} to shopping list</Text></Pressable> : null}
      <View style={styles.divider} /><Text style={styles.detailSectionTitle}>Let's cook</Text><View style={styles.steps}>{recipe.instructions.map((step, index) => <View style={styles.step} key={step}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={styles.stepText}>{step}</Text></View>)}</View>
      {recipe.note ? <View style={styles.note}><Feather name="edit-3" size={19} color={colors.green} /><View style={{ flex: 1 }}><Text style={styles.noteLabel}>MY NOTE</Text><Text style={styles.noteText}>{recipe.note}</Text></View></View> : null}
      <View style={styles.tags}>{recipe.tags.map(tag => <View key={tag} style={styles.tag}><Text style={styles.tagText}># {tag}</Text></View>)}</View>
    </View>
  </ScrollView></View>;
}

function AddPantryModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (item: PantryItem) => Promise<boolean> }) {
  const [name, setName] = useState(''); const [quantity, setQuantity] = useState(''); const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const saved = await onSave({ id: '', name: name.trim(), quantity: quantity || '1 item', category: 'Pantry', icon: '🥕' });
    setSaving(false);
    if (saved) { setName(''); setQuantity(''); }
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.modalBackdrop} onPress={onClose} /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalPosition}><View style={styles.modalCard}><View style={styles.modalHandle} /><View style={styles.modalHeader}><View><Text style={styles.modalTitle}>Add to pantry</Text><Text style={styles.modalSubtitle}>What did you bring home?</Text></View><Pressable style={styles.iconButton} onPress={onClose}><Feather name="x" size={20} color={colors.ink} /></Pressable></View><Text style={styles.inputLabel}>INGREDIENT</Text><TextInput value={name} onChangeText={setName} autoFocus placeholder="e.g. Cherry tomatoes" placeholderTextColor="#A2AAA5" style={styles.modalInput} /><Text style={styles.inputLabel}>QUANTITY</Text><TextInput value={quantity} onChangeText={setQuantity} placeholder="e.g. 500 g" placeholderTextColor="#A2AAA5" style={styles.modalInput} /><Pressable style={[styles.primaryButton, saving && { opacity: 0.75 }]} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color={colors.lime} /> : <><Feather name="plus" size={18} color={colors.lime} /><Text style={styles.primaryButtonText}>Add ingredient</Text></>}</Pressable></View></KeyboardAvoidingView></Modal>;
}

export default function App() {
  const [tab, setTab] = useState<TabName>('Home'); const [recipeList, setRecipeList] = useState<Recipe[]>([]); const [pantry, setPantry] = useState<PantryItem[]>([]); const [detail, setDetail] = useState<Recipe | null>(null); const [addPantry, setAddPantry] = useState(false); const [darkMode, setDarkMode] = useState(false); const [notificationsEnabled, setNotificationsEnabled] = useState(true); const [session, setSession] = useState<AuthSession | null>(null); const [restoringSession, setRestoringSession] = useState(true); const [loadingData, setLoadingData] = useState(false); const [authIntent, setAuthIntent] = useState<AuthIntent | null>(null);
  applyTheme(darkMode);
  styles = createStyles();
  const favorite = async (id: string) => {
    const current = detail?.id === id ? detail : recipeList.find((recipe) => recipe.id === id);
    if (!current) return;
    const nextFavorite = !current.favorite;
    const applyFavorite = (favoriteValue: boolean) => {
      setRecipeList(list => list.map(recipe => recipe.id === id ? { ...recipe, favorite: favoriteValue } : recipe));
      setDetail(selected => selected?.id === id ? { ...selected, favorite: favoriteValue } : selected);
    };
    applyFavorite(nextFavorite);
    try { await updateRecipeFavorite(id, nextFavorite); }
    catch (error) { applyFavorite(current.favorite); Alert.alert('Could not update favorite', (error as Error).message); }
  };
  const selectTab = (next: TabName) => {
    if (!session && protectedTabs.has(next)) { setAuthIntent({ kind: 'tab', tab: next }); return; }
    setDetail(null); setTab(next);
  };
  const imported = (recipe: Recipe) => { setRecipeList(list => [recipe, ...list]); setDetail(recipe); };
  useEffect(() => {
    if (!detail || Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setDetail(null); return true; });
    return () => subscription.remove();
  }, [detail]);
  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const stored = await loadStoredSession();
        if (!stored) return;
        if (new Date(stored.expiresAt).getTime() <= Date.now()) {
          await clearStoredSession();
          return;
        }
        setAccessToken(stored.token);
        const user = await getCurrentUser();
        if (active) setSession({ ...stored, user });
      } catch {
        setAccessToken(null);
        await clearStoredSession();
      } finally {
        if (active) setRestoringSession(false);
      }
    };
    void restore();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!session) { setRecipeList([]); setPantry([]); setDarkMode(false); setNotificationsEnabled(true); return; }
    let active = true;
    setLoadingData(true);
    Promise.all([listRecipes(), listPantry(), listRecommendations(), getPreferences()])
      .then(([recipes, pantryItems, recommendations, preferences]) => {
        if (!active) return;
        setRecipeList(mergeRecommendations(recipes, recommendations));
        setPantry(pantryItems);
        setDarkMode(preferences.darkMode);
        setNotificationsEnabled(preferences.notificationsEnabled);
      })
      .catch((error) => { if (active) Alert.alert('Could not load your kitchen', (error as Error).message); })
      .finally(() => { if (active) setLoadingData(false); });
    return () => { active = false; };
  }, [session?.user.id]);
  const authenticated = (nextSession: AuthSession) => {
    const intent = authIntent;
    setAccessToken(nextSession.token); setSession(nextSession); setAuthIntent(null); void storeSession(nextSession);
    if (intent?.kind === 'tab') { setDetail(null); setTab(intent.tab); }
    if (intent?.kind === 'favorite') void favorite(intent.recipeId);
    if (intent?.kind === 'pantry') setAddPantry(true);
    if (intent?.kind === 'shopping') {
      const recipe = detail?.id === intent.recipeId ? detail : recipeList.find(item => item.id === intent.recipeId);
      if (recipe) void addRecipeToShoppingList(recipe);
    }
  };
  const favoriteWithAuth = (id: string) => session ? void favorite(id) : setAuthIntent({ kind: 'favorite', recipeId: id });
  const addPantryWithAuth = () => session ? setAddPantry(true) : setAuthIntent({ kind: 'pantry' });
  const addRecipeToShoppingList = async (recipe: Recipe) => {
    const missing = [...new Set(recipe.missing)];
    try {
      await Promise.all(missing.map((name) => {
        const ingredient = recipe.ingredients.find(item => item.name.toLowerCase() === name.toLowerCase());
        return addShoppingListItem(name, ingredient?.quantity);
      }));
      Alert.alert('Added to shopping list', `${missing.length} ${missing.length === 1 ? 'ingredient is' : 'ingredients are'} ready for your next grocery run.`);
    } catch (error) {
      Alert.alert('Could not finish shopping list', (error as Error).message);
    }
  };
  const shoppingWithAuth = (recipe: Recipe) => session
    ? void addRecipeToShoppingList(recipe)
    : setAuthIntent({ kind: 'shopping', recipeId: recipe.id });
  const changeDarkMode = async (value: boolean) => {
    const previous = darkMode;
    setDarkMode(value);
    try { setDarkMode((await updatePreferences({ darkMode: value })).darkMode); }
    catch (error) { setDarkMode(previous); Alert.alert('Could not save dark mode', (error as Error).message); }
  };
  const changeNotifications = async (value: boolean) => {
    const previous = notificationsEnabled;
    setNotificationsEnabled(value);
    try { setNotificationsEnabled((await updatePreferences({ notificationsEnabled: value })).notificationsEnabled); }
    catch (error) { setNotificationsEnabled(previous); Alert.alert('Could not save notifications', (error as Error).message); }
  };
  const logout = async () => {
    try { await logoutSession(); } catch { /* Clear the local session even when the network is unavailable. */ }
    await clearStoredSession(); setAccessToken(null); setSession(null); setTab('Home'); setDetail(null);
  };
  const savePantryItem = async (item: PantryItem): Promise<boolean> => {
    try {
      const created = await createPantryItem(item);
      setPantry(items => [created, ...items]);
      setAddPantry(false);
      try {
        const recommendations = await listRecommendations();
        setRecipeList(recipes => mergeRecommendations(recipes, recommendations));
      } catch { /* The saved pantry item remains valid if recommendation refresh is unavailable. */ }
      return true;
    } catch (error) {
      Alert.alert('Could not add ingredient', (error as Error).message);
      return false;
    }
  };
  if (restoringSession || loadingData) return <SafeAreaProvider><View style={styles.authLoading}><ActivityIndicator color={colors.green} /></View></SafeAreaProvider>;
  if (authIntent) return <SafeAreaProvider><StatusBar style={darkMode ? 'light' : 'dark'} /><AuthScreen onAuthenticated={authenticated} onCancel={() => setAuthIntent(null)} /></SafeAreaProvider>;
  return <SafeAreaProvider><StatusBar style={detail || darkMode ? 'light' : 'dark'} />
    {detail ? <RecipeDetail recipe={detail} onBack={() => setDetail(null)} onFavorite={() => favoriteWithAuth(detail.id)} onShoppingList={() => shoppingWithAuth(detail)} /> : <SafeAreaView style={styles.app} edges={['top']}>
      {tab === 'Home' && <HomeScreen recipes={recipeList} viewerName={session?.user.name?.trim() || 'Guest'} onOpen={setDetail} onTab={selectTab} onFavorite={favoriteWithAuth} />}
      {tab === 'Cookbook' && <CookbookScreen recipes={recipeList} onOpen={setDetail} onFavorite={favoriteWithAuth} />}
      {tab === 'Import' && <ImportScreen onComplete={imported} />}
      {tab === 'Pantry' && <PantryScreen pantry={pantry} onAdd={addPantryWithAuth} />}
      {tab === 'Profile' && session && <ProfileScreen recipes={recipeList} pantryCount={pantry.length} darkMode={darkMode} notificationsEnabled={notificationsEnabled} session={session} onDarkModeChange={(value) => void changeDarkMode(value)} onNotificationsChange={(value) => void changeNotifications(value)} onLogout={logout} />}
      <BottomNav active={tab} onChange={selectTab} />
    </SafeAreaView>}
    <AddPantryModal visible={addPantry} onClose={() => setAddPantry(false)} onSave={savePantryItem} />
  </SafeAreaProvider>;
}

let styles = createStyles();
function createStyles() { return StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background }, authLoading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, flexScreen: { flex: 1 }, detailScreen: { flex: 1, backgroundColor: colors.surface }, scroll: { paddingBottom: 115 }, page: { ...contentWidth, paddingHorizontal: 20 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', gap: 11 }, brandLogoFrame: { width: 116, height: 42, flexDirection: 'row', alignItems: 'center' }, brandMark: { width: 34, height: 38, justifyContent: 'center' }, brandC: { color: colors.ink, fontSize: 33, lineHeight: 38, fontWeight: '900', letterSpacing: -2 }, brandRibbon: { position: 'absolute', width: 8, height: 16, left: 12, bottom: 3, borderRadius: 2, backgroundColor: colors.lime, overflow: 'hidden' }, brandRibbonCut: { position: 'absolute', width: 6, height: 6, left: 1, bottom: -4, backgroundColor: colors.background, transform: [{ rotate: '45deg' }] }, brandWord: { color: colors.ink, fontSize: 21, lineHeight: 26, fontWeight: '900', letterSpacing: -1.1, marginLeft: 2 }, headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' }, headerSubtitle: { color: colors.muted, fontSize: 11 }, iconButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, borderWidth: colors.isDark ? 1 : 0, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', ...shadow }, notifyDot: { position: 'absolute', right: 9, top: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange, borderWidth: 1.5, borderColor: colors.surface },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 24 }, eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: colors.green, marginBottom: 7 }, heroTitle: { fontSize: 35, lineHeight: 39, letterSpacing: -1.3, color: colors.ink, fontWeight: '900' }, avatar: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.green, fontSize: 18, fontWeight: '900' }, searchResults: { marginTop: 14 },
  importHero: { marginTop: 24, borderRadius: 26, overflow: 'hidden', ...shadow }, importGradient: { minHeight: 230, padding: 24, flexDirection: 'row', alignItems: 'center' }, importCopy: { flex: 1, zIndex: 2 }, importEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }, importEyebrowText: { color: colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, importTitle: { color: colors.onPrimary, fontSize: 26, lineHeight: 30, letterSpacing: -0.7, fontWeight: '900' }, importText: { color: '#C8D6CE', fontSize: 12, lineHeight: 17, marginTop: 8, maxWidth: 190 }, importButton: { height: 42, marginTop: 18, alignSelf: 'flex-start', paddingHorizontal: 15, borderRadius: 13, backgroundColor: colors.lime, flexDirection: 'row', alignItems: 'center', gap: 7 }, importButtonText: { color: colors.onLime, fontWeight: '800', fontSize: 12 }, heroArt: { width: 118, height: 154, borderRadius: 60, backgroundColor: '#F0D5A5', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] }, heroEmoji: { fontSize: 64 }, sparkle: { position: 'absolute', top: -10, right: -5, width: 38, height: 38, borderRadius: 19, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 33 }, horizontalList: { paddingLeft: 20, paddingRight: 20, paddingBottom: 12 }, tipCard: { marginTop: 14, backgroundColor: colors.greenSoft, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, tipIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, tipLabel: { color: colors.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, tipTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 3 }, tipText: { color: colors.muted, fontSize: 11, marginTop: 2 },
  screenTitle: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1, marginTop: 20 }, screenSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5 }, chipRow: { paddingHorizontal: 20, paddingVertical: 18, gap: 8 }, chip: { height: 38, borderRadius: 19, paddingHorizontal: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line }, chipActive: { backgroundColor: colors.primary, borderColor: colors.primary }, chipText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, chipTextActive: { color: colors.onPrimary }, collectionStats: { backgroundColor: colors.greenSoft, padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 24 }, statNumber: { textAlign: 'center', fontSize: 20, fontWeight: '900', color: colors.green }, statLabel: { textAlign: 'center', fontSize: 8, letterSpacing: 1, fontWeight: '800', color: colors.muted, marginTop: 2 }, statDivider: { width: 1, height: 28, backgroundColor: colors.line }, resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, resultText: { fontSize: 20, fontWeight: '900', color: colors.ink }, sort: { flexDirection: 'row', alignItems: 'center', gap: 5 }, sortText: { fontSize: 11, fontWeight: '700', color: colors.muted }, empty: { alignItems: 'center', paddingVertical: 50 }, emptyEmoji: { fontSize: 42 }, emptyTitle: { color: colors.ink, fontWeight: '900', fontSize: 19, marginTop: 12 }, emptyText: { color: colors.muted, fontSize: 13, marginTop: 5 },
  importPageIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 26 }, urlCard: { marginTop: 26, borderRadius: 24, backgroundColor: colors.surface, padding: 18, ...shadow }, inputLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8, marginTop: 5 }, urlInput: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }, urlTextInput: { flex: 1, height: '100%', color: colors.ink, fontSize: 13 }, primaryButton: { minHeight: 54, marginTop: 14, backgroundColor: colors.primary, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 18 }, primaryButtonText: { color: colors.onPrimary, fontSize: 14, fontWeight: '800', flex: 1, textAlign: 'center' }, processCard: { backgroundColor: colors.surface, borderRadius: 22, padding: 18, marginTop: 16, ...shadow }, processTop: { flexDirection: 'row', justifyContent: 'space-between' }, processTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, processPercent: { color: colors.green, fontSize: 13, fontWeight: '900' }, progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.greenSoft, marginVertical: 14, overflow: 'hidden' }, progressBar: { height: 6, backgroundColor: colors.green, borderRadius: 3 }, processMessage: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 5 }, processStep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 }, stepDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.line }, stepDotActive: { backgroundColor: colors.orange, borderWidth: 5, borderColor: colors.orangeSoft }, processStepText: { color: colors.muted, fontSize: 12, fontWeight: '600' }, saveButton: { height: 48, borderRadius: 15, marginTop: 16, backgroundColor: colors.lime, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, saveButtonText: { color: colors.onLime, fontWeight: '800' }, howCard: { marginTop: 24, backgroundColor: colors.surface, borderRadius: 24, padding: 20 }, howTitle: { color: colors.ink, fontSize: 19, fontWeight: '900', marginBottom: 5 }, howRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 }, howNumber: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' }, howRowTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, howRowText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 }, howLine: { position: 'absolute', width: 1, height: 18, backgroundColor: colors.line, left: 19, bottom: -9 }, platforms: { marginTop: 24 }, platformLabel: { textAlign: 'center', color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, platformRow: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 12 }, platform: { flexDirection: 'row', alignItems: 'center', gap: 6 }, platformText: { color: colors.ink, fontWeight: '700', fontSize: 11 },
  titleAction: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, roundAdd: { width: 48, height: 48, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, pantryHero: { marginVertical: 25, padding: 22, borderRadius: 24, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center' }, pantryHeroLabel: { color: colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, pantryHeroTitle: { color: colors.onPrimary, fontSize: 22, lineHeight: 26, fontWeight: '900', marginTop: 7 }, pantryHeroText: { color: '#C8DBD1', fontSize: 11, marginTop: 7 }, pantryScore: { width: 86, height: 86, borderRadius: 43, borderWidth: 6, borderColor: colors.lime, alignItems: 'center', justifyContent: 'center' }, pantryScoreNumber: { color: colors.onPrimary, fontSize: 23, fontWeight: '900' }, pantryScoreLabel: { textAlign: 'center', color: '#D1E1D8', fontSize: 7, lineHeight: 9, fontWeight: '800' }, pantryItem: { minHeight: 72, padding: 10, borderRadius: 18, backgroundColor: colors.surface, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 }, pantryIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, pantryEmoji: { fontSize: 25 }, pantryName: { color: colors.ink, fontSize: 14, fontWeight: '800' }, pantryQty: { color: colors.muted, fontSize: 11, marginTop: 4 }, expiry: { paddingHorizontal: 9, height: 25, borderRadius: 12, backgroundColor: colors.greenSoft, justifyContent: 'center' }, expirySoon: { backgroundColor: colors.orangeSoft }, expiryText: { color: colors.green, fontSize: 9, fontWeight: '800' }, expirySoonText: { color: colors.orangeInk }, outlineButton: { height: 52, borderRadius: 17, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.green, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, outlineButtonText: { color: colors.green, fontWeight: '800', fontSize: 13 },
  profileTop: { alignItems: 'center', marginTop: 20 }, profileAvatar: { width: 82, height: 82, borderRadius: 28, backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.surface, ...shadow }, profileInitial: { color: colors.green, fontSize: 32, fontWeight: '900' }, profileName: { fontSize: 24, fontWeight: '900', color: colors.ink, marginTop: 12 }, profileEmail: { color: colors.muted, fontSize: 12, marginTop: 3 }, memberBadge: { backgroundColor: colors.lime, paddingHorizontal: 11, height: 26, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }, memberText: { color: colors.onLime, fontSize: 8, letterSpacing: 1, fontWeight: '900' }, profileStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surface, padding: 20, borderRadius: 22, marginTop: 24, ...shadow }, profileStatNum: { textAlign: 'center', color: colors.ink, fontSize: 21, fontWeight: '900' }, profileStatText: { textAlign: 'center', color: colors.muted, fontSize: 10, marginTop: 3 }, settingsLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1.4, fontWeight: '900', marginTop: 26, marginBottom: 8 }, settingsCard: { backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 14, borderWidth: colors.isDark ? 1 : 0, borderColor: colors.line }, settingRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, settingIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' }, settingTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, settingSub: { color: colors.muted, fontSize: 10, marginTop: 3 }, version: { color: colors.muted, fontSize: 10, textAlign: 'center', marginVertical: 28 },
  logoutButton: { height: 52, borderRadius: 17, borderWidth: 1, borderColor: colors.line, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface }, logoutText: { color: colors.red, fontSize: 13, fontWeight: '800' },
  comingSoon: { color: colors.green, backgroundColor: colors.greenSoft, fontSize: 8, fontWeight: '900', letterSpacing: 1, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  detailHero: { height: 480, justifyContent: 'space-between' }, detailTop: { paddingHorizontal: 18, paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' }, detailActions: { flexDirection: 'row', gap: 9 }, detailIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, detailCopy: { paddingHorizontal: 22, paddingBottom: 30 }, sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }, sourceText: { color: colors.onPrimary, fontSize: 11, fontWeight: '700' }, detailTitle: { color: colors.onPrimary, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1 }, detailDesc: { color: '#E1E7E3', fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 360 }, detailBody: { backgroundColor: colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -22, paddingHorizontal: 20, paddingTop: 22 }, originalVideo: { backgroundColor: colors.greenSoft, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }, playButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, originalLabel: { color: colors.green, fontSize: 8, letterSpacing: 1.2, fontWeight: '900' }, originalCreator: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 3 }, quickStats: { flexDirection: 'row', paddingVertical: 24, justifyContent: 'space-around' }, quickStat: { alignItems: 'center', flex: 1, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.line }, quickStatValue: { color: colors.ink, fontSize: 16, fontWeight: '900' }, quickStatLabel: { color: colors.muted, fontSize: 8, letterSpacing: 1.1, fontWeight: '800', marginTop: 3 }, nutritionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, detailSectionTitle: { color: colors.ink, fontSize: 23, fontWeight: '900', letterSpacing: -0.4 }, estimated: { color: colors.muted, fontSize: 10, marginTop: 3 }, nutritionRow: { paddingVertical: 15, gap: 9 }, nutritionCard: { minWidth: 88, padding: 14, borderRadius: 17, backgroundColor: colors.background }, nutritionValue: { color: colors.ink, fontSize: 17, fontWeight: '900' }, nutritionLabel: { color: colors.muted, fontSize: 8, letterSpacing: 0.8, fontWeight: '800', marginTop: 4 }, divider: { height: 1, backgroundColor: colors.line, marginVertical: 24 }, ingredientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, servings: { backgroundColor: colors.greenSoft, borderRadius: 15, paddingHorizontal: 11, height: 37, flexDirection: 'row', alignItems: 'center', gap: 8 }, servingsText: { color: colors.green, fontWeight: '800', fontSize: 10 }, ingredientList: { marginTop: 16 }, ingredientRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, gap: 10 }, check: { width: 21, height: 21, borderRadius: 7, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, checkActive: { backgroundColor: colors.primary, borderColor: colors.primary }, ingredientName: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '600' }, strike: { textDecorationLine: 'line-through', color: colors.muted }, ingredientQty: { color: colors.muted, fontSize: 11 }, ownedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green }, missingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange }, shoppingButton: { minHeight: 48, paddingHorizontal: 12, backgroundColor: colors.orangeSoft, borderRadius: 15, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, shoppingText: { color: colors.orangeInk, fontSize: 11, fontWeight: '800' }, steps: { marginTop: 18 }, step: { flexDirection: 'row', gap: 14, marginBottom: 23 }, stepNumber: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, stepNumberText: { color: colors.lime, fontWeight: '900' }, stepText: { color: colors.ink, fontSize: 13, lineHeight: 20, flex: 1, paddingTop: 5 }, note: { padding: 17, backgroundColor: colors.greenSoft, borderRadius: 18, flexDirection: 'row', gap: 11, marginTop: 4 }, noteLabel: { color: colors.green, fontSize: 8, letterSpacing: 1, fontWeight: '900' }, noteText: { color: colors.ink, fontSize: 12, lineHeight: 17, marginTop: 4 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 }, tag: { paddingHorizontal: 11, height: 30, borderRadius: 15, backgroundColor: colors.background, justifyContent: 'center' }, tagText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,25,20,0.48)' }, modalPosition: { flex: 1, justifyContent: 'flex-end' }, modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 34 }, modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 18 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, modalTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' }, modalSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 }, modalInput: { height: 53, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, paddingHorizontal: 14, color: colors.ink, marginBottom: 14 },
  notificationPosition: { flex: 1, justifyContent: 'flex-end' }, notificationSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingBottom: 32 }, notificationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }, notificationState: { minHeight: 112, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 }, notificationStateText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' }, notificationItem: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, paddingVertical: 12 }, notificationIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' }, notificationTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, notificationBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, notificationTime: { alignSelf: 'flex-start', color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 5 }, notificationAction: { height: 48, borderRadius: 15, backgroundColor: colors.greenSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18 }, notificationActionText: { color: colors.green, fontSize: 12, fontWeight: '800' },
}); }
