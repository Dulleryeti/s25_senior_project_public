import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const API_URL = "https://utdesignday.onrender.com";

const FeaturedEvents = () => {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/events/random?count=6`);
        const data = await res.json();
        if (res.ok) setEvents(data.events);
      } catch (err) {
        console.error("Failed to fetch featured events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push({ pathname: "(events)/eventDetailView", params: { eventId: item._id, eventName: item.name, source: "internal" }} )}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.text}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#003058" />;
  }

  if (events.length === 0) {
    return (
      <View style={{ padding: 4 }}>
        <Text style={styles.title}>Featured Events</Text>
        <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
          No featured events have been added yet. 😢
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Featured Events</Text>
        <TouchableOpacity onPress={() => router.push("/explore")}>
          <Text style={styles.viewAll}>/View all events</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContainer}
      />
    </View>
  );
};

export default FeaturedEvents;


const styles = StyleSheet.create({
  container: {
    marginTop: 0,

  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    // fontWeight: "bold",
    color: "#003058",
    fontFamily: "BisonBold",
  },
  viewAll: {
    fontSize: 12,
    color: "#BA1C21",
    fontWeight: "bold",
  },
  flatListContainer: {
    paddingHorizontal: 4,
  },
  card: {
    width: width * 0.7,
    marginRight: 15,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 5,
    borderRadius: 5,
  },
});

