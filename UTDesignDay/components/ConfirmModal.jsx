import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const ConfirmModal = ({ visible, onCancel, onConfirm, title, message, warning }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>

          {warning && (
            <View style={styles.warningRow}>
              <MaterialIcons name="info" size={20} color="#BA1C21" style={styles.infoIcon} />
              <Text style={[styles.modalText, styles.warning]}>{warning}</Text>
            </View>
          )}

          <Text style={styles.modalText}>{message}</Text>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.cancelText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onConfirm}>
              <Text style={styles.confirmText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;

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
  warning: {
    fontWeight: "bold",
    color: "#BA1C21",
    flex: 1,
    textAlign: "left",
    fontSize: 12,

  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 5,
  },
  infoIcon: {
    marginRight: 4,
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
