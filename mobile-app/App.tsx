import React from "react";
import { View } from "react-native";
import RootTabs from "./src/navigation/RootTabs";
import { GlobalStyles } from "./src/theme/GlobalStyles";

export default function App() {
  return (
    <View style={GlobalStyles.screen}>
      <RootTabs />
    </View>
  );
}