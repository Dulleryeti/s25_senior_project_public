import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";

const EventCard = ({ event, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={event.image} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{event.name}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{event.eventType}</Text>
          </View>
        </View>
        <Text style={styles.details}>{event.location}{" • "}{event.time}</Text>

        <Text style={styles.teams}>
          {event.eventType === "Activity" 
            ? `${event.teamCount} total teams organized by students` 
            : event.eventType === "Show"
            ? `Scheduled show for ${event.duration} minutes`
            : "Interactive exhibit"
          }
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(EventCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: "column",
    backgroundColor: "#fff",
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { height: 2, width: 0 },
    padding: 4,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  info: {
    paddingTop: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    justifyContent: "space-between"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
    marginRight: 8,
    marginBottom: Platform.OS === "ios" ? 2 : 0

  },
  typeBadge: {
    backgroundColor: "#ba1c21",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    
  },
  typeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",

  },
  details: {
    fontSize: 14,
    color: "#BA1C21",
    fontWeight: "bold",
    marginTop: 2,
    marginBottom: Platform.OS === "ios" ? 2 : 0
    
  },
  teams: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
});
