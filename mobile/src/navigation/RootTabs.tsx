import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Compass, Heart } from "lucide-react-native";
import DiscoverScreen from "../screens/DiscoverScreen";
import WatchlistScreen from "../screens/WatchlistScreen";

export type RootTabParamList = {
  Discover: undefined;
  Watchlist: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function RootTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#10B981",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarStyle: { backgroundColor: "#0B0F16", borderTopColor: "#1F2937" },
        }}
      >
        <Tab.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Watchlist"
          component={WatchlistScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

