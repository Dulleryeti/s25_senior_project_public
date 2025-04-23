import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const UTMapSingle = ({ buildingAbbrev }) => {
  const mapUrl = `https://maps.utahtech.edu/?key=jkhjkh8768gb8tg87tasd96asd76a0sd5axcv&ui=simple&template=light&abbrevs=${buildingAbbrev}&zoom=15`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: mapUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        nestedScrollEnabled={true} 
        scrollEnabled={true}
      />
    </View>
  );
};

export default UTMapSingle;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
