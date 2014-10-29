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
