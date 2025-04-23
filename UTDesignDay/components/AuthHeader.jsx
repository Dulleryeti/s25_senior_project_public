import { View, Image, StyleSheet } from "react-native";

const AuthHeader = () => {
  return (
    <View style={styles.header}>
      <Image source={require("@/assets/images/ut-white-logo.png")} style={styles.logo_top} />
      <Image source={require("@/assets/images/d3-logo.png")} style={styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: "100%",
    backgroundColor: "#003058", // Brooks Blue
    alignItems: "center",
    paddingVertical: 70,
  },

  logo_top: {
    width: '40%',
    height: 60,
    resizeMode: 'cover',
    
  },
  logo: {
    width: '95%',
    height: 100,
    
  },
});

export default AuthHeader;
