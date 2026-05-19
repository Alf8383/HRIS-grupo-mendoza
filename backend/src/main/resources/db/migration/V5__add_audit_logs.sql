create table audit_logs (
    id bigserial primary key,
    event_at timestamp with time zone not null,
    user_id bigint,
    user_email varchar(255),
    module varchar(60) not null,
    action varchar(60) not null,
    entity_type varchar(60) not null,
    entity_id bigint,
    summary varchar(500) not null
);

create index idx_audit_logs_event_at on audit_logs (event_at desc);
create index idx_audit_logs_user_id on audit_logs (user_id);
create index idx_audit_logs_module on audit_logs (module);
create index idx_audit_logs_action on audit_logs (action);
