-- New total debts function for a single person in a household
CREATE OR REPLACE FUNCTION household_my_total(param_household_id INTEGER, param_person_id INTEGER)
RETURNS BIGINT AS $$

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
		SELECT param_person_id AS id 
	)
	SELECT coalesce(b.sum, 0) - coalesce(o.sum, 0) AS diff
	FROM members m LEFT JOIN buyers b ON (m.id=b.id) LEFT JOIN owners o ON (m.id = o.id)

$$ LANGUAGE SQL STABLE;