import React from 'react';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Link, Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

const codeSymbolName: SFSymbol = Platform.select({
  ios: 'chevron.left.forwardslash.chevron.right',
  android: 'barcode.viewfinder',
  web: 'barcode.viewfinder',
  default: 'barcode.viewfinder',
}) as SFSymbol;

const infoSymbolName: SFSymbol = Platform.select({
  ios: 'info.circle',
  android: 'info.circle',
  web: 'info.circle',
  default: 'info.circle',
}) as SFSymbol;

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tab One',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={codeSymbolName}
              tintColor={color}
              size={28}
            />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={{ marginRight: 15 }}>
                {({ pressed }) => (
                  <SymbolView
                    name={infoSymbolName}
                    size={25}
                    tintColor={Colors[colorScheme].text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Tab Two',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={codeSymbolName}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
