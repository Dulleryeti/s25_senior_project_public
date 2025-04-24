import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/authContext";
import Toast from "react-native-toast-message";

const ScanScreen = () => {
  const router = useRouter();
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState(null);
  const [cameraFacing, setCameraFacing] = useState("back");
  const { user, guestId } = useAuth();
  

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scannedData) return;
    setScannedData(data);
  
    console.log("Raw QR scanned data:", data);
  
    if (user) {
      Toast.show({
        type: "error",
        text1: "Scan Blocked 🚫",
        text2: "Only guests can scan events.",
      });
      setTimeout(() => setScannedData(null), 2000);
      return;
    }
  
    if (data.startsWith("utdesignday://event/")) {
      const eventId = data.split("utdesignday://event/")[1].trim();
      console.log("Extracted event ID:", eventId);
  
      try {
        const scanRes = await fetch(`${API_URL}/guests/${guestId}/scans`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventId }),
        });
  
        const result = await scanRes.json();
        console.log("API response:", result);
  
        if (scanRes.ok) {
          Toast.show({
            type: "success",
            text1: "Scan Successful ✅",
            text2: `You've successfully scanned this event!`,
          });
        } else if (scanRes.status === 409) {
          Toast.show({
            type: "info",
            text1: "Already Scanned ⚠️",
            text2: result.message || "This event has already been scanned.",
          });
        } else {
          throw new Error(result.message);
        }
  
        router.push({
          pathname: "/(events)/eventDetailView",
          params: { eventId, source: "internal" },
        });
      } catch (error) {
        console.error("❌ Scan API failed:", error);
        Toast.show({
          type: "error",
          text1: "Scan Failed ❌",
          text2: error.message || "An error occurred while scanning.",
        });
      }
    } else {
      console.warn("QR code does not use utdesignday:// scheme.");
      Toast.show({
        type: "error",
        text1: "Unsupported QR Code ❌",
        text2: "This QR code does not link to a valid event.",
      });
    }

    setTimeout(() => setScannedData(null), 2000);
  };

  // const handleBarCodeScanned = async ({ data }) => {
  //   if (scannedData) return;
  //   setScannedData(data);
  
  //   console.log("Raw QR scanned data:", data);
  
  //   if (user) {
  //     Toast.show({
  //       type: "error",
  //       text1: "Scan Blocked 🚫",
  //       text2: "Only guests can scan events.",
  //     });
  //     setTimeout(() => setScannedData(null), 2000);
  //     return;
  //   }
  
  //   if (data.startsWith("https://connect.utahtech.edu")) {
  //     if (Platform.OS === "ios") {
  //       // iOS uses WebView screen to follow redirect
  //       router.push({
  //         pathname: "/(auth)/redirect", 
  //         params: { url: data },
  //       });
  //     } else {
  //       // android uses fetch + header parsing
  //       try {
  //         const res = await fetch(data);
  //         const location = res.headers.get("location");
  
  //         if (location && location.startsWith("utdesignday://event/")) {
  //           const eventId = location.split("utdesignday://event/")[1];
  //           console.log("Extracted event ID:", eventId);
  
  //           const scanRes = await fetch(`${API_URL}/guests/${guestId}/scans`, {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //             },
  //             body: JSON.stringify({ eventId }),
  //           });
  
  //           const result = await scanRes.json();
  
  //           if (scanRes.ok) {
  //             Toast.show({
  //               type: "success",
  //               text1: "Scan Successful ✅",
  //               text2: "You've successfully scanned this event!",
  //             });
  //           } else if (scanRes.status === 400) {
  //             Toast.show({
  //               type: "info",
  //               text1: "Already Scanned ⚠️",
  //               text2: result.message || "This event has already been scanned.",
  //             });
  //           } else {
  //             throw new Error(result.message);
  //           }
  
  //           router.push({
  //             pathname: "/(events)/eventDetailView",
  //             params: { eventId, source: "internal" },
  //           });
  //         } else {
  //           Toast.show({
  //             type: "error",
  //             text1: "Unsupported QR Code ❌",
  //             text2: "This QR code does not link to a valid event.",
  //           });
  //         }
  //       } catch (error) {
  //         console.error("Redirect fetch failed:", error);
  //         Toast.show({
  //           type: "error",
  //           text1: "Scan Failed ❌",
  //           text2: "Could not resolve the QR code.",
  //         });
  //       }
  //     }
  
  //     setTimeout(() => setScannedData(null), 2000);
  //     return;
  //   }
  
  //   // fallback for non-recognized QR codes
  //   Toast.show({
  //     type: "error",
  //     text1: "Unsupported QR Code ❌",
  //     text2: "This QR code does not link to a valid event.",
  //   });
  
  //   setTimeout(() => setScannedData(null), 2000);
  // };
  
  

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!hasPermission.granted) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={cameraFacing}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
      >
        {/* overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
          <Text style={styles.scanText}>Scan QR Code</Text>
        </View>

        {/* flip camera, selfie :) */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() =>
              setCameraFacing(cameraFacing === "back" ? "front" : "back")
            }
          >
            <Text style={styles.flipText}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

export default ScanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  flipButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 12,
    borderRadius: 5,
  },
  flipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    borderRadius: 20,
    position: "relative",
  },
  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#fff",
    borderTopLeftRadius: 10,
  },
  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#fff",
    borderTopRightRadius: 10,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#fff",
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#fff",
    borderBottomRightRadius: 10,
  },
  scanText: {
    marginTop: 20,
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  permissionButton: {
    backgroundColor: "#003058",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
