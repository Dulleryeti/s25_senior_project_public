import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import AuthHeader from "@/components/AuthHeader";
import FormFields from "@/components/FormFields";
import AuthButton from "@/components/AuthButton";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/authContext";
import Toast from "react-native-toast-message"
import { SafeAreaView } from "react-native-safe-area-context";


const RegisterScreen = () => {
  const router = useRouter();
  const { register } = useAuth(); // Use register function from AuthContext
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});


  const handleRegister = async () => {
    const newErrors = {};
  
    if (!name) {
      newErrors.name = "Name is required.";
    }
  
    if (!email) {
      newErrors.email = "Email is required.";
    } else {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        newErrors.email = "Email is invalid.";
      }
    }
  
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
  
    setErrors(newErrors);
  
    if (Object.keys(newErrors).length > 0) return;
  
    const result = await register(name, email, password);
  
    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Success 🎉",
        text2: "User successfully registered an account!",
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Register Failed ❌",
        text2: result.message,
      });
    }
  };
  
  

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <AuthHeader />
        <View style={styles.form}>
          <Text style={styles.welcomeText}>Welcome!</Text>
          
          <Text style={styles.authText}>Register</Text>
          <FormFields label="First Name" placeholder="Henry" value={name} onChangeText={setName} error={errors.name} />
          <FormFields label="Email" placeholder="example@gmail.com" value={email} onChangeText={setEmail} error={errors.email} />
          <FormFields label="Password" placeholder="Type your password" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
          <AuthButton title="Register" onPress={handleRegister} />
          <Text style={styles.orText}>OR</Text>

          <AuthButton title="Continue As Guest" color="#BA1C21" onPress={() => router.replace('/')} />

          <Text style={styles.switchText}>
            Already Have An Account?{" "}
            <Text style={styles.switchLink} onPress={() => router.push("/(auth)/login")}>Sign In</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", 
  },
  contentContainer: {
    alignItems: "center", 
    justifyContent: "center", 
    flexGrow: 1, 
    // paddingVertical: 20, 
  },
  form: {
    width: "100%",
    padding: 20,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  authText: {
    fontSize: 64,
    fontFamily: "BisonBold",
    color: "#003058",
    marginBottom: 15,
  },
  orText: {
    textAlign: "center",
    fontSize: 14,
    marginVertical: 15,
    fontWeight: "bold",
    color: "#777",
  },
  switchText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },
  switchLink: {
    color: "#003058",
    fontWeight: "bold",
  },
});


export default RegisterScreen;
