import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

const EventLayout = () => {
  const { eventName, teamName, eventId, teamId } = useLocalSearchParams();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#003058" },
        headerTintColor: "#FFFFFF",

      }}
    >
      <Stack.Screen
        name="eventDetailView"
        options={{ 
          title: eventName || "Event Details",
          headerBackVisible: true, 

         }}

      />
      <Stack.Screen
        name="teamDetailView"
        options={{ 
          title: teamName || "Team Details", 

          headerBackVisible: true, 

        }}
      />
      <Stack.Screen
        name="addEventScreen"
        options={{
          title: eventId ? "Edit Event" : "Add New Event",
          headerBackVisible: true,

        }}
      />
      <Stack.Screen
        name="addTeamScreen"
        options={{
          title: teamId ? "Edit Team" : "Add New Team",
          headerBackVisible: true, 

        }}
      />
    </Stack>
  );
};

export default EventLayout;


