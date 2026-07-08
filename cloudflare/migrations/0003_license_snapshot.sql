-- Migration 0003: Farm-level license snapshot
-- Stores the local license state (tier, modules, profile, capacity, paid
-- status, expiry) at the FARM level in D1, so that signing in on a new or
-- cache-cleared device can restore an already-activated license instead of
-- re-running the entire plan-selection/profile onboarding flow. Previously
-- this data only ever lived in each device's local browser storage.

ALTER TABLE farms ADD COLUMN license_snapshot TEXT;
