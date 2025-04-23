import { Tabs } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { Platform, View, StyleSheet, ActivityIndicator, TouchableOpacity} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/authContext";
import HapticTab from "@/components/HapticTab";
import HomeHeader from "@/components/HomeHeader";
import AuthModal from "@/components/AuthModal";
import { useRouter } from "expo-router";

export default function TabLayout() {
  const { user, isAdminMode } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // simulate loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  // show loading indicator because its cool
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#003058" />
      </View>
    );
  }

  return (
    <>
      <Tabs
        screenOptions={({  }) => ({
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#A5A5A5",
          headerShown: true,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: "#003058",
            borderTopWidth: 0,
            height: Platform.OS === "ios" ? 65: 60,
            
          },
        })}
      >
        {/* guest tabs  */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="home" color={color} />,
            href: isAdminMode ? null : "/",
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            headerShown: false,
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="explore" color={color} />,
            href: isAdminMode ? null : "/explore",
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: "Scan",
            headerTitle: "Scan QR Code",
            headerStyle: { backgroundColor: "#003058" },
            headerTintColor: "#FFFFFF",
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="qr-code-scanner" color={color} />,
            href: isAdminMode ? null : "/scan",
          }}
        />
        <Tabs.Screen
          name="track"
          options={{
            title: "Track",
            headerTitle: "Track Your Progress",
            headerStyle: { backgroundColor: "#003058" },
            headerTintColor: "#FFFFFF",
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="checklist" color={color} />,
            href: isAdminMode ? null : "/track",
          }}
        />

        {/* admin tabs should only show if they have admin access else they should see what guests see */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            headerStyle: { backgroundColor: "#003058" },
            headerTintColor: "#FFFFFF",
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="dashboard" color={color} />,
            href: isAdminMode ? "/dashboard" : null,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: "Events",
            headerShown: false,
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="event" color={color} />,
            href: isAdminMode ? "/events" : null,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: "Users",
            headerTitle: "Manage Users",
            headerStyle: { backgroundColor: "#003058" },
            headerTintColor: "#FFFFFF",
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="people" color={color} />,
            href: isAdminMode ? "/users" : null,
          }}
        />

        {/* profile should only be visible if a user is logged in */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerStyle: { backgroundColor: "#003058" },
            headerTintColor: "#FFFFFF",
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="account-circle" color={color} />,
            href: !isAdminMode && !user ? null : "/profile"
          }}
        />
      </Tabs>
      <AuthModal visible={modalVisible} onClose={() => setModalVisible(false)} />
  
    </>
  );
}

