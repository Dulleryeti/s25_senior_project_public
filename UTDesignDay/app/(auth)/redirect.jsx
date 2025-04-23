// import React, { useRef } from "react";
// import { View, ActivityIndicator, Platform } from "react-native";
// import { WebView } from "react-native-webview";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useAuth } from "@/context/authContext";
// import Toast from "react-native-toast-message";

// const API_URL = "https://utdesignday.onrender.com";


// const RedirectResolverScreen = () => {
//   const { url } = useLocalSearchParams();
//   const router = useRouter();
//   const webviewRef = useRef(null);
//   const { guestId } = useAuth();


//   const handleNavigationStateChange = async (navState) => {git
//     const { url: newUrl } = navState;
  
//     if (newUrl?.startsWith("utdesignday://event/")) {
//       const eventId = newUrl.split("utdesignday://event/")[1];
  
//       // log scan manually if coming from WebView
//       try {
//         const res = await fetch(`${API_URL}/guests/${guestId}/scans`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ eventId }),
//         });
  
//         const result = await res.json();
  
//         if (res.ok) {
//           Toast.show({
//             type: "success",
//             text1: "Scan Successful ✅",
//             text2: "You've successfully scanned this event!",
//           });
//         } else if (res.status === 400) {
//           Toast.show({
//             type: "info",
//             text1: "Already Scanned ⚠️",
//             text2: result.message || "This event has already been scanned.",
//           });
//         } else {
//           throw new Error(result.message);
//         }
//       } catch (err) {
//         Toast.show({
//           type: "error",
//           text1: "Scan Failed ❌",
//           text2: "Could not log the scan.",
//         });
//       }
  
//       router.replace({
//         pathname: "/(events)/eventDetailView",
//         params: { eventId, source: "external" }, 
//       });
//     }
//   };
  

//   return (
//     <View style={{ flex: 1 }}>
//       <WebView
//         ref={webviewRef}
//         source={{ uri: url }}
//         onNavigationStateChange={handleNavigationStateChange}
//         startInLoadingState
//         renderLoading={() => (
//           <ActivityIndicator
//             style={{ flex: 1, justifyContent: "center" }}
//             size="large"
//             color="#003058"
//           />
//         )}
//       />
//     </View>
//   );
// };

// export default RedirectResolverScreen;
