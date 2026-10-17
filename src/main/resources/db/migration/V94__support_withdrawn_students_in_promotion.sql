ALTER TABLE student_promotion_batch_item
DROP CONSTRAINT ck_promotion_item_decision;

ALTER TABLE student_promotion_batch_item
    ADD CONSTRAINT ck_promotion_item_decision
        CHECK (
            decision IN (
                         'PENDING',
                         'PROMOTE',
                         'HOLD_BACK',
                         'WITHDRAW',
                         'EXCLUDE'
                )
            );

ALTER TABLE student_promotion_batch_item
DROP CONSTRAINT ck_promotion_item_target_section;

ALTER TABLE student_promotion_batch_item
    ADD CONSTRAINT ck_promotion_item_target_section
        CHECK (
            (
                decision IN ('PROMOTE', 'HOLD_BACK')
                    AND target_section_id IS NOT NULL
                )
                OR
            (
                decision IN ('PENDING', 'WITHDRAW', 'EXCLUDE')
                    AND target_section_id IS NULL
                )
            );