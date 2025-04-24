import { io } from "socket.io-client";
import React, { useState, useLayoutEffect, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Image,
  Linking,
  FlatList
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import ConfirmModal from "@/components/ConfirmModal"; 
import { SafeAreaView } from "react-native-safe-area-context";
import SearchHeader from "@/components/SearchHeader";
import { useAuth } from "@/context/authContext";
import * as Clipboard from "expo-clipboard";
import { getSocket } from "@/utils/socket";
import EventItem from "@/components/EventItem";


const ManageEventsScreen = () => {
  const {authToken} = useAuth();
  const [search, setSearch] = useState("");
  const navigation = useNavigation();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState("event");
  const [hasActivityEvents, setHasActivityEvents] = useState(true);
  const [events, setEvents] = useState([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: null, eventId: null, teamId: null });  



  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/events`);
      const data = await res.json();
      if (res.ok && data.events) {
        setEvents(data.events);
        const hasActivity = data.events.some(e => e.eventType === "Activity");
        setHasActivityEvents(hasActivity);
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
      setHasActivityEvents(false);
    }
  };

  // for socket
  useEffect(() => {
    fetchEvents();
  
    const socket = getSocket();
    // console.log("Socket connected:", socket.connected); // true or false

  
    socket.on("connect", () => {
      console.log("Connected to WebSocket:", socket.id);
    });
  
    socket.on("eventCreated", (event) => {
      console.log("New event created");
      setEvents((prev) => [...prev, event]);
    });
  
    socket.on("eventUpdated", (updatedEvent) => {
      console.log("event updated");
      setEvents((prev) =>
        prev.map((event) => event._id === updatedEvent._id ? updatedEvent : event)
      );
    });
  
    socket.on("eventDeleted", ({ eventId }) => {
      console.log("event deleted");
      setEvents((prev) => prev.filter((event) => event._id !== eventId));
    });

    socket.on("teamCreated", ({ team, eventId }) => {
      console.log("team created");
      setEvents((prev) =>
        prev.map((event) =>
          event._id === eventId ? { ...event, teams: [...event.teams, team] } : event
        )
      );
    });
    
    socket.on("teamUpdated", ({ team, eventId }) => {
      console.log("team updated");
      setEvents((prev) =>
        prev.map((event) =>
          event._id === eventId
            ? {
                ...event,
                teams: event.teams.map((t) => (t._id === team._id ? team : t)),
              }
            : event
        )
      );
    });
    
    socket.on("teamDeleted", ({ teamId, eventId }) => {
      console.log("team deleted");
      setEvents((prev) =>
        prev.map((event) =>
          event._id === eventId
            ? { ...event, teams: event.teams.filter((t) => t._id !== teamId) }
            : event
        )
      );
    });

    // socket.on("disconnect", () => {
    //   console.log("Disconnected from WebSocket");
    // });
    
    return () => {
      socket.off("eventCreated");
      socket.off("eventUpdated");
      socket.off("eventDeleted");
      socket.off("teamCreated");
      socket.off("teamUpdated");
      socket.off("teamDeleted");
      // socket.disconnect();
    };
  }, []);

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    setModalVisible(false);
    if (selectedOption === "event") {
      router.push("(events)/addEventScreen");
    } else if (selectedOption === "team") {
      router.push("(events)/addTeamScreen");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          // "Content-Type": "application/json",

        },
      });
      if (res.ok) {
        setEvents(events.filter(e => e._id !== eventId));
        Toast.show({
          type: "success",
          text1: "Success 🎉",
          text2: "Event deleted successfully",
        });
        // fetchEvents();
      }
    } catch (error) {
      console.error("Failed to delete event", error);
    }
  };

  const handleDeleteTeam = async (eventId, teamId) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/teams/${teamId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,

        },
      });
      if (res.ok) {
        setEvents(prev => prev.map(e => e._id === eventId ? { ...e, teams: e.teams.filter(t => t._id !== teamId) } : e));
        Toast.show({
          type: "success",
          text1: "Success 🎉",
          text2: "Team deleted successfully",
        });
        // fetchEvents();
      }
    } catch (error) {
      console.error("Failed to delete team", error);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}} edges={['bottom']}>
      <View style={{ backgroundColor: "#003058" }}>
        <SearchHeader search={search} setSearch={setSearch} />
      </View>

      <View style={styles.container}>

        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Manage Events</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <MaterialIcons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.qrNote}>
          Generate a QR for an event by copying the url and go to{" "}
          <Text
            style={styles.qrLink}
            onPress={() => {
              Linking.openURL("https://www.qr-code-generator.com/");
            }}
          >
            qr-code-generator.com
          </Text>
        </Text>

        {/* Managing Events Section with Teams */}
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 10}}
          renderItem={({ item }) => (
            <EventItem
              event={item}
              onEdit={(eventId) => router.push({ pathname: "(events)/addEventScreen", params: { eventId } })}
              onDelete={(eventId) => {
                setDeleteTarget({ type: "event", eventId });
                setConfirmModalVisible(true);
              }}
              onTeamEdit={(eventId, teamId) => router.push({ pathname: "(events)/addTeamScreen", params: { eventId, teamId } })}
              onTeamDelete={(eventId, teamId) => {
                setDeleteTarget({ type: "team", eventId, teamId });
                setConfirmModalVisible(true);
              }}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.noEventsText}>
              {search.length > 0 ? "No events matched your search. 😢" : "No events have been added yet. 😢"}
            </Text>
          }
        />
      </View>


      {/* add event/team modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.bottomSheet}>
            <Text style={styles.modalTitle}>Choose What to Add</Text>
            <Text style={styles.warningText}>Note: You must add an Event of type "activity" To add a Team!</Text>

            <TouchableOpacity style={styles.radioItem} onPress={() => setSelectedOption("event")}>
              <View style={styles.radioCircle}>{selectedOption === "event" && <View style={styles.radioDot} />}</View>
              <Text style={styles.radioText}>Add Event</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radioItem, !hasActivityEvents && { opacity: 0.5 }]}
              onPress={() => hasActivityEvents && setSelectedOption("team")}
              disabled={!hasActivityEvents}
            >
              <View style={styles.radioCircle}>{selectedOption === "team" && <View style={styles.radioDot} />}</View>
              <Text style={styles.radioText}>Add Team to Event</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.continueButton, selectedOption === "team" && !hasActivityEvents && { backgroundColor: "#ccc" }]}
              onPress={handleContinue}
              disabled={selectedOption === "team" && !hasActivityEvents}
            >
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* confirm modal */}

      <ConfirmModal
        visible={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onConfirm={() => {
          setConfirmModalVisible(false);
          if (deleteTarget.type === "event") {
            handleDeleteEvent(deleteTarget.eventId);
          } else {
            handleDeleteTeam(deleteTarget.eventId, deleteTarget.teamId);
          }
        }}
        title={'Confirm Delete'}
        message={`Are you sure you want to delete this ${deleteTarget.type}?`}
        warning={deleteTarget.type === "event" ? "This will remove all associated teams." : "This action cannot be undone."}
      />


    </SafeAreaView>

    
  );
};

export default ManageEventsScreen;

const styles = StyleSheet.create({
  noEventsText: {
    fontSize: 16,
    color: "#ba1c21",
    textAlign: "center",
    paddingHorizontal: 20,
    marginTop: 150
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 32,
    // fontWeight: "bold",
    color: "#003058",
    marginLeft: 4,
    fontFamily: "BisonBold"
  },
  addButton: {
    backgroundColor: "#ba1c21",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  
  
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 25,
  },
  modalTitle: {
    fontSize: 32,
    // fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#003058",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 5,
    fontFamily: "BisonBold",
  },
  warningText: {
    fontSize: 14,
    color: "#BA1C21",
    textAlign: "center",
    marginBottom: 15,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#003058",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#003058",
  },
  radioText: {
    fontSize: 16,
    color: "#333",
  },
  continueButton: {
    backgroundColor: "#ba1c21",
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
    alignItems: "center",
  },
  continueText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
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
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003058",
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
    gap: 10,
    justifyContent: "space-between"
  },
  teamImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#eee"
  },
  imagePlaceholder: {
    backgroundColor: "#ccc"
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1
  },
  iconRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },

  urlWrapper: {
    marginBottom: 12,
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
  },
  urlText: {
    flex: 1,
    color: "#003058",
    fontSize: 13,
    marginRight: 8,
  },

  qrNote: {
    fontSize: 13,
    color: "black",
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  
  qrLink: {
    color: "#BA1C21",
    textDecorationLine: "underline",
  },
  
});
