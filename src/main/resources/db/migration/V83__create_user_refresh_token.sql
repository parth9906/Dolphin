-- Persistent, revocable refresh sessions backing POST /api/v1/auth/refresh and
-- POST /api/v1/auth/logout. Only the SHA-256 hash of the refresh token is
-- stored; the raw token never touches the database.
--
-- Rotation: on every successful refresh the presented row is marked revoked
-- (rotated_at + replaced_by_token_id point at its successor) and a new row is
-- inserted in the same family_id. Reuse of an already-rotated token is treated
-- as theft and revokes the whole family.
CREATE TABLE user_refresh_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    family_id UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    rotated_at TIMESTAMPTZ,
    replaced_by_token_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_refresh_token_user
        FOREIGN KEY (user_id)
        REFERENCES user_account(id),

    CONSTRAINT fk_user_refresh_token_replaced_by
        FOREIGN KEY (replaced_by_token_id)
        REFERENCES user_refresh_token(id),

    CONSTRAINT uk_user_refresh_token_hash
        UNIQUE (token_hash)
);

CREATE INDEX idx_user_refresh_token_user
    ON user_refresh_token(user_id);

CREATE INDEX idx_user_refresh_token_family
    ON user_refresh_token(family_id);
