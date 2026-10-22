import { useState } from "react";
import {
  ActionIcon,
  Alert,
  Avatar,
  Button,
  Group,
  Loader,
  Popover,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import "./KudosActions.css";
import type { CheckIn } from "../checkin";
import {
  personName,
  useGiveKudos,
  useKudosRecipients,
} from "../lib/celebrations";
import { getAvatarColor, getInitials } from "../lib/avatar-color";
export default function KudosActions({ checkIn }: { checkIn: CheckIn }) {
  const [opened, setOpened] = useState(false);
  const recipients = useKudosRecipients(checkIn.id, opened);
  const award = useGiveKudos();
  const given = checkIn.viewerHasGivenKudos;
  const isOwnCheckIn = checkIn.canGiveKudos === false && !given;
  return (
    <Stack gap="xs" className="kudos-actions">
      <Group gap={10}>
        {(checkIn.canGiveKudos || given) && (
          <Button
            className="kudos-give"
            aria-pressed={Boolean(given)}
            leftSection={
              given ? (
                <IconCheck size={15} aria-hidden="true" />
              ) : (
                <span className="kudos-mark" aria-hidden="true">
                  ♧
                </span>
              )
            }
            disabled={given}
            loading={award.isPending}
            onClick={() => award.mutate(checkIn.id)}
          >
            {given ? "Kudos given" : "Give kudos"}
          </Button>
        )}
        <Popover
          opened={opened}
          onChange={setOpened}
          width={350}
          position="top-start"
          offset={10}
          trapFocus
          returnFocus
        >
          <Popover.Target>
            <UnstyledButton
              className="kudos-count"
              aria-expanded={opened}
              aria-label={`See who gave kudos to ${personName(checkIn.user)}: ${checkIn.kudosCount ?? 0} kudos`}
              onClick={() => setOpened((v) => !v)}
            >
              {checkIn.kudosCount ?? 0}{" "}
              {checkIn.kudosCount === 1 ? "person" : "people"} gave kudos
            </UnstyledButton>
          </Popover.Target>
          <Popover.Dropdown className="kudos-popover">
            <Stack gap="sm">
              <div>
                <Group justify="space-between" mb={6} wrap="nowrap">
                  <Text fz={18} fw={600}>
                    Kudos
                  </Text>
                  <ActionIcon
                    variant="default"
                    className="kudos-close"
                    aria-label="Close kudos recipients"
                    onClick={() => setOpened(false)}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
                <Text fz={13} c="dimmed">
                  For {personName(checkIn.user)}’s check-in
                </Text>
              </div>
              {recipients.isPending ? (
                <Loader size="sm" aria-label="Loading kudos recipients" />
              ) : recipients.isError ? (
                <>
                  <Text c="red" size="sm">
                    Could not load kudos.
                  </Text>
                  <Button size="xs" onClick={() => void recipients.refetch()}>
                    Retry
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    {(recipients.data ?? []).map((r, index) => (
                      <Group
                        key={r.id}
                        wrap="nowrap"
                        gap={12}
                        className="kudos-recipient"
                      >
                        <Avatar
                          size={34}
                          radius="xl"
                          color={getAvatarColor(r.giver.colorSlot)}
                          styles={{
                            root: {
                              background: ["#f8e7cc", "#e2eee8", "#e9e5f2"][
                                index % 3
                              ],
                              color: "#8a4e1e",
                              fontWeight: 700,
                            },
                          }}
                        >
                          {getInitials(
                            r.giver.firstName,
                            r.giver.lastName,
                            r.giver.email,
                          )}
                        </Avatar>
                        <Text
                          size="sm"
                          fw={700}
                          className="kudos-recipient-name"
                        >
                          {personName(r.giver)}
                        </Text>
                        <span
                          className="kudos-mark kudos-recipient-mark"
                          aria-hidden="true"
                        >
                          ♧
                        </span>
                      </Group>
                    ))}
                  </div>
                  <Text size="xs" c="dimmed">
                    {recipients.data?.length
                      ? `${recipients.data.length} ${recipients.data.length === 1 ? "person" : "people"} gave kudos to this check-in.`
                      : isOwnCheckIn
                        ? "No kudos yet."
                        : "No kudos yet. Be the first to give kudos."}
                  </Text>
                </>
              )}
            </Stack>
          </Popover.Dropdown>
        </Popover>
      </Group>
      {award.isError && (
        <Alert color="red" title="Could not give kudos" role="alert">
          {award.error.message}{" "}
          <Button
            variant="subtle"
            size="xs"
            onClick={() => award.mutate(checkIn.id)}
          >
            Retry
          </Button>
        </Alert>
      )}
      {award.isSuccess && (
        <Text size="xs" c="dimmed" role="status">
          Kudos given.
        </Text>
      )}
    </Stack>
  );
}
