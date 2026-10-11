-- Make assessments optionally section-scoped.
--
-- Nullable on purpose: existing assessments (and any assessment created without
-- a section) remain institution-wide, and no row needs backfilling. When a
-- section is set, marks authorization is resolved from that section rather than
-- per student; when it is null, the per-student enrollment derivation is used.

ALTER TABLE assessment
    ADD COLUMN section_id UUID;

ALTER TABLE assessment
    ADD CONSTRAINT fk_assessment_section
        FOREIGN KEY (section_id)
        REFERENCES class_section(id);

CREATE INDEX idx_assessment_section
    ON assessment (section_id, assessment_date DESC);
