import React, { useState } from "react";
import { View, Image, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { useAuth } from "@/context/authContext";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";


const HomeHeader = ({ onSecretPress }) => {
  const [pressCount, setPressCount] = useState(0);
  const { user } = useAuth();
  const {width} = useWindowDimensions();

  const handlePress = () => {
    if (!user) {
      onSecretPress();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{backgroundColor: '#003058'}}>
      <Pressable onPress={handlePress}>
        <View style={styles.header}>
          <Image source={require("@/assets/images/ut-header-full-color.png")} style={[styles.utLogo,{maxWidth: width * 0.3}]} />
          <Image source={require("@/assets/images/d3-logo.png")} style={[styles.eventLogo, {maxWidth: width * 0.55}]} />
        </View>
      </Pressable>
    </SafeAreaView>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0", 
    // paddingTop: 20,
  },
  utLogo: {
    height: 35,
    // marginRight: 80,
    resizeMode: "contain",
  },
  eventLogo: {
    width: "55%",
    height: 70,
    resizeMode: "contain",
  },
});
