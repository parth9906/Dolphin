CREATE UNIQUE INDEX uq_promotion_batch_draft_source_target
    ON student_promotion_batch (
                                source_academic_year_id,
                                target_academic_year_id
        )
    WHERE status = 'DRAFT';