import { View, Text, Image, TouchableOpacity, StyleSheet, Switch, FlatList, Alert, ScrollView } from "react-native";
import TeamCard from '@/components/TeamCard'
import React, {useState, useEffect, useCallback} from 'react'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from "@/context/authContext"; 
import { useRouter } from "expo-router";
import AuthModal from "@/components/AuthModal"; // Import the modal
import { useFocusEffect } from "@react-navigation/native"; 
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";


const ProfileScreen = () => {
  const router = useRouter();
  const { user, isAdmin, isAdminMode, setIsAdminMode, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  // instead of useEffect, useFocusEffect is used to run the callback when the screen is focused
  // useeffect only shows component once.
  // useFocusEffect(
  //   useCallback(() => {
  //     if (!user) {
  //       setModalVisible(true);
  //     }
  //   }, [user])
  // ); // Runs when `user` state changes

  const handleLogout = async () => {

    logout();
    Toast.show({
      type: "success",
      text1: "Success 🎉",
      text2: "User logged out successfully!",
    });
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://utahtech.edu/privacy-policy/'); // Utah Tech's privacy policy URL
  };

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
  };

  if (modalVisible) {
    return <AuthModal visible={modalVisible} onClose={() => router.replace("/(auth)/login")} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contenContainerStyle={{paddingBottom: 30}}>
        <View style={styles.profile}>
          <MaterialIcons name="account-circle" size={160} color="#003058" />
          <Text style={styles.name}>{user?.name || "Guest"}</Text>
          <Text style={styles.email}>{user?.email || "Not Logged In"}</Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>

        {isAdmin && (
          <>
            <Text style={styles.subtitle}>Admin Settings</Text>
            <View style={styles.adminContainer}>
              <Text style={styles.adminText}>{isAdminMode ? "Switch to User Mode" : "Switch to Admin Mode"}</Text>
              <Switch
                value={isAdminMode}
                onValueChange={toggleAdminMode}
                trackColor={{ false: "#A5A5A5", true: "#BA1C21" }}
                thumbColor={isAdmin ? "#FFF" : "#757575"}
                style={styles.switch}
              />
            </View>
          </>
        )}

        <Text style={styles.subtitle}>Account</Text>
        <View style={styles.adminContainer}>
          <Text style={styles.adminText}>Privacy Policy</Text>
          <TouchableOpacity onPress={openPrivacyPolicy}>
            <Text style={styles.viewText}>/View</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      
    </SafeAreaView>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 10,
    marginLeft: 4,
  },

  profile: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  
  name: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#003058",
  },
  email: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: "#BA1C21",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "40%",
    alignItems: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  adminContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#EAEAEA",
    marginBottom: 20,
  },
  adminText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
  },

  viewText: {
    color: "#BA1C21",
    fontWeight: "bold",

  },

  sectionTitle: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginVertical: 10, 
    marginLeft: 4, 
    color: "#003058" 
  },  

  switch: {
    transform: [{ scaleX: 1.25 }, { scaleY: 1.25 }], 
  },

  policyContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  
  policyText: {
    color: '#003058',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  
})