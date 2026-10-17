
-- V90: Add assessment scopes, enforce institution consistency,
-- and add assessment update permission.

-- 1. Add assessment scope columns.
ALTER TABLE assessment
    ADD COLUMN scope_type VARCHAR(20),
    ADD COLUMN school_class_id UUID;

-- Preserve the meaning of existing assessments.
UPDATE assessment
SET scope_type = CASE
                     WHEN section_id IS NOT NULL THEN 'SECTION'
                     ELSE 'INSTITUTION'
    END;

ALTER TABLE assessment
    ALTER COLUMN scope_type SET NOT NULL;

-- 2. Add institution_id columns to the academic hierarchy.
ALTER TABLE school_class
    ADD COLUMN institution_id UUID;

UPDATE school_class sc
SET institution_id = ay.institution_id
    FROM academic_year ay
WHERE ay.id = sc.academic_year_id;

ALTER TABLE school_class
    ALTER COLUMN institution_id SET NOT NULL;

ALTER TABLE class_section
    ADD COLUMN institution_id UUID;

UPDATE class_section cs
SET institution_id = sc.institution_id
    FROM school_class sc
WHERE sc.id = cs.school_class_id;

ALTER TABLE class_section
    ALTER COLUMN institution_id SET NOT NULL;

-- 3. Create composite unique keys for foreign-key targets.
ALTER TABLE academic_year
    ADD CONSTRAINT uk_academic_year_id_institution
        UNIQUE (id, institution_id);

ALTER TABLE school_class
    ADD CONSTRAINT uk_school_class_id_institution
        UNIQUE (id, institution_id);

ALTER TABLE class_section
    ADD CONSTRAINT uk_class_section_id_institution
        UNIQUE (id, institution_id);

-- 4. Automatically derive institution_id for newly inserted
-- or reassigned classes from their academic year.
CREATE FUNCTION set_school_class_institution_id()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS $$
BEGIN
SELECT ay.institution_id
INTO NEW.institution_id
FROM academic_year ay
WHERE ay.id = NEW.academic_year_id;

IF NEW.institution_id IS NULL THEN
        RAISE EXCEPTION
            'Cannot determine institution for academic year %',
            NEW.academic_year_id;
END IF;

RETURN NEW;
END;
$$;

CREATE TRIGGER trg_school_class_set_institution
    BEFORE INSERT OR UPDATE OF academic_year_id
                     ON school_class
                         FOR EACH ROW
                         EXECUTE FUNCTION set_school_class_institution_id();

-- Automatically derive a section's institution from its class.
CREATE FUNCTION set_class_section_institution_id()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS $$
BEGIN
SELECT sc.institution_id
INTO NEW.institution_id
FROM school_class sc
WHERE sc.id = NEW.school_class_id;

IF NEW.institution_id IS NULL THEN
        RAISE EXCEPTION
            'Cannot determine institution for school class %',
            NEW.school_class_id;
END IF;

RETURN NEW;
END;
$$;

CREATE TRIGGER trg_class_section_set_institution
    BEFORE INSERT OR UPDATE OF school_class_id
                     ON class_section
                         FOR EACH ROW
                         EXECUTE FUNCTION set_class_section_institution_id();

-- 5. Enforce consistency throughout the academic hierarchy.
ALTER TABLE school_class
    ADD CONSTRAINT fk_school_class_academic_year_institution
        FOREIGN KEY (academic_year_id, institution_id)
            REFERENCES academic_year (id, institution_id);

ALTER TABLE class_section
    ADD CONSTRAINT fk_class_section_school_class_institution
        FOREIGN KEY (school_class_id, institution_id)
            REFERENCES school_class (id, institution_id);

-- Fail clearly if existing assessment targets cross institutions.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM assessment a
        JOIN class_section cs ON cs.id = a.section_id
        JOIN school_class sc ON sc.id = cs.school_class_id
        JOIN academic_year ay ON ay.id = sc.academic_year_id
        WHERE a.institution_id <> ay.institution_id
    ) THEN
        RAISE EXCEPTION
            'V90 blocked: an existing assessment section belongs to another institution';
END IF;
END;
$$;

-- 6. Enforce institution consistency for assessment targets.
ALTER TABLE assessment
    ADD CONSTRAINT fk_assessment_school_class_institution
        FOREIGN KEY (school_class_id, institution_id)
            REFERENCES school_class (id, institution_id);

ALTER TABLE assessment
    ADD CONSTRAINT fk_assessment_section_institution
        FOREIGN KEY (section_id, institution_id)
            REFERENCES class_section (id, institution_id);

-- 7. Enforce exactly one target for each assessment scope.
ALTER TABLE assessment
    ADD CONSTRAINT ck_assessment_scope_target CHECK (
        (scope_type = 'INSTITUTION'
            AND school_class_id IS NULL
            AND section_id IS NULL)
            OR
        (scope_type = 'CLASS'
            AND school_class_id IS NOT NULL
            AND section_id IS NULL)
            OR
        (scope_type = 'SECTION'
            AND school_class_id IS NULL
            AND section_id IS NOT NULL)
        );

-- 8. Add indexes.
CREATE INDEX idx_assessment_school_class
    ON assessment (school_class_id, assessment_date DESC);

CREATE INDEX idx_assessment_scope_institution_date
    ON assessment (institution_id, scope_type, assessment_date DESC);

-- 9. Add assessment update permission.
INSERT INTO permission (
    id,
    code,
    name,
    description,
    active,
    created_at,
    updated_at
)
VALUES (
           gen_random_uuid(),
           'ASSESSMENT_UPDATE',
           'Update Assessment',
           'Update assessment definitions and scope',
           TRUE,
           CURRENT_TIMESTAMP,
           CURRENT_TIMESTAMP
       )
    ON CONFLICT (code) DO NOTHING;

-- 10. Grant permission to PLATFORM_ADMIN.
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
         CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code = 'ASSESSMENT_UPDATE'
    ON CONFLICT DO NOTHING;
