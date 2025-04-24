import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { useFocusEffect } from "@react-navigation/native";


export const useGuestVotes = () => {
  const { guestId } = useAuth();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    if (!guestId) return;
    try {
      const res = await fetch(`${API_URL}/guests/${guestId}/votes`);
      const data = await res.json();
      if (res.ok) {
        setVotes(data.votes);
      }
    } catch (error) {
      console.error("Failed to fetch guest votes", error);
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  return { votes, loading, fetchVotes };
};
