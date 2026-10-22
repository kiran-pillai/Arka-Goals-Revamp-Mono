import { useState } from "react";
import {
  Button,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  useCheckIns,
  useAddComment,
  useDeleteComment,
  useMentionUsers,
} from "./lib/checkins";
import { useReadNotification } from "./lib/notifications";
import CheckInTimeline from "./components/CheckInTimeline";

export default function CheckInsPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/authenticated/" });
  const readNotification = useReadNotification();
  const clearTarget = (): Promise<void> => navigate({ to: "/", replace: true });
  const acknowledge = () => {
    setScope("squad");
    if (search.notificationId)
      readNotification.mutate(search.notificationId, {
        onSuccess: () => {
          void clearTarget();
        },
      });
    else void clearTarget();
  };
  const [scope, setScope] = useState<"mine" | "squad">("mine");
  const checkIns = useCheckIns(search.checkInId ? false : scope === "mine");
  const mentionUsers = useMentionUsers();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  return (
    <>
      <Stack gap="sm" mb="md">
        <Group justify="space-between" align="flex-end">
          <Title order={1} fz={30}>
            Squad Check-ins
          </Title>
          <Button
            leftSection={<IconPlus size={16} />}
            color="arka"
            onClick={() => navigate({ to: "/form" })}
          >
            Add Check-in
          </Button>
        </Group>

        <SegmentedControl
          value={search.checkInId ? "squad" : scope}
          onChange={(v) => {
            setScope(v as "mine" | "squad");
            if (search.checkInId) void clearTarget();
          }}
          data={[
            { label: "My check-ins", value: "mine" },
            { label: "Whole squad", value: "squad" },
          ]}
          color="arka"
        />
      </Stack>

      {search.checkInId &&
        checkIns.isSuccess &&
        !checkIns.data.some((c) => c.id === search.checkInId) && (
          <Stack mb="md">
            <Text role="alert">This check-in is no longer available.</Text>
            <Button onClick={acknowledge}>Dismiss notification</Button>
          </Stack>
        )}
      {readNotification.isError && (
        <Stack mb="md">
          <Text role="alert">Could not mark the notification read.</Text>
          <Button onClick={acknowledge}>Retry</Button>
        </Stack>
      )}
      {checkIns.isError ? (
        <Stack>
          <Text role="alert">Could not load check-ins.</Text>
          <Button onClick={() => void checkIns.refetch()}>Retry</Button>
        </Stack>
      ) : checkIns.isLoading ? (
        <Stack align="center" py="xl">
          <Text c="dimmed">Loading…</Text>
        </Stack>
      ) : (checkIns.data ?? []).length === 0 ? (
        <Stack align="center" gap={4} py="xl">
          <Text fw={600}>No check-ins yet</Text>
          <Text c="dimmed" size="sm">
            Submit a weekly check-in and it'll show up here.
          </Text>
        </Stack>
      ) : (
        <CheckInTimeline
          users={mentionUsers.data}
          targetCommentId={search.commentId}
          targetId={search.checkInId}
          selectionKey={`${search.checkInId ?? ""}:${
            search.notificationId ?? ""
          }:${search.commentId ?? ""}`}
          onTargetArrival={acknowledge}
          checkIns={checkIns.data ?? []}
          onAddComment={(checkInId, text, mentionedUserIds) =>
            addComment.mutate({ checkInId, text, mentionedUserIds })
          }
          onDeleteComment={(checkInId, commentId) =>
            deleteComment.mutate({ checkInId, commentId })
          }
        />
      )}
    </>
  );
}
