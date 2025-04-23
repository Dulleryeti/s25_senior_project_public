import React from "react";
import { View, TextInput, StyleSheet, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";


const SearchHeader = ({ search, setSearch }) => {
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView edges={['top']}>
      <View style={[styles.wrapper, { paddingHorizontal: width * 0.04 }]}>
        <View style={styles.headerContainer}>
          <MaterialIcons name="search" size={24} color="#333" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search for events..."
            value={search}
            onChangeText={setSearch}
            style={styles.input}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SearchHeader;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#003058",
    paddingBottom: 11,
    // paddingTop: 34,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAEAEA",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    // color: "#000",
    fontSize: 16,
  },
});
