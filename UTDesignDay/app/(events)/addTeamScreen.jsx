import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import FormFields from "@/components/FormFields";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/authContext";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";



const AddTeamScreen = () => {
  const router = useRouter();
  const { authToken } = useAuth();
  const { teamId, eventId } = useLocalSearchParams();
  const isEditing = !!teamId;

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [image, setImage] = useState(null);
  const [students, setStudents] = useState([""]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const navigation = useNavigation();

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
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/events`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.events) {
          const activitiesOnly = data.events.filter((e) => e.eventType === "Activity");
          setEventsList(activitiesOnly);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };

    const fetchTeamDetails = async () => {
      if (!teamId || !eventId) return;
      try {
        const res = await fetch(`${API_URL}/events/${eventId}/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (res.ok && data) {
          setName(data.name);
          setLocation(data.location);
          setDescription(data.description);
          setStartTime(data.startTime);
          setEndTime(data.endTime);
          setImage(data.image);
          setStudents(data.students || []);
          setSelectedEvent(data.event);
        }
      } catch (err) {
        console.error("Failed to fetch team details:", err);
      }
    };

    fetchEvents();
    fetchTeamDetails();
  }, []);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleAddStudent = () => setStudents([...students, ""]);

  const handleStudentChange = (text, index) => {
    const updated = [...students];
    updated[index] = text;
    setStudents(updated);
  };

  const handleRemoveStudent = (index) => {
    const updated = students.filter((_, i) => i !== index);
    setStudents(updated);
  };

  const handleSubmit = async () => {
    if (!name || !location || !startTime || !endTime || !description || !image || !selectedEvent || students.filter((s) => s.trim() !== "").length === 0) {
      Toast.show({ 
        type: "error", 
        text1: "Creating Team Failed ❌",
        text2: "Please fill out all fields." 
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("location", location.trim());
    formData.append("startTime", startTime.trim());
    formData.append("endTime", endTime.trim());
    formData.append("description", description.trim());
    formData.append("students", JSON.stringify(students.filter((s) => s.trim() !== "")));

    if (image && !image.startsWith("http")) {
      const filename = image.split("/").pop();
      const fileType = filename.split(".").pop();
      formData.append("image", {
        uri: image,
        name: filename,
        type: `image/${fileType}`,
      });
    } else {
      formData.append("image", image);
    }

    const endpoint = isEditing
      ? `${API_URL}/events/${selectedEvent}/teams/${teamId}`
      : `${API_URL}/events/${selectedEvent}/teams`;

    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (res.ok) {
        Toast.show({ type: "success", text1: "Success 🎉", text2: isEditing ? "Team updated successfully!" : "Team created successfully!" });
        router.replace("/(tabs)/events");
      } else {
        const data = await res.json();
        Toast.show({ type: "error", text1: "Failed to submit team", text2: data?.error || "Something went wrong." });
      }
    } catch (err) {
      console.error("Error:", err);
      Toast.show({ type: "error", text1: "Failed to submit team.", text2: "Please try again later." });
    }
  };

  return (
    <SafeAreaView  style={{ flex: 1, backgroundColor: "#fff" }} edges={['bottom']}>

      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.uploadBox} onPress={handleImagePick}>
          {image ? (
            <Image source={{ uri: image }} style={styles.uploadedImage} />
          ) : (
            <>
              <MaterialIcons name="upload" size={28} color="#003058" />
              <Text style={{ color: "#003058", marginTop: 5 }}>Click to upload image</Text>
              <Text style={styles.imageNote}>JPG, PNG, HEIC, HEIF (10 MB max).</Text>
            </>
          )}
        </TouchableOpacity>

        <FormFields label="Team Name" placeholder="Enter team name" value={name} onChangeText={setName} />
        <FormFields label="Location" placeholder="Enter location" value={location} onChangeText={setLocation} />
        <FormFields label="Start Time" placeholder="e.g. 10 AM" value={startTime} onChangeText={setStartTime} />
        <FormFields label="End Time" placeholder="e.g. 8 PM" value={endTime} onChangeText={setEndTime} />
        <FormFields label="Description" placeholder="Enter description" value={description} onChangeText={setDescription} multiline />

        {!isEditing && (
          <>
            <Text style={styles.subtitle}>Assign to Event</Text>
            <View style={styles.eventList}>
              {eventsList.map((event) => (
                <TouchableOpacity
                  key={event._id}
                  style={[styles.eventItem, selectedEvent === event._id && styles.activeEvent]}
                  onPress={() => setSelectedEvent(event._id)}
                >
                  <Text style={styles.eventText}>{event.name}</Text>
                  {selectedEvent === event._id && <MaterialIcons name="check-circle" size={20} color="#003058" />}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.subtitle}>Students</Text>
        {students.map((student, index) => (
          <View key={index} style={styles.studentRow}>
            <View style={{ flex: 1 }}>
              <FormFields
                label={`Student ${index + 1}`}
                placeholder="Enter student name"
                value={student}
                onChangeText={(text) => handleStudentChange(text, index)}
              />
            </View>
            {students.length > 1 && (
              <TouchableOpacity onPress={() => handleRemoveStudent(index)}>
                <MaterialIcons name="remove-circle" size={28} color="#BA1C21" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity onPress={handleAddStudent}>
          <Text style={styles.addStudentText}>+ Add Another Student</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>{isEditing ? "Update Team" : "Add Team"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003058",
    marginBottom: 20,
    textAlign: "center",
  },
  uploadBox: {
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ccc",
    borderStyle: "dashed",
    padding: 25,
    borderRadius: 10,
    marginBottom: 20,
  },
  uploadedImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    borderRadius: 10,
  },
  imageNote: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003058",
    marginVertical: 10,
  },
  eventList: {
    marginBottom: 15,
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  activeEvent: {
    borderColor: "#003058",
    backgroundColor: "#eef3f9",
  },
  eventText: {
    color: "#003058",
    fontWeight: "500",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addStudentText: {
    color: "#003058",
    fontWeight: "bold",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#BA1C21",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default AddTeamScreen;