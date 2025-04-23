import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView,
  Pressable
} from "react-native";
import { Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/authContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { io } from "socket.io-client";
import { PieChart } from 'react-native-gifted-charts';
import {getSocket} from "@/utils/socket"; 
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { AppState } from "react-native";


const screenWidth = Dimensions.get("window").width;
const API_URL = "https://utdesignday.onrender.com";
const SOCKET_URL = "wss://utdesignday.onrender.com";

// const mockScanData = Array.from({ length: 30 }, (_, i) => ({
//   event: `Miniatronic`,
//   scanCount: Math.floor(Math.random() * 100),
// }));


const AdminDashboardScreen = () => {
  const { authToken, user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [votesData, setVotesData] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [scanData, setScanData] = useState([]);
  const [totalScans, setTotalScans] = useState(0);
  const [eventVotes, setEventVotes] = useState(0);

  

  useFocusEffect(
    useCallback(() => {
      // re-fetch latest totals whenever screen comes into focus
      fetchTotalVotesAcrossAllEvents();
      fetchScanCounts();
    }, [])
  );

  useEffect(() => {
    fetchEvents();
    fetchScanCounts();
    fetchTotalVotesAcrossAllEvents();
    // grab real-time updates from socket 
    // const socket = io(SOCKET_URL);
    const socket = getSocket();

    // console.log("Socket connected:", socket.connected); 

    socket.on("connect", () => {
      console.log("Connected to WebSocket:", socket.id);
    });
    

    socket.on("guestVoted", () => {
      if (selectedEvent) fetchVotesForEvent(selectedEvent._id);
      fetchTotalVotesAcrossAllEvents();
    });

    socket.on("guestScanned", fetchScanCounts);

    // socket.on("disconnect", () => {
    //   console.log("Disconnected from WebSocket");
    // });

    return () => {
      socket.off("guestVoted");
      socket.off("guestScanned");
      
      // socket.disconnect();
    }
  }, [selectedEvent]);


  // if app is backgrounded and comes back to foreground, re-fetch data
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchScanCounts();
        fetchTotalVotesAcrossAllEvents();
        if (selectedEvent) fetchVotesForEvent(selectedEvent._id);
      }
    });
  
    return () => {
      subscription.remove(); 
    };
  }, [selectedEvent]);
  

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/events`, {
        // headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      setEvents(data.events);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const fetchTotalVotesAcrossAllEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/admins/votes/total`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setTotalVotes(data.totalVotes);
    } catch (err) {
      console.error("Failed to fetch total votes:", err);
    }
  };

  const fetchVotesForEvent = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/admins/events/${eventId}/votes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      const colors = [
        "#845EC2", "#D65DB1", "#FF6F91", "#FF9671", "#FFC75F", "#F9F871", "#BA1C21",
        "#00C9A7", "#2C73D2", "#0081CF", "#008E9B", "#4D8076", "#B0A8B9", "#C34A36",
        "#FF8066", "#B39CD0", "#A0E7E5", "#B5EAD7", "#FFDAC1", "#FFAAA5", "#FFD700"
      ];
      
      setVotesData(
        data.teamVotes.map((team, i) => ({
          name: team.team,
          votes: team.voteCount,
          color: colors[i % colors.length],
        }))
      );
      setEventVotes(data.totalVotes);
    } catch (err) {
      console.error("Failed to fetch vote counts:", err);
    }
  };

  const fetchScanCounts = async () => {
    try {
      const res = await fetch(`${API_URL}/admins/events/scans`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();

      // change it to where it sorts events by scan count in ascenindg order rather than random
      const sortedScanData = data.eventScans.sort((a, b) => b.scanCount - a.scanCount);
      
      setScanData(sortedScanData);
      setTotalScans(data.totalScans);
    } catch (err) {
      console.error("Failed to fetch scan counts:", err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        <Text style={styles.greeting}>Hello, {user?.name || "Admin"}!</Text>
        <Text style={styles.sectionTitle}>Analytics</Text>

        <View style={styles.analyticsContainer}>
          <View style={styles.analyticsCard}>
            <MaterialIcons name="thumb-up" size={32} color="#003058" />
            <Text style={styles.analyticsNumber}>{totalVotes}</Text>
            <Text style={styles.analyticsLabel}>Total Votes</Text>
          </View>
          <View style={styles.analyticsCard}>
            <MaterialIcons name="qr-code-scanner" size={32} color="#003058" />
            <Text style={styles.analyticsNumber}>{totalScans}</Text>
            <Text style={styles.analyticsLabel}>Events Scanned</Text>
          </View>
        </View>

        {/* select event modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalBackground} onPress={() => setModalVisible(false)}>
            <View style={styles.bottomSheetContainer}>
              <Text style={styles.modalTitle}>Select an Event</Text>

              <FlatList
                data={events.filter((e) => e.eventType === "Activity")}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedEvent?._id === item._id && styles.selectedModalItem
                  ]}                    
                  onPress={() => {
                      setSelectedEvent(item);
                      setModalVisible(false);
                      fetchVotesForEvent(item._id);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </Pressable>
        </Modal>


        <View style={styles.rowContainer}>
          <Text style={styles.sectionTitle}>Team Votes</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.dropdownText}>{selectedEvent?.name || "Select Event"}</Text>
          </TouchableOpacity>
        </View>

        {!selectedEvent ? (
          <Text style={{ color: "#999", marginBottom: 20 }}>Please select an event to view votes.</Text>
        ) : votesData.length === 0 ? (
          <Text style={{ color: "#999", marginBottom: 20 }}>No one has voted for {selectedEvent?.name} yet.</Text>
        ) : (
          <>
            <View style={styles.votesCard}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#ba1c21' }}>
                {selectedEvent?.name || 'Votes'}
              </Text>

              <PieChart
                data={votesData.map(team => ({
                  value: team.votes,
                  color: team.color,
                  text: '',
                }))}
                showText={false}
                innerRadius={70}
                radius={100}
                strokeWidth={0}
                donut
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#003058' }}>
                      {eventVotes}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#7F7F7F' }}>
                      Votes
                    </Text>
                  </View>
                )}
              />

              {/* show all teams votes below the chart for user experience */}
              <View style={{ marginTop: 20 }}>
                {votesData.map((item, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <View style={{ width: 10, height: 10, backgroundColor: item.color, marginRight: 8, borderRadius: 5 }} />
                    <Text style={{ color: '#003058' }}>{item.name}: {item.votes}</Text>
                  </View>
                ))}
              </View>
            </View>

          </>
        )}

        <Text style={styles.sectionTitle}>Event Participation</Text>
        {scanData.length === 0 ? (
          <Text style={{ color: "#999" }}>No events have been scanned yet.</Text>
        ) : (
          <View style={styles.chartCard}>
            <View>
              {scanData.map((item, index) => (
                <View key={index} style={styles.scanRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.eventName} numberOfLines={2} ellipsizeMode="tail">{item.event}</Text>
                  </View>
                  
                
                  <Text style={styles.scanCount}>{item.scanCount} scans</Text>
                </View>
              ))}
            </View>
          </View>

        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboardScreen;

const styles = StyleSheet.create({
  greeting: { 
    fontSize: 14, 
    color: "#757575", 
  },
  sectionTitle: { 
    fontSize: 32, 
    // fontWeight: "bold", 
    color: "#003058", 
    marginBottom: 15, 
    fontFamily: "BisonBold"
  },
  analyticsContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 20 
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: "#F0F4F8",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  analyticsNumber: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginTop: 5 
  },
  analyticsLabel: {
    fontSize: 14,
    color: "#7F7F7F" 
  },
  dropdownButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
    backgroundColor: "#F9F9F9",
    marginBottom: 10
  },
  dropdownText: {
    fontSize: 14 
  },
  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomSheetContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    maxHeight: "60%",
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
  modalItem: {
    padding: 15,
   
  },
  modalItemText: {
    fontSize: 16,
    textAlign: "center",
  },

  selectedModalItem: {
    backgroundColor: "#ddd", 
  },
  
  
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  votesCard: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center', 
  },

  chartCard: { 
    backgroundColor: '#F0F0F0', 
    borderRadius: 16, 
    padding: 20,
    marginBottom: 30 
  },

  scanRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderColor: '#ddd' ,
    alignItems: 'flex-start', 

  },
  eventName: { 
    color: '#ba1c21', 
    flex: 1, 
    flexWrap: 'wrap', 
    fontWeight: 'bold',
    fontSize: 18,
  },
  scanCount: { 
    fontWeight: 'bold', 
    color: '#003058' 
  },
  
});
