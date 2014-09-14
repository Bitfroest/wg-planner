DROP FUNCTION IF EXISTS household_debts_summary (INTEGER);
DROP FUNCTION IF EXISTS household_debts_matrix (INTEGER);
DROP FUNCTION IF EXISTS is_household_member (INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_household_id_by_shopping_item_id (INTEGER);
DROP FUNCTION IF EXISTS get_household_id_by_shopping_list_id (param_shopping_list_id INTEGER);

DROP TABLE IF EXISTS shopping_item CASCADE;
DROP TABLE IF EXISTS shopping_list CASCADE;

DROP TABLE IF EXISTS household_invitation CASCADE;
DROP TABLE IF EXISTS household_member CASCADE;
DROP TYPE IF EXISTS household_member_role CASCADE;
DROP TABLE IF EXISTS household CASCADE;

DROP TABLE IF EXISTS person CASCADE;
DROP TYPE IF EXISTS person_role CASCADE;

DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS dbinfo CASCADE;