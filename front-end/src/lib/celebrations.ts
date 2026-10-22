import { useAuth } from "../auth/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { CheckInUser } from "../checkin";
export type TimingStatus = "ON_TIME" | "LATE" | "UNKNOWN";
export type Recipient = { id: string; createdAt: string; giver: CheckInUser };
export type LeaderboardMember = CheckInUser & {
  id: string;
  totalSubmissions: number;
  onTimeSubmissions: number;
  rank: number;
  tied: boolean;
};
export type Dashboard = {
  kudosReceived: number;
  totalSubmissions: number;
  onTimeSubmissions: number;
  unknownTimingSubmissions: number;
  rank: number | null;
  tied: boolean;
  recentRecognition: Array<
    Recipient & { checkInId: string; checkIn: { createdAt: string } }
  >;
  recentCheckIns: Array<{
    id: string;
    createdAt: string;
    dueAt: string | null;
    timingStatus: TimingStatus;
  }>;
};
export function useKudosRecipients(id: string, opened: boolean) {
  return useQuery({
    queryKey: ["celebrations", "recipients", id],
    queryFn: () => api<Recipient[]>(`/checkins/${id}/kudos`),
    enabled: opened,
  });
}
export function useGiveKudos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/checkins/${id}/kudos`, { method: "POST" }),
    onSettled: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["checkins"] }),
        qc.invalidateQueries({ queryKey: ["celebrations"] }),
      ]);
    },
  });
}
export function useDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["celebrations", "dashboard", user?.id],
    queryFn: () => api<Dashboard>("/celebrations/dashboard"),
  });
}
export function useLeaderboard() {
  return useQuery({
    queryKey: ["celebrations", "leaderboard"],
    queryFn: () => api<LeaderboardMember[]>("/celebrations/leaderboard"),
  });
}
export function personName(user: CheckInUser) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  );
}
export function centralTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
