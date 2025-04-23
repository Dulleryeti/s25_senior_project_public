import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/authContext";
import Toast from "react-native-toast-message";

const API_URL = "https://utdesignday.onrender.com";

export default function RedirectToEventDetail() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const { user, guestId } = useAuth();

  useEffect(() => {
    const logExternalScan = async () => {
      if (user || !eventId) return;

      try {
        const res = await fetch(`${API_URL}/guests/${guestId}/scans`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });

        if (res.ok) {
          console.log("External scan logged");
          Toast.show({
            type: "success",
            text1: "Scan Successful ✅",
            text2: "You've successfully scanned this event!",
          });
        } else if (res.status === 409) {
          const data = await res.json();
          Toast.show({
            type: "info",
            text1: "Already Scanned ⚠️",
            text2: data.message || "You've already scanned this event.",
          });
        } else {
          throw new Error("Unknown error logging external scan");
        }
      } catch (error) {
        console.error("Failed to log external scan:", error);
        Toast.show({
          type: "error",
          text1: "Scan Failed ❌",
          text2: "An error occurred while scanning.",
        });
      }

      router.replace({
        pathname: "/(events)/eventDetailView",
        params: { eventId, source: "external" },
      });
    };

    logExternalScan();
  }, [eventId, guestId]);

  return null;
}
