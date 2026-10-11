-- Admission applications are read-modify-write resources (status transitions,
-- edits, and the ACCEPTED -> ENROLLED transition that creates a student and an
-- enrollment). The previous schema had last-write-wins semantics under
-- concurrency. Add an optimistic-lock version column so concurrent writers are
-- detected and rejected with a 409 CONCURRENT_MODIFICATION response.
ALTER TABLE admission_application
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
