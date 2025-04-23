import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Image, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfirmModal from "@/components/ConfirmModal";
import { useAuth } from "@/context/authContext";
import Toast from "react-native-toast-message";
import { useGuestVotes } from "@/hooks/useGuestVotes";
import UTMap from "@/components/UtmapAbbrev";

const API_URL = "https://utdesignday.onrender.com";

const TeamDetailView = () => {
  const { teamId, eventId } = useLocalSearchParams();
  const { user, guestId } = useAuth();
  const { votes, fetchVotes } = useGuestVotes();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [hasVotedForEvent, setHasVotedForEvent] = useState(false);
  const navigation = useNavigation();

  const getBuildingAbbrev = (location) => {
    if (!location) return null;
    return location.split(" ")[0].toUpperCase();
  };

  useEffect(() => {
    if (team?.name) {
      navigation.setOptions({ title: team.name });
    }
  }, [team]);

  // becasue iOS is dumb I have to create a custom back arrow ;(
  useEffect(() => {
    if (Platform.OS === "ios") {
      navigation.setOptions({
        // Disable default back arrow
        headerBackVisible: false,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation]);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/teams/${teamId}`);
        const data = await res.json();
        if (res.ok) {
          setTeam(data);
        }
      } catch (error) {
        console.error("Error fetching team details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamDetails();
  }, [teamId]);

  useEffect(() => {
    const voted = votes.some((v) => v.event._id === eventId)
    setHasVotedForEvent(voted);
  }, [votes, eventId]);

  const handleVote = async () => {
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
          eventId,
          teamId,
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
        setHasVotedForEvent(true)
      } else {
        Toast.show({
          type: "error",
          text1: "Vote Failed",
          text2: data.message,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#003058" />
      </SafeAreaView>
    );
  }

  if (!team) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Team not found</Text>
      </SafeAreaView>
    );
  }

  const buildingAbbrev = getBuildingAbbrev(team.location);

  // const hasVotedForEvent = votes.some((v) => v.event._id === eventId);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100, nestedScrollEnabled: true }}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: team.image }} style={styles.image} />
          <View style={styles.overlay} />
          <Text style={styles.teamName}>{team.name}</Text>
        </View>

        <View style={styles.locationRow}>
          <MaterialIcons name="place" size={28} color="#BA1C21" />
          <Text style={styles.location}>
            {team.location}{" "}
          </Text>
        </View>

        <View style={styles.timeRow}>
          <MaterialIcons name="schedule" size={28} color="black" />
          <Text style={styles.time}>
            {team.startTime} - {team.endTime}
          </Text>
        </View>

        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionTitle}>About This Team</Text>
          <Text style={styles.description}>{team.description}</Text>

          <Text style={styles.studentsTitle}>Designed By:</Text>
          {team.students.map((student, index) => (
            <View key={index} style={styles.studentRow}>
              <MaterialIcons name="person" size={20} color="#003058" />
              <Text style={styles.studentName}>{student}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Map Location</Text>
        <View style={styles.mapContainer}>
          <UTMap buildingAbbrev={buildingAbbrev}/>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Liked This Team?</Text>
        <TouchableOpacity
          style={[styles.voteButton, hasVotedForEvent && { backgroundColor: "#a5a5a5" }]}
          onPress={() => setConfirmModalVisible(true)}
          disabled={hasVotedForEvent}
        >
          <Text style={styles.voteText}>{hasVotedForEvent ? "VOTED" : "VOTE"}</Text>
        </TouchableOpacity>

      </View>

      <ConfirmModal
        visible={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onConfirm={() => {
          setConfirmModalVisible(false);
          handleVote();
        }}
        title="Vote Confirmation"
        message={`Are you sure you want to vote for "${team.name}"?`}
        warning="You can only vote one team per event."
      />
    </SafeAreaView>
  );
};

export default TeamDetailView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 250,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  teamName: {
    position: "absolute",
    bottom: 20,
    left: 10,
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 14,
    marginTop: 20,
    marginBottom: 10,

  },
  location: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#BA1C21",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 14,
    marginBottom: 10,
  },

  time: {
    fontSize: 16,
    color: "#000",
    marginLeft: 2,
  },
  
  descriptionBox: {
    backgroundColor: "#f0f0f0",
    padding: 18,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 20,
    marginHorizontal: 14,
  },
  descriptionTitle: {
    fontSize: 32,
    // fontWeight: "bold",
    color: "#003058",
    marginBottom: 10,
    fontFamily: "BisonBold",
  },
  description: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 24,
    marginBottom: 10,
  },
  studentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003058",
    marginTop: 10,
    marginBottom: 5,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 5,
  },
  studentName: {
    fontSize: 14,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 32,
    // fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 14,
    color: "#003058",
    fontFamily: "BisonBold",
  },
  mapContainer: {
    height: 400,
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 14,
    marginBottom: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#003058",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  voteButton: {
    backgroundColor: "#BA1C21",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  voteText: {
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});
