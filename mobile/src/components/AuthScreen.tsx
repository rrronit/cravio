import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthSession, requestEmailOtp, verifyEmailOtp } from '../services/api';
import { colors, shadow } from '../theme';

type AuthStep = 'email' | 'otp';

type AuthScreenProps = {
  onAuthenticated: (session: AuthSession) => void;
  onCancel?: () => void;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(normalizeEmail(value));

export function AuthScreen({ onAuthenticated, onCancel }: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const styles = createStyles();

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const sendCode = async () => {
    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await requestEmailOtp(normalizeEmail(email));
      setStep('otp');
      setDevCode(result.devCode ?? null);
      setCode(result.devCode ?? '');
      const resendSeconds = Number.isFinite(result.expiresIn) ? result.expiresIn : 60;
      setResendIn(Math.min(Math.max(resendSeconds, 30), 60));
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const session = await verifyEmailOtp(normalizeEmail(email), code);
      onAuthenticated(session);
    } catch (verifyError) {
      setError((verifyError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const editEmail = () => {
    setStep('email');
    setCode('');
    setDevCode(null);
    setError('');
    setResendIn(0);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.brand} accessibilityLabel="Cravio">
            <View style={styles.brandMark}>
              <Text style={styles.brandC}>C</Text>
              <View style={styles.brandRibbon}><View style={styles.brandRibbonCut} /></View>
            </View>
            <Text style={styles.brandWord}>cravio</Text>
          </View>
          {onCancel ? <Pressable style={styles.closeButton} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Close sign in"><Feather name="x" size={20} color={colors.ink} /></Pressable> : null}

          <View style={styles.heroIcon}>
            <Ionicons name={step === 'email' ? 'mail-outline' : 'key-outline'} size={30} color={colors.green} />
          </View>
          <Text style={styles.title}>{step === 'email' ? 'Welcome to Cravio' : 'Check your inbox'}</Text>
          <Text style={styles.subtitle}>
            {step === 'email'
              ? 'Sign in or create your account with a one-time code. No password needed.'
              : `We sent a 6-digit code to ${normalizeEmail(email)}.`}
          </Text>

          <View style={styles.card}>
            {step === 'email' ? (
              <>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View style={[styles.inputWrap, error ? styles.inputError : null]}>
                  <Feather name="mail" size={19} color={colors.muted} />
                  <TextInput
                    value={email}
                    onChangeText={(value) => { setEmail(value); setError(''); }}
                    onSubmitEditing={sendCode}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.muted}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    style={styles.input}
                  />
                </View>
                <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={sendCode} disabled={busy}>
                  {busy ? <ActivityIndicator color={colors.lime} /> : <><Text style={styles.buttonText}>Email me a code</Text><Feather name="arrow-right" size={18} color={colors.onPrimary} /></>}
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.emailRow}>
                  <Text style={styles.label}>ONE-TIME CODE</Text>
                  <Pressable onPress={editEmail}><Text style={styles.editText}>Change email</Text></Pressable>
                </View>
                <TextInput
                  value={code}
                  onChangeText={(value) => { setCode(value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  onSubmitEditing={verifyCode}
                  placeholder="000000"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={6}
                  autoFocus
                  returnKeyType="done"
                  style={[styles.codeInput, error ? styles.inputError : null]}
                />
                {devCode ? <View style={styles.devCode}><Feather name="tool" size={15} color={colors.orangeInk} /><Text style={styles.devCodeText}>Local development code: <Text style={styles.devCodeValue}>{devCode}</Text></Text></View> : null}
                <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={verifyCode} disabled={busy}>
                  {busy ? <ActivityIndicator color={colors.lime} /> : <><Text style={styles.buttonText}>Verify & continue</Text><Feather name="check" size={18} color={colors.onPrimary} /></>}
                </Pressable>
                <Pressable style={styles.resendButton} onPress={sendCode} disabled={busy || resendIn > 0}>
                  <Text style={[styles.resendText, resendIn > 0 && styles.resendDisabled]}>
                    {resendIn > 0 ? `Send another code in ${resendIn}s` : 'Send another code'}
                  </Text>
                </Pressable>
              </>
            )}
            {error ? <View style={styles.errorRow}><Feather name="alert-circle" size={15} color={colors.red} /><Text style={styles.errorText}>{error}</Text></View> : null}
          </View>

          <View style={styles.securityNote}>
            <Feather name="shield" size={16} color={colors.green} />
            <Text style={styles.securityText}>Your code expires shortly and can only be used once.</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = () => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  brand: { position: 'absolute', top: 16, left: 24, height: 42, flexDirection: 'row', alignItems: 'center' },
  closeButton: { position: 'absolute', top: 16, right: 24, width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  brandMark: { width: 34, height: 38, justifyContent: 'center' },
  brandC: { color: colors.ink, fontSize: 33, lineHeight: 38, fontWeight: '900', letterSpacing: -2 },
  brandRibbon: { position: 'absolute', width: 8, height: 16, left: 12, bottom: 3, borderRadius: 2, backgroundColor: colors.lime, overflow: 'hidden' },
  brandRibbonCut: { position: 'absolute', width: 6, height: 6, left: 1, bottom: -4, backgroundColor: colors.background, transform: [{ rotate: '45deg' }] },
  brandWord: { color: colors.ink, fontSize: 21, lineHeight: 26, fontWeight: '900', letterSpacing: -1.1, marginLeft: 2 },
  heroIcon: { width: 62, height: 62, borderRadius: 21, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  title: { color: colors.ink, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.9, textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9, paddingHorizontal: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginTop: 26, borderWidth: colors.isDark ? 1 : 0, borderColor: colors.line, ...shadow },
  label: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 9 },
  inputWrap: { height: 56, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, height: '100%', color: colors.ink, fontSize: 15 },
  inputError: { borderColor: colors.red },
  codeInput: { height: 64, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, color: colors.ink, fontSize: 27, fontWeight: '800', letterSpacing: 10, textAlign: 'center', paddingLeft: 10 },
  emailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editText: { color: colors.green, fontSize: 11, fontWeight: '800', marginBottom: 9 },
  button: { minHeight: 54, borderRadius: 17, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, paddingHorizontal: 18 },
  buttonPressed: { opacity: 0.88 },
  buttonText: { color: colors.onPrimary, fontSize: 14, fontWeight: '800' },
  resendButton: { alignItems: 'center', paddingTop: 16, paddingBottom: 2 },
  resendText: { color: colors.green, fontSize: 12, fontWeight: '800' },
  resendDisabled: { color: colors.muted },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 13 },
  errorText: { flex: 1, color: colors.red, fontSize: 11, lineHeight: 16 },
  devCode: { minHeight: 38, borderRadius: 12, backgroundColor: colors.orangeSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10, paddingHorizontal: 12 },
  devCodeText: { color: colors.orangeInk, fontSize: 11, fontWeight: '700' },
  devCodeValue: { fontWeight: '900', letterSpacing: 1.5 },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18 },
  securityText: { color: colors.muted, fontSize: 10 },
});
