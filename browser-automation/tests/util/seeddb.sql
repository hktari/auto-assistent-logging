INSERT INTO account ("id", "email", "password", "automationEnabled") OVERRIDING SYSTEM VALUE
VALUES (0, 'test@example.com', 'secret', true),
    (1, 'test2@example.com', 'secret2', false),
    (2, 'test-eracuni@example.com', 'secret', true);
INSERT INTO login_info (
        "id",
        "account_id",
        "username",
        "password_cipher",
        "iv_cipher"
    ) OVERRIDING SYSTEM VALUE
VALUES (
        0,
        0,
        'test',
        decode('40d06dced5afdabd170893da9ac3eefc', 'hex'),
        decode('d0374becc33bb6b4ebcf692d90a2e10a', 'hex')
    ),
    (
        1,
        1,
        'test2',
        decode(
            '4b46158e43fae2d96b3e63c88f7d1bd9',
            'hex'
        ),
        decode('d0374becc33bb6b4ebcf692d90a2e10a', 'hex')
    ),
    (
        2,
        2,
        'test-eracuni',
        decode('40d06dced5afdabd170893da9ac3eefc', 'hex'),
        decode('d0374becc33bb6b4ebcf692d90a2e10a', 'hex')
    );
INSERT INTO daily_config (
        "id",
        "login_info_id",
        "date",
        "start_at",
        "end_at"
    ) OVERRIDING SYSTEM VALUE
VALUES (0, 0, '2022-05-01T00:00:00', '12:00', '20:00')
INSERT INTO work_week_config (
        "id",
        "login_info_id",
        "day",
        "start_at",
        "end_at"
    ) OVERRIDING SYSTEM VALUE
VALUES (0, 0, 'mon', '12:00', '20:00'),
    (1, 0, 'tue', '14:00', '24:00'),
    (2, 0, 'wed', '12:00', '20:00'),
    (3, 0, 'thu', '20:00', '04:00'),
    (4, 0, 'fri', '12:00', '20:00');
INSERT INTO work_week_exception ("work_week_config_id", "date", "action")
VALUES (0, '2022-08-07T00:00:00', 'start_btn'),
    (0, '2022-08-07T00:00:00', 'stop_btn'),
    (1, '2022-08-08T00:00:00', 'start_btn'),
    (1, '2022-08-08T00:00:00', 'stop_btn');
INSERT INTO log_entry (
        "login_info_id",
        "status",
        "timestamp",
        "error",
        "message",
        "action",
        "config_type"
    )
VALUES (
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
INSERT INTO daily_config (
        "login_info_id",
        "date",
        "start_at",
        "end_at"
    ) OVERRIDING SYSTEM VALUE
VALUES (0, '2022-08-18T00:00:00', '06:00', '14:00');
INSERT INTO work_week_exception ("work_week_config_id", "date", "action")
VALUES (0, '2022-08-17T00:00:00', 'start_btn'),
    (0, '2022-08-17T00:00:00', 'stop_btn'),
    (0, '2022-08-18T00:00:00', 'start_btn'),
    (0, '2022-08-18T00:00:00', 'stop_btn');
INSERT INTO log_entry (
        "login_info_id",
        "status",
        "timestamp",
        "error",
        "message",
        "action",
        "config_type"
    )
VALUES (
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
/* -------------------------------------------------------------------------- */
/*                            E-Racuni                        */
/* -------------------------------------------------------------------------- */
INSERT INTO eracuni(
        its_client_id,
        "itc_SID_homepage",
        "app_logged_in_URL",
        "app_homepage_URL",
        account_id
    )
VALUES (
        'IflQSpp3KaK00Cwf095MyYnQ_3881595479',
        'xtgrLk3eekf9Sptlltb0flYS_3883195249',
        'https://test.eracuni.com/test-eracuni/2923920',
        'https://test.eracuni.com',
        2
    );
INSERT INTO daily_config (
        "login_info_id",
        "date",
        "start_at",
        "end_at"
    )
VALUES (2, '2024-01-23T00:00:00', '14:00', '22:00');
-- 388D06F5-AB37-4B0F-8734-DFACF13528C0
INSERT INTO daily_config (
        "login_info_id",
        "date",
        "start_at",
        "end_at"
    )
VALUES (2, '2024-01-31T00:00:00', '14:00', '22:00');