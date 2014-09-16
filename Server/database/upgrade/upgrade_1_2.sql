-- fixed bug in function: LEFT JOIN condition was wrong

DROP FUNCTION household_debts_summary(INTEGER);

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
$$ LANGUAGE SQL;