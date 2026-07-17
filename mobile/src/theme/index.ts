const lightColors = {
  background: '#F7F6F1',
  surface: '#FFFFFF',
  ink: '#19231F',
  muted: '#78817C',
  line: '#E6E7E1',
  green: '#1E5B43',
  greenSoft: '#DDEBE3',
  lime: '#DFF45D',
  orange: '#F29A55',
  orangeSoft: '#FCE8D8',
  red: '#D75A4A',
  yellow: '#F4C95D',
  onPrimary: '#FFFFFF',
};

const darkColors: typeof lightColors = {
  background: '#0D1511',
  surface: '#17211C',
  ink: '#F3F7F4',
  muted: '#A4B0A9',
  line: '#2B3831',
  green: '#347D5D',
  greenSoft: '#203D30',
  lime: '#DFF45D',
  orange: '#F2A264',
  orangeSoft: '#493224',
  red: '#F0786A',
  yellow: '#F4C95D',
  onPrimary: '#FFFFFF',
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
