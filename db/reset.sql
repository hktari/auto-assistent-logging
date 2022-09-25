DELETE FROM
    daily_config
where
    1 = 1;

DELETE FROM
    work_week_exception
where
    1 = 1;

DELETE FROM
    work_week_config
where
    1 = 1;

DELETE FROM
    log_entry
where
    1 = 1;

DELETE FROM
    login_info
where
    1 = 1;

DELETE FROM
    account
where
    1 = 1;


ALTER SEQUENCE daily_config_id_seq RESTART WITH 1