import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const UTMap = () => {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: "https://maps.utahtech.edu/?key=jkhjkh8768gb8tg87tasd96asd76a0sd5axcv&ui=simple&template=light&abbrevs=SET,SNOW,HPC,AIP,SMITH,PLC,PLD,PLM,SAC&zoom=12" }}
        style={styles.webview}
        javaScriptEnabled={true} // allow JavaScript execution
        domStorageEnabled={true} // enable local storage
        startInLoadingState={true} // show loading indicator
      />
    </View>
  );
};

export default UTMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
