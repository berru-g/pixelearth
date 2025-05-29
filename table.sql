alter table pixels
add column color text default '#ffffff';

alter table pixels
add column image_url text;

alter table pixels
add column link_url text;

alter table pixels
add column stripe_session_id text;
