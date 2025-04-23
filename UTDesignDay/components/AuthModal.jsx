import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const AuthModal = ({ visible, onClose }) => {
  const router = useRouter();

  const handleLoginNavigation = () => {
    onClose();
    router.push("/(auth)/login");
  };

  const handleClose = () => {
    onClose();
    router.push("/");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Login Required</Text>
          <Text style={styles.modalText}>
            To access and view these features, please login.
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.button} onPress={handleClose}>
              <Text style={styles.cancelText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleLoginNavigation}>
              <Text style={styles.confirmText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AuthModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 32,
    // fontWeight: "bold",
    color: "#003058",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 5,
    width: "100%",
    textAlign: "center",
    fontFamily: "BisonBold",
  },
  modalText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginVertical: 5,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
  },
  button: {
    flex: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    color: "#555",
  },
  confirmText: {
    fontSize: 16,
    color: "#BA1C21",
    fontWeight: "bold",
  },
});
