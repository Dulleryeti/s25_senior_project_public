import React, { useState } from "react";
import { TextInput, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";

const FormFields = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  multiline = false,
  numberOfLines = 4,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputWrapper, multiline && styles.multilineWrapper, error && styles.inputError]}>
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor="#A5A5A5"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          textAlignVertical={multiline ? "top" : "center"}
        />

        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={24}
              color="#A5A5A5"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FormFields;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "300",
    color: "#000",
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
  },
  multilineWrapper: {
    alignItems: "flex-start",
    paddingTop: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: "#000",
  },
  inputError: {
    borderColor: "#BA1C21",
  },
  multilineInput: {
    minHeight: 100,
  },
  eyeIcon: {
    marginLeft: 8,
  },
  errorText: {
    color: "#BA1C21",
    fontSize: 12,
  },
});
