-- New debts summary function called "My debts"

CREATE OR REPLACE FUNCTION household_debts_summary (param_household_id INTEGER, param_person_id INTEGER)
RETURNS TABLE(id INTEGER, name TEXT, diff BIGINT) AS $$

	WITH combined_items AS (
		SELECT owner_person_id AS owner, buyer_person_id AS buyer, sum(price) AS total
		FROM shopping_list l
		JOIN shopping_item i ON (i.shopping_list_id = l.id) 
		WHERE l.household_id = $1 AND owner_person_id != buyer_person_id AND (owner_person_id = $2 OR buyer_person_id = $2)
		GROUP BY i.owner_person_id, l.buyer_person_id
	),
	bought_items AS (
		SELECT owner, total
		FROM combined_items
		WHERE buyer = $2
	),
	owned_items AS (
		SELECT buyer, total
		FROM combined_items
		WHERE owner = $2
	),
	members AS (
		SELECT m.person_id AS id, p.name AS name
		FROM household_member m
		JOIN person p ON (m.person_id = p.id)
		WHERE m.household_id = $1 AND m.person_id != $2
	)
	SELECT id, name,coalesce(bi.total, 0) - coalesce(oi.total, 0) AS diff
	FROM members m
	LEFT JOIN bought_items bi ON (m.id = bi.owner)
	LEFT JOIN owned_items oi ON (m.id = oi.buyer)

$$ LANGUAGE SQL STABLE ROWS 5;
