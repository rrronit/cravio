const lightColors = {
  background: '#F7F6F1',
  surface: '#FFFFFF',
  ink: '#19231F',
  muted: '#78817C',
  line: '#E6E7E1',
  green: '#1E5B43',
  primary: '#1E5B43',
  greenSoft: '#DDEBE3',
  lime: '#DFF45D',
  orange: '#F29A55',
  orangeSoft: '#FCE8D8',
  orangeInk: '#9A5421',
  red: '#D75A4A',
  yellow: '#F4C95D',
  onPrimary: '#FFFFFF',
  onLime: '#173326',
  isDark: false,
};

const darkColors: typeof lightColors = {
  background: '#0B100E',
  surface: '#171D1A',
  ink: '#F4F1E8',
  muted: '#9EAAA3',
  line: '#2C3731',
  green: '#72D39F',
  primary: '#286B4D',
  greenSoft: '#173A2A',
  lime: '#DFF45D',
  orange: '#F2A264',
  orangeSoft: '#3D291F',
  orangeInk: '#FFB57A',
  red: '#F0786A',
  yellow: '#F4C95D',
  onPrimary: '#FFFFFF',
  onLime: '#173326',
  isDark: true,
};

export const colors = { ...lightColors };

export const shadow = {
  shadowColor: '#183326',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 3,
};

export function applyTheme(dark: boolean) {
  Object.assign(colors, dark ? darkColors : lightColors);
  shadow.shadowColor = dark ? '#000000' : '#183326';
  shadow.shadowOpacity = dark ? 0.24 : 0.08;
}
