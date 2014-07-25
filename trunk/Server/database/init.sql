CREATE TABLE dbinfo (
	version INTEGER NOT NULL,
	cookiesecret TEXT NOT NULL,
	sessionsecret TEXT NOT NULL
);
CREATE TABLE session (
	id TEXT PRIMARY KEY,
	data TEXT NOT NULL,
	created TIMESTAMPTZ NOT NULL
);

CREATE TYPE person_role AS ENUM('customer', 'admin');
CREATE TABLE person (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT UNIQUE NOT NULL,
	password TEXT NOT NULL,
	role person_role NOT NULL,
	created TIMESTAMPTZ NOT NULL
);

CREATE TABLE household (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	created TIMESTAMPTZ NOT NULL
);

CREATE TYPE household_member_role AS ENUM('member', 'founder');
CREATE TABLE household_member (
	household_id INTEGER REFERENCES household(id) NOT NULL,
	person_id INTEGER REFERENCES person(id) NOT NULL,
	role household_member_role NOT NULL,
	created TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON household_member(household_id);
CREATE INDEX ON household_member(person_id);
CREATE UNIQUE INDEX ON household_member(household_id, person_id);

CREATE TABLE household_invitation (
	household_id INTEGER REFERENCES household(id) NOT NULL,
	from_person_id INTEGER REFERENCES person(id) NOT NULL,
	to_person_id INTEGER REFERENCES person(id) NOT NULL,
	created TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON household_invitation(household_id);
CREATE INDEX ON household_invitation(from_person_id);
CREATE INDEX ON household_invitation(to_person_id);
CREATE UNIQUE INDEX ON household_invitation(to_person_id, household_id);