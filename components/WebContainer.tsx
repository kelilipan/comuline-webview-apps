import React, { useRef, useState } from "react";
import { ScrollView, RefreshControl, View } from "react-native";
import RNWebView, {
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";

export interface WebContainerProps {
  url: string; // The URL to be loaded in the WebView
  onError?: (error: string) => void; // Optional callback for handling errors
  onUrlChange?: (newUrl: string) => void; // Optional callback for handling URL changes
  onMessage: (event: WebViewMessageEvent) => void;
  cacheEnabled?: boolean; // Optional boolean to enable or disable caching
}
const WebContainer = (props: WebContainerProps) => {
  const webViewRef = useRef<RNWebView | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refresherEnabled, setEnableRefresher] = useState(true);

  const url = props.url;

  const triggerRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  React.useEffect(() => {
    if (refreshing) {
      triggerRefresh();
    }
  }, [refreshing]);

  const onLoadingError = (error: any) => {
    props.onError && props.onError(error.nativeEvent.description);
  };

  const handleHttpError = (error: any) => {
    props.onError && props.onError(error.nativeEvent.description);
  };

  const onNavigationStateChange = (state: WebViewNavigation) => {
    props.onUrlChange && props.onUrlChange(state.url);
  };

  const handleScroll = (event: any) => {
    const yOffset = Number(event.nativeEvent.contentOffset.y);
    if (yOffset === 0) {
      setEnableRefresher(true);
    } else {
      setEnableRefresher(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{}}
        contentContainerStyle={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            enabled={refresherEnabled}
            onRefresh={() => {
              triggerRefresh();
              webViewRef?.current?.reload(); // Use optional chaining
            }}
          />
        }
      >
        <RNWebView
          onMessage={props.onMessage}
          onScroll={handleScroll}
          ref={webViewRef}
          scalesPageToFit
          javaScriptEnabled
          domStorageEnabled
          pullToRefreshEnabled
          cacheEnabled={props.cacheEnabled}
          cacheMode="LOAD_DEFAULT"
          source={{ uri: url }}
          startInLoadingState
          onError={onLoadingError}
          onHttpError={handleHttpError}
          onNavigationStateChange={onNavigationStateChange}
        />
      </ScrollView>
    </View>
  );
};

export default WebContainer;
