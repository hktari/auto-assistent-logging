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
        'another.user@exampl.com',
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
    );

INSERT INTO
    DAILY_CONFIG (id, login_info_id, date, start_at, end_at) OVERRIDING SYSTEM VALUE
VALUES
    (0, 0, '2022-08-08', '12:00', '20:00');