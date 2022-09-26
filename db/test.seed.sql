INSERT INTO
    ACCOUNT (id, email, password, "automationEnabled") OVERRIDING SYSTEM VALUE
VALUES
    (
        0,
        'existing.user@example.com',
        '$2b$10$5u9E0/TaK47TQfGuwpbHieIe.zjxMDeu6iH2pfUJT8AzbMGXryANK',
        true
    ),
    /*secret*/
    (
        1,
        'another.user@example.com',
        '$2b$10$W.OeQ0i3P8eJ6pNl3VeGB.B3pI9L7ErpKqHIjLu8rPRiOS.WtenuG',
        true
    );

/*secret2*/
INSERT INTO
    LOGIN_INFO (
        id,
        account_id,
        username,
        password_cipher,
        iv_cipher
    ) OVERRIDING SYSTEM VALUE
VALUES
    (
        0,
        0,
        'existinguser',
        'secret_cipher',
        'iv_cipher'
    ),
    (
        1,
        1,
        'anotheruser',
        'secret_cipher',
        'iv_cipher'
    );

;

INSERT INTO
    DAILY_CONFIG (id, login_info_id, date, start_at, end_at) OVERRIDING SYSTEM VALUE
VALUES
    (0, 0, '2022-08-08', '12:00', '20:00');

INSERT INTO
    work_week_config (
        "id",
        "login_info_id",
        "day",
        "start_at",
        "end_at"
    ) OVERRIDING SYSTEM VALUE
VALUES
    (0, 0, 'mon', '12:00', '20:00'),
    (1, 0, 'tue', '14:00', '24:00'),
    (2, 0, 'wed', '12:00', '20:00'),
    (3, 0, 'thu', '20:00', '04:00'),
    (4, 0, 'fri', '12:00', '20:00'),
    (5, 1, 'mon', '20:00', '04:00'),
    (6, 1, 'tue', '20:00', '04:00'),
    (7, 1, 'wed', '20:00', '04:00'),
    (8, 1, 'thu', '20:00', '04:00'),
    (9, 1, 'fri', '20:00', '04:00');

INSERT INTO
    work_week_exception ("id", "work_week_config_id", "date", "action") OVERRIDING SYSTEM VALUE
VALUES
    (0, 0, '2022-08-07T00:00:00', 'start_btn'),
    (1, 0, '2022-08-07T00:00:00', 'stop_btn'),
    (2, 5, '2022-08-08T00:00:00', 'start_btn'),
    (3, 5, '2022-08-08T00:00:00', 'stop_btn');

INSERT INTO
    log_entry (
        "login_info_id",
        "status",
        "timestamp",
        "error",
        "message",
        "action",
        "config_type"
    )
VALUES
    (
        0,
        'successful',
        '2022-08-01T14:00:00',
        NULL,
        'Sucessfully executed start_btn action',
        'start_btn',
        'CONFIG_TYPE_WEEKLY'
    ),
    (
        0,
        'successful',
        '2022-08-01T22:00:00',
        NULL,
        'Sucessfully executed stop_btn action',
        'stop_btn',
        'CONFIG_TYPE_WEEKLY'
    ),
    (
        0,
        'failed',
        '2022-08-02T14:00:00',
        'Failed to execute start_btn action',
        null,
        'start_btn',
        'CONFIG_TYPE_DAILY'
    );

/* -------------------------------------------------------------------------- */
/*                            auto-assistant-test-data                        */
/* -------------------------------------------------------------------------- */
INSERT INTO
    daily_config (
        "login_info_id",
        "date",
        "start_at",
        "end_at"
    ) OVERRIDING SYSTEM VALUE
VALUES
    (0, '2022-08-18T00:00:00', '06:00', '14:00');

INSERT INTO
    work_week_exception ("work_week_config_id", "date", "action")
VALUES
    (0, '2022-08-17T00:00:00', 'start_btn'),
    (0, '2022-08-17T00:00:00', 'stop_btn'),
    (0, '2022-08-18T00:00:00', 'start_btn'),
    (0, '2022-08-18T00:00:00', 'stop_btn');

INSERT INTO
    log_entry (
        "login_info_id",
        "status",
        "timestamp",
        "error",
        "message",
        "action",
        "config_type"
    )
VALUES
    (
        0,
        'successful',
        '2022-08-16T14:00:00',
        NULL,
        'Sucessfully executed start_btn action',
        'start_btn',
        'CONFIG_TYPE_WEEKLY'
    ),
    (
        0,
        'successful',
        '2022-09-02T04:00:00',
        NULL,
        'Sucessfully executed stop_btn action',
        'stop_btn',
        'CONFIG_TYPE_WEEKLY'
    );