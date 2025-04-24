import { io } from "socket.io-client";
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/authContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSocket } from "@/utils/socket"; 

const ManageUsersScreen = () => {
  const { authToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);


  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // for socket
  useEffect(() => {
    fetchUsers();
  
    const socket = getSocket();
    // const socket = io(SOCKET_URL);
  
    socket.on("connect", () => {
      console.log("Connected to WebSocket:", socket.id);
    });
  
    socket.on("userCreated", (newUser) => {
      console.log("New user registered");
      setUsers((prevUsers) => [...prevUsers, newUser]);
      setFilteredUsers((prevUsers) => [...prevUsers, newUser]);
    });
    
    socket.on("userRoleChanged", (updatedUser) => {
      console.log("User role changed");
  
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === updatedUser._id ? updatedUser : user
        )
      );
  
      setFilteredUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === updatedUser._id ? updatedUser : user
        )
      );

    
    });
  
    // socket.on("disconnect", () => {
    //   console.log("Disconnected from WebSocket");
    // });
  
    return () => {
      socket.off("userCreated");
      socket.off("userRoleChanged");
      // socket.disconnect();
    };
  }, []);
  

  // Open modal when a role is clicked
  const openRoleModal = (userId, currentRole) => {
    setSelectedUser(userId);
    setSelectedRole(currentRole);
    setModalVisible(true);
  };

  // Confirm Role Change
  const confirmRoleChange = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${selectedUser}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === selectedUser ? { ...user, role: selectedRole } : user
          )
        );
        setFilteredUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === selectedUser ? { ...user, role: selectedRole } : user
          )
        );
        setModalVisible(false); 
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  // Filter users based on search query
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.name.toLowerCase().includes(text.toLowerCase()) ||
        user.email.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  // Render each user row
  const renderUser = ({ item }) => (
    <View style={styles.userRow}>
      <View style={styles.userInfo}>
        <MaterialIcons name="person-outline" size={32} color="black" />
        <View>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">
            {item.email}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => openRoleModal(item._id, item.role)}>
        <View style={styles.roleBox}>
          <Text style={styles.roleText}>Role: {item.role}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
            
      <TextInput
        style={styles.searchBar}
        placeholder="Search for user..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#003058" />
      ) : filteredUsers.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 10, color: "#999" }}>
          {searchQuery.length > 0
            ? "No users matched your search. 😢"
            : "No users have been added yet. 😢"}
        </Text>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackground} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Role for {users.find(user => user._id === selectedUser)?.name}</Text>

              <Text style={styles.warningText}>
                Note: Changing this user's role will affect their permissions!
              </Text>

              {["user", "admin"].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.modalItem,
                    selectedRole === role && styles.selectedRole,
                  ]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={styles.modalItemText}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.confirmButton} onPress={confirmRoleChange}>
                <Text style={{ color: "white", fontWeight: "bold" }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageUsersScreen;

const styles = {
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "white",
  },

  searchBar: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 12,
    color: "gray",
  },
  roleBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  roleText: {
    fontSize: 14,
    marginRight: 5,
  },

  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)", 
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
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
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  modalItemText: {
    fontSize: 16,
    textAlign: "center",
  },
  selectedRole: {
    backgroundColor: "#ddd",
  },
  confirmButton: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#BA1C21",
    borderRadius: 10,
    alignItems: "center",
  },
  warningText: {
    fontSize: 14,
    color: "#BA1C21",
    textAlign: "center",
    marginBottom: 15,
  },
};
