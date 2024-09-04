import { WebView } from "react-native-webview";
import { StyleSheet } from "react-native";
export default function Index() {
  return (
    <WebView
      style={styles.container}
      source={{
        uri:
          process.env.EXPO_PUBLIC_WEBVIEW_URI ||
          "https://comuline-web.vercel.app/",
      }}
    />
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
