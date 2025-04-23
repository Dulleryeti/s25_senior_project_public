import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, Dimensions, PanResponder, KeyboardAvoidingView, Platform, Keyboard, ScrollView, Alert } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import EventCard from "@/components/EventCard";
import { MaterialIcons } from "@expo/vector-icons";
import UTMap from "@/components/Utmap";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchHeader from "@/components/SearchHeader";


const API_URL = "https://utdesignday.onrender.com";

const { width, height } = Dimensions.get("window");

const ExploreScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const [mapHeight, setMapHeight] = useState(height * 0.4); // Initial Map Height
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     header: () => (
  //       <SearchHeader search={search} setSearch={setSearch} />
  //     ),
  //   });
  // }, [navigation, search]);


  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      // Push map up when keyboard shows
      setMapHeight(height * 0.03); 
    });
  
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      // Reset when keyboard hides
      setMapHeight(height * 0.4);
    });
  
    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);


  // grab events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/events`);
        const data = await res.json();
        if (res.ok) {
          const sorted = data.events.sort((a, b) => a.name.localeCompare(b.name));
          setEvents(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);
  
  

  // Request and fetch user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Enable location services to see your location.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Dragging functionality for resizing map
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2, // Prevent accidental drags
    onPanResponderGrant: () => setIsDragging(true), // Start dragging
    onPanResponderMove: (_, gestureState) => {
      if (Math.abs(gestureState.dy) > 4) { // Significant movement
        const newHeight = Math.min(Math.max(0, mapHeight + gestureState.dy), height * 0.75);
        setMapHeight(newHeight);
      }
    },
    // onPanResponderRelease: (_, gestureState) => {
    //   setIsDragging(false); // Dragging stops
    //   if (Math.abs(gestureState.dy) <= 4) {
    //     // If not dragged much, trigger keyboard
    //     Keyboard.dismiss();
    //   }
    // },
  });

  const renderItem = useCallback(({ item }) => (
    <EventCard
      event={{
        id: item._id,
        name: item.name,
        location: item.location,
        eventType: item.eventType,
        time: item.eventType === "Show"
          ? `${item.startTime}`
          : `${item.startTime} - ${item.endTime}`,
        image: { uri: item.image },
        teamCount: item.eventType === "Activity" && item.teams ? item.teams.length : 0,
        duration: item.duration
      }}
      onPress={() =>
        router.push({
          pathname: "(events)/eventDetailView",
          params: { eventId: item._id, eventName: item.name, source: "internal" },
        })
      }
    />
  ), [router]);

  // filter events based on search input
  const filteredEvents = events.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );
  
  return (


    <SafeAreaView style={styles.container} edges={['bottom']}> 
     {/* <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled"> */}
        {/* Map Section */}
        <View style={{ backgroundColor: "#003058" }}>
          <SearchHeader search={search} setSearch={setSearch} />
        </View>

        <View style={[styles.mapContainer, { height: mapHeight }]}>
          <UTMap userLocation={userLocation}/> 
        </View>

        {/* Search Bar Section */}
        <View style={styles.searchContainer}  {...panResponder.panHandlers} >
          <View style={styles.dragHandle} />
          
        </View>

        {/* Events List Section */}
        <Text style={styles.sectionTitle}>Happening at Utah Tech</Text>
        {loading ? (
          <Text style={{ textAlign: "center", color: "#003058" }}>Loading events...</Text>
        ) : filteredEvents.length === 0 ?(
          <Text style={{ textAlign: "center", marginTop: 10, color: "#999" }}>
            {search.length > 0
              ? "No events matched your search. 😢"
              : "No events have been added yet. 😢"}
          </Text>
        ) : (
          <FlatList
            data={filteredEvents}
            // renderItem={({ item }) => (
              
            // )}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.eventsList}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={10}
          />
        )}

      {/* </ScrollView> */}
    </SafeAreaView>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  mapContainer: {
    width: "100%",
    backgroundColor: "#ccc",
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  eventsContainer: {
    backgroundColor: "#EAEAEA",
    width: "100%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 10,
    marginTop: -10, 
  },
  dragHandle: {
    width: 60,
    height: 6,
    backgroundColor: "#A5A5A5",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 8,
  },
  
  searchContainer: {
    backgroundColor: "#EAEAEA",
    width: "100%",
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 15,
    position: "relative", 
  },
  dragHandle: {
    position: "absolute",
    top: 8,
    left: "52.5%",
    width: 60,
    height: 6,
    backgroundColor: "#A5A5A5",
    borderRadius: 3,
    transform: [{ translateX: -30 }],
    alignSelf: "center",

  },
  searchInput: {
    flex: 1,
    paddingLeft: 10,
    fontSize: 16,
  },
  sectionTitle: { 
    fontSize: 32, 
    // fontWeight: "bold", 
    marginVertical: 10, 
    marginLeft: 14, 
    color: "#003058",
    fontFamily: "BisonBold" 
  },  
  eventsList: {
    paddingHorizontal: 10,
  },
});
