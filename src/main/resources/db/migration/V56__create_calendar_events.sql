CREATE TABLE calendar_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institution(id),
    campus_id UUID REFERENCES campus(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID NOT NULL REFERENCES user_account(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_calendar_event_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_calendar_event_type
        CHECK (event_type IN ('HOLIDAY', 'EXAM', 'MEETING', 'SPORTS', 'CULTURAL', 'OTHER')),

    CONSTRAINT chk_calendar_event_times
        CHECK (
            (start_time IS NULL AND end_time IS NULL)
            OR
            (start_time IS NOT NULL
                AND end_time IS NOT NULL
                AND start_time < end_time)
        )
);

CREATE INDEX idx_calendar_event_institution_date
    ON calendar_event(institution_id, start_date DESC);

CREATE INDEX idx_calendar_event_campus_date
    ON calendar_event(campus_id, start_date);
