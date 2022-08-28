INSERT INTO
    account ("id", "email", "password", "automationEnabled") OVERRIDING SYSTEM VALUE
VALUES
    (0, 'test@example.com', 'secret', true),
    (1, 'test2@example.com', 'secret2', true);

INSERT INTO
    login_info (
        "id",
        "account_id",
        "username",
        "password_cipher",
        "iv_cipher"
    ) OVERRIDING SYSTEM VALUE
VALUES
    (
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
    )
;


INSERT INTO daily_config ("id", "login_info_id", "date", "start_at", "end_at", "automation_type")
OVERRIDING SYSTEM VALUE
VALUES  (0, 0, '2022-05-01T00:00:00', '12:00', '20:00', '')

-- id | login_info_id | date | start_at | end_at | automation_type 
----+---------------+------+----------+--------+-----------------

