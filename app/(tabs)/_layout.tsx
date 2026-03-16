import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Pressable, StatusBar, Platform,
} from 'react-native';

function ProfileButton() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [visible, setVisible] = useState(false);
  const initials = user?.fullName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={[styles.avatar, { backgroundColor: theme.tint }]}>
        <Text style={styles.initials}>{initials}</Text>
      </TouchableOpacity>

      <Modal transparent animationType="fade" visible={visible} onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.dropdown, { backgroundColor: colorScheme === 'dark' ? '#1E2123' : '#fff' }]}>
            <View style={styles.userInfo}>
              <View style={[styles.avatarLarge, { backgroundColor: theme.tint }]}>
                <Text style={styles.initialsLarge}>{initials}</Text>
              </View>
              <Text style={[styles.name, { color: theme.text }]}>{user?.fullName || 'User'}</Text>
              <Text style={[styles.email, { color: theme.icon }]}>{user?.email || ''}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.icon + '30' }]} />
            <TouchableOpacity style={styles.logoutRow} onPress={() => { setVisible(false); signOut(); }}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Tabs screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: theme.background },
      headerTintColor: theme.text,
      headerRight: () => <ProfileButton />,
      headerRightContainerStyle: { paddingRight: 16 },
      tabBarStyle: { backgroundColor: theme.background },
      tabBarActiveTintColor: theme.tint,
      tabBarInactiveTintColor: theme.icon,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="upload" options={{ title: 'Upload', tabBarIcon: ({ color }) => <Ionicons name="cloud-upload" size={24} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#00000040',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: (StatusBar.currentHeight ?? 0) + 56,
    paddingRight: 16,
  },
  dropdown: {
    width: 220,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  userInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  initialsLarge: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '600',
  },
});
