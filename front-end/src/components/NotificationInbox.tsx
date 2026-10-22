import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Indicator,
  Popover,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../auth/AuthContext";
import { getInitials } from "../lib/avatar-color";
import {
  useInbox,
  useReadAllNotifications,
  useReadNotification,
} from "../lib/notifications";

export default function NotificationInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inbox = useInbox();
  const read = useReadNotification();
  const readAll = useReadAllNotifications();
  const [opened, setOpened] = useState(false);
  const avatar = useRef<HTMLButtonElement>(null);
  const count = inbox.data?.pages[0]?.unreadCount ?? 0;
  const items = [
    ...new Map(
      inbox.data?.pages
        .flatMap((page) => page.items)
        .map((item) => [item.id, item]),
    ).values(),
  ];
  function close() {
    setOpened(false);
    avatar.current?.focus();
  }
  useEffect(() => {
    if (!opened) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpened(false);
        avatar.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [opened]);
  return (
    <Popover
      opened={opened}
      onChange={(value) => {
        setOpened(value);
        if (!value) avatar.current?.focus();
      }}
      position="bottom-end"
      offset={8}
      width={390}
      trapFocus
      returnFocus={false}
    >
      <Popover.Target>
        <UnstyledButton
          ref={avatar}
          aria-label={`Notifications, ${count} unread`}
          aria-expanded={opened}
          onClick={() => {
            setOpened(!opened);
            if (!opened) void inbox.refetch();
          }}
        >
          <Indicator
            disabled={count === 0}
            label={count > 99 ? "99+" : count}
            size={20}
            color="red"
            offset={3}
          >
            <Avatar color="arka" radius="xl" size="md">
              {getInitials(
                user?.firstName ?? undefined,
                user?.lastName ?? undefined,
                user?.email,
              )}
            </Avatar>
          </Indicator>
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown style={{ maxWidth: "calc(100vw - 24px)", padding: 0 }}>
        <Group justify="space-between" p="sm">
          <Text fw={700}>Notifications</Text>
          <Button
            variant="subtle"
            size="compact-xs"
            disabled={!count || !inbox.data}
            loading={readAll.isPending}
            onClick={() => readAll.mutate(inbox.data!.pages[0].snapshot)}
          >
            Mark all read
          </Button>
        </Group>
        {(read.isError || readAll.isError) && (
          <Text role="alert" size="sm" c="red" px="sm">
            Could not mark notifications read. Please try again.
          </Text>
        )}
        {inbox.isError && (
          <Stack p="sm" gap="xs">
            <Text role="alert">Could not load notifications</Text>
            <Button onClick={() => void inbox.refetch()}>Retry</Button>
          </Stack>
        )}
        {inbox.isPending ? (
          <Stack p="sm">
            <Skeleton height={60} />
            <Skeleton height={60} />
          </Stack>
        ) : (
          <ScrollArea.Autosize mah="min(360px, calc(100dvh - 160px))">
            {!items.length && !inbox.isError && (
              <Text p="md" c="dimmed">
                No notifications yet.
              </Text>
            )}
            {items.map((item) => (
              <Group
                key={item.id}
                wrap="nowrap"
                gap="xs"
                p="xs"
                style={{
                  borderTop: "1px solid var(--mantine-color-default-border)",
                  background: item.readAt
                    ? undefined
                    : "var(--mantine-color-arka-light)",
                }}
              >
                <UnstyledButton
                  style={{ flex: 1, minWidth: 0 }}
                  p="xs"
                  onClick={() => {
                    close();
                    void navigate({
                      to: "/",
                      search: {
                        checkInId: item.checkInId,
                        notificationId: item.id,
                        commentId: item.commentId ?? undefined,
                      },
                    });
                  }}
                >
                  <Text size="sm">
                    <b>
                      {[item.actor.firstName, item.actor.lastName]
                        .filter(Boolean)
                        .join(" ") || item.actor.email}
                    </b>{" "}
                    {item.kind === "KUDOS"
                      ? "gave kudos to your check-in from"
                      : item.kind === "MENTION"
                        ? "mentioned you in a comment on a check-in from"
                        : "left a comment on your check-in from"}{" "}
                    {new Date(item.checkInDate).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                    })}
                    .
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(item.createdAt).toLocaleString()} ·{" "}
                    {item.readAt ? "Read" : "Unread"}
                  </Text>
                </UnstyledButton>
                <Tooltip label={item.readAt ? "Already read" : "Mark as read"}>
                  <ActionIcon
                    variant="subtle"
                    color="teal"
                    aria-label="Mark notification as read"
                    disabled={!!item.readAt || read.isPending}
                    onClick={() => read.mutate(item.id)}
                  >
                    <IconCheck size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            ))}
            {inbox.hasNextPage && (
              <Box p="sm">
                <Button
                  fullWidth
                  variant="subtle"
                  loading={inbox.isFetchingNextPage}
                  onClick={() => void inbox.fetchNextPage()}
                >
                  Load more
                </Button>
              </Box>
            )}
          </ScrollArea.Autosize>
        )}
        <Text size="xs" c="dimmed" p="sm" aria-live="polite">
          {count ? `${count} unread notifications` : "All caught up"}
        </Text>
      </Popover.Dropdown>
    </Popover>
  );
}
