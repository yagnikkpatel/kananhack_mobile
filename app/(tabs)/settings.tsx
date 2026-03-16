import { View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const theme = Colors[useColorScheme() ?? 'light'];
  return <View style={{ flex: 1, backgroundColor: theme.background }} />;
}
