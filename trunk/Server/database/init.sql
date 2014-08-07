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

CREATE TABLE shopping_list (
	id SERIAL PRIMARY KEY,
	shop_name TEXT NOT NULL,
	household_id INTEGER REFERENCES household(id) NOT NULL,
	buyer_person_id INTEGER REFERENCES person(id) NOT NULL,
	creator_person_id INTEGER REFERENCES person(id) NOT NULL,
	shopped TIMESTAMPTZ NOT NULL,
	created TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON shopping_list(household_id);
CREATE INDEX ON shopping_list(buyer_person_id);

CREATE TABLE shopping_item (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	shopping_list_id INTEGER REFERENCES shopping_list(id) NOT NULL,
	owner_person_id INTEGER REFERENCES person(id) NOT NULL,
	price INTEGER NOT NULL,
	barcode TEXT
);
CREATE INDEX ON shopping_item(shopping_list_id);
CREATE INDEX ON shopping_item(owner_person_id);

CREATE FUNCTION household_debts_matrix (param_household_id INTEGER)
RETURNS TABLE(owner INTEGER, buyer INTEGER, total BIGINT) AS $$
    WITH members AS (
		SELECT person_id AS id FROM household_member WHERE household_id = param_household_id
	),
	nullmatrix AS (
		SELECT a.id AS owner, b.id AS buyer, 0 AS total FROM members a, members b
	),
	actualmatrix AS (
		SELECT owner_person_id AS owner, buyer_person_id AS buyer, sum(price) AS total
		FROM shopping_list l
		JOIN shopping_item i ON (i.shopping_list_id = l.id) 
		WHERE l.household_id = param_household_id
		GROUP BY i.owner_person_id, l.buyer_person_id
	)
	SELECT n.owner AS owner, n.buyer AS buyer, coalesce(a.total, 0) AS total
	FROM nullmatrix n LEFT JOIN actualmatrix a ON (n.buyer=a.buyer AND n.owner=a.owner)
	ORDER BY owner ASC, buyer ASC
$$ LANGUAGE SQL;