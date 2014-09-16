-- new functions for shorter queries in code

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
