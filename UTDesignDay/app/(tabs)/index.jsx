import React, { useState, useLayoutEffect, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import FeaturedEvents from "@/components/FeaturedEvents";
import TeamCard from "@/components/TeamCard";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/authContext";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "@/components/HomeHeader";
import { useNavigation } from "expo-router";
import Toast from "react-native-toast-message";
import { useGuestVotes } from "@/hooks/useGuestVotes";
import * as Linking from "expo-linking";


const HomeScreen = ({}) => {
  const navigation = useNavigation();
  const { user, guestId } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [pressCount, setPressCount] = useState(0);
  const { votes, fetchVotes } = useGuestVotes(); 
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);


  const handleLogoPress = () => {
    setPressCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 7) {
        setModalVisible(true);
        return 0;
      }
      return newCount;
    });
  };


  useFocusEffect(
    useCallback(() => {
      fetchVotes(); 
    }, [])
  );
  
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <HomeHeader onSecretPress={handleLogoPress} />,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_URL}/teams/random?count=12`);
        const data = await res.json();
        if (res.ok) {
          setTeams(data.teams);
        }
      } catch (err) {
        console.error("Failed to fetch teams for you", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleGuestVote = async (team) => {
    if (user) {
      Toast.show({
        type: "error",
        text1: "Vote Failed",
        text2: "Only guests can vote.",
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/guests/${guestId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: team.event._id,
          teamId: team._id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Toast.show({
          type: "success",
          text1: "Vote Recorded ✅",
          text2: `Thanks for voting for ${team.name}!`,
        });
        await fetchVotes();
      } else {
        Toast.show({
          type: "error",
          text1: "Vote Failed",
          text2: data.message || "An error occurred!",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.greetingName}>Hello, {user ? user.name : "Guest"}!</Text>

      <FeaturedEvents />

      <Text style={styles.sectionTitle}>Teams For You</Text>


      {/* should I try and follow infinite scrolling? Pagination or no */}
      {loading ? (
        <ActivityIndicator size="large" color="#003058" />
      ) : teams.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#999", marginTop: 10 }}>
          No teams have been added yet. 😢
        </Text>
      ) : (
        <FlatList
          data={teams}
          renderItem={({ item }) => {
            const hasVotedForEvent = votes.some(
              (v) => v.event._id === item.event._id
            );
            return (
              <TeamCard
                team={{
                  _id: item._id,
                  name: item.name,
                  event: item.event || "No Event",
                  image: item.image || null,
                  location: item.location,
                  startTime: item.startTime,
                  endTime: item.endTime,
                }}
                hasVotedForEvent={hasVotedForEvent}
                onVote={handleGuestVote}
              />
            );
          }}
          keyExtractor={(item) => item._id}
        />
      )}

      {/* {!user && (
        <View style={{ alignItems: "center", paddingTop: 10 }}>
          <TouchableOpacity onPress={() => Linking.openURL("https://utahtech.edu/privacy-policy/")}>
            <Text style={styles.viewPolicyText}>
              View Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      )} */}

      <AuthModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  greetingName: {
    fontSize: 14,
    marginLeft: 4,
    color: "#757575",
  },
  sectionTitle: {
    fontSize: 32,
    // fontWeight: "bold",
    marginVertical: 10,
    marginLeft: 4,
    color: "#003058",
    fontFamily: "BisonBold"
  },

  viewPolicyText: {
    fontSize: 12,
    color: "#999",
  },
});

export default HomeScreen;
