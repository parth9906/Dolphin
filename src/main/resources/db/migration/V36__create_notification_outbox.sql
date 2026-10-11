
CREATE TABLE notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    locked_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    last_error TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_notification_outbox_status
        CHECK (status IN (
            'PENDING',
            'PROCESSING',
            'DELIVERED',
            'DEAD'
        )),

    CONSTRAINT chk_notification_outbox_attempts
        CHECK (attempts >= 0),

    CONSTRAINT uq_notification_outbox_event
        UNIQUE (event_type, aggregate_type, aggregate_id)
);

CREATE INDEX idx_notification_outbox_pending
    ON notification_outbox (next_attempt_at, created_at)
    WHERE status = 'PENDING';

CREATE INDEX idx_notification_outbox_processing
    ON notification_outbox (locked_at)
    WHERE status = 'PROCESSING';

CREATE INDEX idx_notification_outbox_aggregate
    ON notification_outbox (aggregate_type, aggregate_id);
