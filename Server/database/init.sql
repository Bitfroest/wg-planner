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

CREATE TYPE notification_data_type AS ENUM (
	'new_household_member',
	'deleted_household_member',
	'new_household_invitation',
	'new_shopping_list'
);

CREATE TABLE notification_data (
	id SERIAL PRIMARY KEY,
	created TIMESTAMPTZ NOT NULL,
	type notification_data_type NOT NULL,
	data TEXT NOT NULL
);

CREATE TABLE notification (
	recipient_person_id INTEGER REFERENCES person(id) NOT NULL,
	notification_data_id INTEGER REFERENCES notification_data(id) NOT NULL,
	read BOOLEAN NOT NULL DEFAULT FALSE,
	PRIMARY KEY (recipient_person_id, notification_data_id)
);
CREATE INDEX ON notification(recipient_person_id);
CREATE INDEX ON notification(notification_data_id);

CREATE FUNCTION household_debts_matrix (param_household_id INTEGER)
RETURNS TABLE(owner INTEGER, buyer INTEGER, total BIGINT) AS $$
    WITH members AS (
		SELECT person_id AS id FROM household_member WHERE household_id = $1
	),
	nullmatrix AS (
		SELECT a.id AS owner, b.id AS buyer, 0 AS total FROM members a, members b
	),
	actualmatrix AS (
		SELECT owner_person_id AS owner, buyer_person_id AS buyer, sum(price) AS total
		FROM shopping_list l
		JOIN shopping_item i ON (i.shopping_list_id = l.id) 
		WHERE l.household_id = $1
		GROUP BY i.owner_person_id, l.buyer_person_id
	)
	SELECT n.owner AS owner, n.buyer AS buyer, coalesce(a.total, 0) AS total
	FROM nullmatrix n LEFT JOIN actualmatrix a ON (n.buyer=a.buyer AND n.owner=a.owner)
	ORDER BY owner ASC, buyer ASC
$$ LANGUAGE SQL STABLE ROWS 25;

CREATE FUNCTION household_debts_summary (param_household_id INTEGER)
RETURNS TABLE(id INTEGER, outgoing BIGINT, incoming BIGINT, diff BIGINT) AS $$
	WITH items AS (
		SELECT owner_person_id AS owner_id, buyer_person_id AS buyer_id, price
		FROM shopping_list l
		JOIN shopping_item i ON (i.shopping_list_id = l.id)
		WHERE l.household_id = $1 AND owner_person_id != buyer_person_id
	),
	owners AS (
		SELECT owner_id AS id, sum(price) AS sum
		FROM items
		GROUP BY owner_id
	),
	buyers AS (
		SELECT buyer_id AS id, sum(price) AS sum
		FROM items
		GROUP BY buyer_id
	),
	members AS (
		SELECT person_id AS id FROM household_member WHERE household_id = $1
	)
	SELECT m.id AS id, coalesce(b.sum, 0) AS outgoing, coalesce(o.sum, 0) AS incoming, coalesce(b.sum, 0) - coalesce(o.sum, 0) AS diff
	FROM members m LEFT JOIN buyers b ON (m.id=b.id) LEFT JOIN owners o ON (m.id = o.id)
	ORDER BY m.id ASC
$$ LANGUAGE SQL STABLE ROWS 5;

CREATE FUNCTION is_household_member (param_household_id INTEGER, param_person_id INTEGER)
RETURNS BOOLEAN AS $$
	SELECT EXISTS (
		SELECT 1 FROM household_member
		WHERE household_id = $1 AND person_id = $2
		LIMIT 1
	)
$$ LANGUAGE SQL STABLE;

CREATE FUNCTION get_household_id_by_shopping_item_id (param_shopping_item_id INTEGER)
RETURNS INTEGER AS $$
	SELECT l.household_id
	FROM shopping_item i
	JOIN shopping_list l ON (i.shopping_list_id = l.id)
	WHERE i.id = $1
$$ LANGUAGE SQL STABLE;

CREATE FUNCTION get_household_id_by_shopping_list_id (param_shopping_list_id INTEGER)
RETURNS INTEGER AS $$
	SELECT household_id
	FROM shopping_list
	WHERE id = $1
$$ LANGUAGE SQL STABLE;

-- notification trigger

CREATE OR REPLACE FUNCTION notification_new_household_member()
RETURNS trigger
AS
$$
DECLARE
	not_data_id INTEGER;
BEGIN
	INSERT INTO notification_data(created, type, data)
	VALUES (NEW.created, 'new_household_member', NEW.household_id::text || '|' || NEW.person_id::text)
	RETURNING id INTO not_data_id;

	INSERT INTO notification(recipient_person_id, notification_data_id)
	SELECT m.person_id, not_data_id FROM household_member m
	WHERE m.household_id = NEW.household_id AND m.person_id != NEW.person_id;

	RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_household_member
AFTER INSERT ON household_member FOR EACH ROW
EXECUTE PROCEDURE notification_new_household_member();

CREATE OR REPLACE FUNCTION notification_deleted_household_member()
RETURNS trigger
AS
$$
DECLARE
	not_data_id INTEGER;
BEGIN
	INSERT INTO notification_data(created, type, data)
	VALUES (now(), 'deleted_household_member', OLD.household_id::text || '|' || OLD.person_id::text)
	RETURNING id INTO not_data_id;

	INSERT INTO notification(recipient_person_id, notification_data_id)
	SELECT m.person_id, not_data_id FROM household_member m
	WHERE m.household_id = OLD.household_id;

	RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER trigger_deleted_household_member
AFTER DELETE ON household_member FOR EACH ROW
EXECUTE PROCEDURE notification_deleted_household_member();

CREATE OR REPLACE FUNCTION notification_new_household_invitation()
RETURNS trigger
AS
$$
DECLARE
	not_data_id INTEGER;
BEGIN
	INSERT INTO notification_data(created, type, data)
	VALUES (NEW.created, 'new_household_invitation', NEW.household_id::text || '|' || NEW.from_person_id::text)
	RETURNING id INTO not_data_id;

	INSERT INTO notification(recipient_person_id, notification_data_id)
	VALUES (NEW.to_person_id, not_data_id);

	RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_household_invitation
AFTER INSERT ON household_invitation
FOR EACH ROW EXECUTE PROCEDURE notification_new_household_invitation();

CREATE OR REPLACE FUNCTION notification_new_shopping_list()
RETURNS trigger
AS
$$
DECLARE
	not_data_id INTEGER;
BEGIN
	INSERT INTO notification_data(created, type, data)
	VALUES (NEW.created, 'new_shopping_list', NEW.household_id::text || '|' || NEW.id::text || '|' || NEW.creator_person_id::text)
	RETURNING id INTO not_data_id;

	INSERT INTO notification(recipient_person_id, notification_data_id)
	SELECT m.person_id, not_data_id FROM household_member m
	WHERE m.household_id = NEW.household_id AND m.person_id != NEW.creator_person_id;

	RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_shopping_list
AFTER INSERT ON shopping_list
FOR EACH ROW EXECUTE PROCEDURE notification_new_shopping_list();
