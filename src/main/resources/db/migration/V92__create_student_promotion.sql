-- Track a student promotion batch between two academic years.

CREATE TABLE student_promotion_batch (
                                         id UUID PRIMARY KEY,

                                         institution_id UUID NOT NULL
                                             REFERENCES institution(id),

                                         source_academic_year_id UUID NOT NULL,
                                         target_academic_year_id UUID NOT NULL,

                                         status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

                                         created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                         updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                         executed_at TIMESTAMPTZ,

                                         CONSTRAINT ck_promotion_batch_different_years
                                             CHECK (source_academic_year_id <> target_academic_year_id),

                                         CONSTRAINT ck_promotion_batch_status
                                             CHECK (status IN ('DRAFT', 'EXECUTED', 'CANCELLED')),

                                         CONSTRAINT fk_promotion_batch_source_year
                                             FOREIGN KEY (source_academic_year_id, institution_id)
                                                 REFERENCES academic_year(id, institution_id),

                                         CONSTRAINT fk_promotion_batch_target_year
                                             FOREIGN KEY (target_academic_year_id, institution_id)
                                                 REFERENCES academic_year(id, institution_id)
);

CREATE INDEX idx_promotion_batch_source_year
    ON student_promotion_batch(source_academic_year_id, status);

CREATE INDEX idx_promotion_batch_target_year
    ON student_promotion_batch(target_academic_year_id, status);


-- Store each student's decision and destination within the batch.

CREATE TABLE student_promotion_batch_item (
                                              id UUID PRIMARY KEY,

                                              batch_id UUID NOT NULL
                                                  REFERENCES student_promotion_batch(id),

                                              student_id UUID NOT NULL
                                                  REFERENCES student(id),

                                              source_enrollment_id UUID NOT NULL
                                                  REFERENCES student_enrollment(id),

                                              target_section_id UUID
                                                  REFERENCES class_section(id),

                                              target_enrollment_id UUID
                                                  REFERENCES student_enrollment(id),

                                              decision VARCHAR(20) NOT NULL DEFAULT 'PENDING',

                                              reason VARCHAR(500),

                                              created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                              updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                              CONSTRAINT uk_promotion_batch_student
                                                  UNIQUE (batch_id, student_id),

                                              CONSTRAINT uk_promotion_target_enrollment
                                                  UNIQUE (target_enrollment_id),

                                              CONSTRAINT ck_promotion_item_decision
                                                  CHECK (
                                                      decision IN ('PENDING', 'PROMOTE', 'HOLD_BACK', 'EXCLUDE')
                                                      ),

                                              CONSTRAINT ck_promotion_item_target_section
                                                  CHECK (
                                                      (decision IN ('PROMOTE', 'HOLD_BACK')
                                                          AND target_section_id IS NOT NULL)
                                                          OR
                                                      (decision IN ('PENDING', 'EXCLUDE')
                                                          AND target_section_id IS NULL)
                                                      )
);

CREATE INDEX idx_promotion_item_batch
    ON student_promotion_batch_item(batch_id);

CREATE INDEX idx_promotion_item_student
    ON student_promotion_batch_item(student_id);