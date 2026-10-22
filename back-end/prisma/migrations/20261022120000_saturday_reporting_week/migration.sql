-- Move existing Sunday week keys to Saturday without changing recorded deadlines.
-- This preserves historical timing and the one-check-in-per-member/week constraint.
UPDATE "CheckIn"
SET "reportingWeekStart" = "reportingWeekStart" - 1
WHERE EXTRACT(DOW FROM "reportingWeekStart") = 0;
