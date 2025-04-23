import React, {useState, useEffect} from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons"; // Import star icon
import { useAuth } from "@/context/authContext"; 
import AuthModal from "@/components/AuthModal"; 
import ConfirmModal from "@/components/ConfirmModal";

const TeamCard = ({ team, hasVotedForEvent, onVote }) => {
  const router = useRouter();
  // const { user } = useAuth(); 
  // const [isFavorited, setIsFavorited] = useState(false);
  // const [modalVisible, setModalVisible] = useState(false); 
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);


  const handleVote = () => {
    if (hasVotedForEvent) return;
    setConfirmModalVisible(true);
  };

  // const handleFavorite = () => {
  //   if (!user) {
  //     setModalVisible(true);
  //   } else {
  //     setIsFavorited(!isFavorited); 
  //   }
  // };
  return (
    <>
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => router.push({ pathname: "(events)/teamDetailView", params: { teamId: team._id, eventId: team.event._id, teamName: team.name} })}
      >
        <Image source={{ uri: team.image }} style={styles.image} /> 

        <View style={styles.info}>
          <Text style={styles.details}>{team.location}{" • "}{team.startTime} - {team.endTime}</Text>
          <Text style={styles.title}>{team.name}</Text>
          <Text style={styles.subtitle}>From {team.event.name}</Text>

          <View style={styles.favoriteContainer}>
            <Text style={styles.likedText}>Liked this Team?</Text>
            {/* <TouchableOpacity onPress={handleFavorite}>
              <MaterialIcons
                name={isFavorited ? "star" : "star-border"}
                size={36}
                color={isFavorited ? "#003058" : "#000"} 
              />
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[styles.voteButton, hasVotedForEvent ? { backgroundColor: "#a5a5a5" } : {}]}
              onPress={handleVote}
              disabled={hasVotedForEvent}
            >
              <Text style={styles.voteText}>
                {hasVotedForEvent ? "VOTED" : "VOTE"}
              </Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </TouchableOpacity>

      {/* <AuthModal visible={modalVisible} onClose={() => setModalVisible(false)} /> */}
      <ConfirmModal
        visible={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onConfirm={() => {
          setConfirmModalVisible(false);
          // console.log(`Voted for ${team.name}`);

          onVote(team);
          // setHasVotedForEvent(true);
        }}
        title="Vote Confirmation"
        message={`Are you sure you want to vote for "${team.name}"?`}
        warning="You can only vote one team per event."
      />
    </>

  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 5,
    paddingTop: 0,
    paddingBottom: 15,
    marginVertical: 5,
    alignItems: "center",
  },
  image: {
    width: 120,
    height: 100,
    borderRadius: 5,
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  details: {
    fontSize: Platform.OS === "ios" ? 14 : 12,
    color: "#BA1C21",
    fontWeight: "bold",
    marginBottom: Platform.OS === "ios" ? 5 : 0
  },
  favoriteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  likedText: {
    fontSize: Platform.OS === "ios" ? 14 : 12,
    fontWeight: "bold",
    marginBottom: Platform.OS === "ios" ? 5 : 0
  },

  title: {
    fontSize: Platform.OS === "ios" ? 18 : 16,
    fontWeight: "bold",
    color: "black",
    marginBottom: Platform.OS === "ios" ? 5 : 0

  },
  subtitle: {
    fontSize: Platform.OS === "ios" ? 14 : 12,
    color: "#757575",
    marginBottom: Platform.OS === "ios" ? 5 : 0

  },
  voteButton: {
    backgroundColor: "#BA1C21",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: "flex-end",
  },
  voteText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default TeamCard;
