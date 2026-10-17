
ALTER TABLE user_invitation
    ADD COLUMN staff_member_id UUID;

ALTER TABLE user_invitation
    ADD CONSTRAINT fk_user_invitation_staff_member
        FOREIGN KEY (staff_member_id)
            REFERENCES staff_member(id);

CREATE UNIQUE INDEX uq_user_invitation_staff_member
    ON user_invitation (staff_member_id)
    WHERE staff_member_id IS NOT NULL;
