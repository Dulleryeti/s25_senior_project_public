import { StyleSheet, Text, View, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://utdesignday.onrender.com';

// helper function to convert time string to number for sorting purposes
const timeToNumber = (timeStr) => {
  // if an event has no end time do a fallback
  
  if (!timeStr) return 1439;
  const [_, hourStr, minStr, ampm] = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)/i) || [];
  let hour = parseInt(hourStr, 10);
  const minutes = parseInt(minStr || '0', 10);

  if (ampm?.toLowerCase() === 'pm' && hour !== 12) hour += 12;
  if (ampm?.toLowerCase() === 'am' && hour === 12) hour = 0;

  return hour * 60 + minutes;
};

const TrackScreen = () => {
  const { guestId } = useAuth();
  const [groupedEvents, setGroupedEvents] = useState([]);

  useEffect(() => {
    const fetchScanStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/guests/${guestId}/events-scans`);
        const data = await res.json();

        const grouped = {};

        data.events.forEach(event => {
          const timeKey = `${event.startTime} - ${event.endTime || ''}`;
          if (!grouped[timeKey]) {
            grouped[timeKey] = {
              startTime: event.startTime,
              endTime: event.endTime || '',
              locations: {},
            };
          }

          if (!grouped[timeKey].locations[event.location]) {
            grouped[timeKey].locations[event.location] = [];
          }

          grouped[timeKey].locations[event.location].push({
            id: event._id,
            name: event.name,
            scanned: event.scanned,
          });
        });

        // compare end times if start times are equal
        const sortedGroups = Object.values(grouped).sort((a, b) => {
          const startDiff = timeToNumber(a.startTime) - timeToNumber(b.startTime);
          if (startDiff !== 0) return startDiff;
        
          return timeToNumber(a.endTime) - timeToNumber(b.endTime);
        });
        

        setGroupedEvents(sortedGroups);
      } catch (err) {
        console.error('Failed to load scan data:', err);
      }
    };


    fetchScanStatus();
  }, [guestId]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>Scan a QR To Start Tracking!</Text>

      {/* should be displaying what events a guest has scanned so far */}
      <FlatList
        data={groupedEvents}
        keyExtractor={(item) => item.startTime + item.endTime}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No events have been added yet. 😢</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.timeText}>
                {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
              </Text>
            </View>

            {Object.entries(item.locations).map(([location, events]) => (
              <View key={location} style={{ marginTop: 10 }}>
                <Text style={styles.eventLocation}>{location}</Text>
                {events.map(event => (
                  <View key={event.id} style={styles.eventItem}>
                    <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: event.scanned ? '#4CAF50' : '#BA1C21' }
                    ]}>
                      <Text style={styles.statusText}>
                        {event.scanned ? 'Scanned' : 'Not Scanned'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default TrackScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 32,
    // fontWeight: 'bold',
    color: '#003058',
    marginVertical: 10,
    marginTop: 0,
    fontFamily: 'BisonBold',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 10,
    
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#BA1C21',
    textAlign: 'center',
    
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 2,
    gap: 6,
  },
  eventLocation: {
    fontSize: 16,
    color: '#003058',
    fontWeight: 'bold',

  },
  eventName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  }
  
});
