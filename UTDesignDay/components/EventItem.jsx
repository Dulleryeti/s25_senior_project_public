// this component is made for managing events for admins

import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";

const EventItem = ({ event, onEdit, onDelete, onTeamEdit, onTeamDelete }) => {
  return (
    <View style={styles.eventCard}>
      {event.image && <Image source={{ uri: event.image }} style={styles.eventImage} />}
      <View style={styles.eventRow}>
        <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={() => onEdit(event._id)}>
            <MaterialIcons name="edit" size={24} color="#003058" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(event._id)}>
            <MaterialIcons name="delete" size={24} color="#BA1C21" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.eventType}>Type: {event.eventType}</Text>

      {event.eventURL && (
        <View style={styles.urlContainer}>
          <Text style={styles.urlText} numberOfLines={1}>{event.eventURL}</Text>
          <TouchableOpacity onPress={() => {
            Clipboard.setStringAsync(event.eventURL);
            Toast.show({ type: "success", text1: "Copied!", text2: "Event link copied to clipboard" });
          }}>
            <MaterialIcons name="content-copy" size={20} color="#BA1C21" />
          </TouchableOpacity>
        </View>
      )}

      {event.eventType === "Activity" && event.teams?.length > 0 && (
        event.teams.map(team => (
          <View key={team._id} style={styles.teamCard}>
            <View style={styles.teamRow}>
              <Image source={{ uri: team.image }} style={styles.teamImage} />
              <Text style={styles.teamName}>{team.name}</Text>
              <View style={styles.iconRow}>
                <TouchableOpacity onPress={() => onTeamEdit(event._id, team._id)}>
                  <MaterialIcons name="edit" size={24} color="#003058" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onTeamDelete(event._id, team._id)}>
                  <MaterialIcons name="delete" size={24} color="#BA1C21" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  eventImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    // marginRight: 8
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003058",
    flex: 1,
    marginRight: 8,
  },
  iconRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  eventType: {
    color: "#555",
    marginBottom: 10,
  },
  teamCard: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#eee"
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginLeft: 10
  },
  urlContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderColor: "#ccc",
    borderWidth: 1,
    justifyContent: "space-between",
    marginBottom: 8
  },
  urlText: {
    flex: 1,
    color: "#003058",
    fontSize: 13,
    marginRight: 8,
  },
});

export default EventItem;
