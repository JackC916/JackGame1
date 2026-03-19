import { Platform, StyleSheet, TextStyle, ViewStyle } from "react-native";

export const Colors = {
  background: "#121212",
  surface: "#1E1E1E",
  textPrimary: "#F5F5F5",
  textSecondary: "#B0B0B0",
  accent: "#FF5A5F",
  border: "#2A2A2A",
};

export const Typography = {
  baseFontSize: 16,
  headerFontSize: 24,
  lineHeightBase: 24,
  lineHeightHeader: 32,
  fontFamily: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: "System",
  }),
} as const;

export const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  } as ViewStyle,

  buttonPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: 24,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  } as ViewStyle,

  textBase: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.baseFontSize,
    lineHeight: Typography.lineHeightBase,
    color: Colors.textPrimary,
  } as TextStyle,

  textHeader: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.headerFontSize,
    lineHeight: Typography.lineHeightHeader,
    color: Colors.textPrimary,
    fontWeight: "700",
  } as TextStyle,
});

