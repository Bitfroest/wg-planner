-- New total debts function for a single person in a household
CREATE OR REPLACE FUNCTION household_my_total(param_household_id INTEGER, param_person_id INTEGER)
RETURNS BIGINT AS $$

	WITH items AS (
		SELECT owner_person_id AS owner_id, buyer_person_id AS buyer_id, price
		FROM shopping_list l
		JOIN shopping_item i ON (i.shopping_list_id = l.id)
		WHERE l.household_id = $1 AND owner_person_id != buyer_person_id
	)
	SELECT coalesce(
			(SELECT sum(price) AS sum
			FROM items
			WHERE buyer_id = $2), 0)
		- coalesce(
			(SELECT sum(price) AS sum
			FROM items
			WHERE owner_id = $2), 0)

$$ LANGUAGE SQL STABLE;