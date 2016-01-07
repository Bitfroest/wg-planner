CREATE TABLE shopping_list_receipt (
	shopping_list_id INTEGER REFERENCES shopping_list(id) NOT NULL,
  file TEXT NOT NULL,
	created TIMESTAMPTZ NOT NULL,
  status INTEGER NOT NULL
);
CREATE INDEX ON shopping_list_receipt(shopping_list_id);
