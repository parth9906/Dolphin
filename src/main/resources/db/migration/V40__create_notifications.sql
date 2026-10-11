
CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recipient_user_id UUID NOT NULL
        REFERENCES user_account(id),

    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(2000) NOT NULL,

    reference_type VARCHAR(50),
    reference_id UUID,

    idempotency_key VARCHAR(200) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ,

    CONSTRAINT uq_notification_recipient_idempotency
        UNIQUE (recipient_user_id, idempotency_key)
);

CREATE INDEX idx_notification_inbox
    ON notification (recipient_user_id, created_at DESC);

CREATE INDEX idx_notification_unread
    ON notification (recipient_user_id, created_at DESC)
    WHERE read_at IS NULL;
