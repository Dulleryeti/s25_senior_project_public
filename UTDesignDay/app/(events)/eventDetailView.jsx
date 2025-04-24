import { StyleSheet, Text, View, Image, ScrollView, ActivityIndicator, TouchableOpacity, Platform, FlatList } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import TeamCard from "@/components/TeamCard";
import { SafeAreaView } from "react-native-safe-area-context";
import {useAuth} from "@/context/authContext"
import Toast from "react-native-toast-message";
import { useGuestVotes } from "@/hooks/useGuestVotes";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import UTMap from "@/components/UtmapAbbrev";
import { useFocusEffect } from "@react-navigation/native";

const EventDetailView = () => {
  const { eventId, source } = useLocalSearchParams();
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, guestId } = useAuth();
  const { votes, fetchVotes } = useGuestVotes();
  const navigation = useNavigation();

  // get the building abbreviation from the location string
  const getBuildingAbbrev = (location) => {
    if (!location) return null;
    return location.split(" ")[0].toUpperCase();
  };
  


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
          eventId: event._id,
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
          text2: data.message,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };


  useFocusEffect(
    useCallback(() => {
      fetchVotes(); 
    }, [])
  );
  
  useEffect(() => {
    if (event?.name) {
      navigation.setOptions({ title: event.name });
    }
  }, [event]);

  // check if the guest scanned the QR code using their native camera
  useEffect(() => {
    console.log("EventDetailView source param:", source);
    if (source !== "internal" && source !== "external") {
      Toast.show({
        type: "info",
        text1: "Scan Not Counted ⚠️",
        text2: "Please use the in-app scanner!",
      });
    }
  }, [source]);

  // becasue iOS is dumb I have to create a custom back arrow ;(
  useEffect(() => {
    if (Platform.OS === "ios") {
      navigation.setOptions({
        // disable default back arrow to prevent double back arrow
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
    const fetchEventDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/events/${eventId}`);
        const data = await res.json();
        if (res.ok) {
          setEvent(data);
          if (data.eventType === "Activity") {
            setTeams(data.teams);
          }
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#003058" />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </SafeAreaView>
    );
  }

  const buildingAbbrev = getBuildingAbbrev(event.location);
  const voted = votes.find((v) => v.event._id === event._id);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: event.image }} style={styles.image} />
          <View style={styles.overlay} />
          <Text style={styles.eventName}>{event.name}</Text>

          {event.eventType === "Show" && event.duration && (
            <View style={styles.durationBox}>
              <Text style={styles.durationText}>Duration: {event.duration} minutes</Text>
            </View>
          )}
        </View>

        <View style={styles.locationRow}>
          <MaterialIcons name="place" size={28} color="#BA1C21" />
          <Text style={styles.location}>
            {event.location}{" "}
          </Text>
        </View>

        <View style={styles.timeRow}>
          <MaterialIcons name="schedule" size={28} color="black" />
          <Text style={styles.time}>
            {event.eventType === "Activity" || event.eventType === "Exhibit" 
              ? `${event.startTime} - ${event.endTime}`
              : `${event.startTime}`}
          </Text>
        </View>

        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionTitle}>About This Event</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* use flatlist for performance */}
        {event.eventType === "Activity" && (
          <>
            <Text style={styles.sectionTitle}>{event.name} Teams</Text>
            <View style={{ padding: 10, paddingTop: 0 }}>
              {teams.length === 0 ? (
                <Text style={{ textAlign: "center", color: "#999", marginTop: 10 }}>
                  No teams have been added to this event yet. 😢
                </Text>
              ) : (
                <FlatList
                  data={teams}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TeamCard
                      team={{
                        _id: item._id,
                        name: item.name,
                        event: event,
                        image: item.image,
                        location: item.location,
                        startTime: item.startTime,
                        endTime: item.endTime,
                      }}
                      hasVotedForEvent={!!voted}
                      onVote={handleGuestVote}
                    />
                  )}
                  scrollEnabled={false} // disables nested scrolling
                />
              )}
            </View>
          </>
        )}

        {/* only show the map location if its event type show or exhibit */}
        {(event.eventType === "Show" || event.eventType === "Exhibit") && (
          <>
            <Text style={styles.sectionTitle}>Map Location</Text>
            <View style={styles.mapContainer}>
              <UTMap buildingAbbrev={buildingAbbrev}/>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EventDetailView;


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

  eventName: {
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
  durationBox: {
    position: "absolute",
    bottom: 20,
    right: 10,
    backgroundColor: "#BA1C21",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  descriptionBox: {
    backgroundColor: "#f0f0f0",
    padding: 18,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 20,
    marginHorizontal: 14,
  },
  sectionTitle: { 
    fontSize: 32, 
    // fontWeight: "bold", 
    marginVertical: 10, 
    marginLeft: 14, 
    color: "#003058",
    fontFamily: "BisonBold"
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
    lineHeight: 25,
    marginBottom: 10
  },
  
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
  teamList: {
    padding: 10,
    paddingTop: 0,
  },
  mapContainer: {
    height: 400,
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 14,
    marginBottom: 20,
  },
});
