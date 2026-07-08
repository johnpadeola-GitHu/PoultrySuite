-- Cleanup: remove every account except support@agorox.africa, and every
-- farm/record exclusively belonging to those accounts. Deletes in
-- dependency order (children before parents) so nothing is orphaned,
-- rather than relying on D1's cascade behavior being enabled.

-- Farms owned by anyone OTHER than support@agorox.africa, and not also
-- shared with support@agorox.africa (defensive — in practice each test
-- account has its own separate farm).
-- Step 1: farm_records
DELETE FROM farm_records WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm
  JOIN users u ON u.id = fm.user_id
  WHERE u.email != 'support@agorox.africa'
  AND fm.farm_id NOT IN (
    SELECT fm2.farm_id FROM farm_members fm2
    JOIN users u2 ON u2.id = fm2.user_id
    WHERE u2.email = 'support@agorox.africa'
  )
);

-- Step 2: devices
DELETE FROM devices WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm
  JOIN users u ON u.id = fm.user_id
  WHERE u.email != 'support@agorox.africa'
  AND fm.farm_id NOT IN (
    SELECT fm2.farm_id FROM farm_members fm2
    JOIN users u2 ON u2.id = fm2.user_id
    WHERE u2.email = 'support@agorox.africa'
  )
);

-- Step 3: subscriptions
DELETE FROM subscriptions WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm
  JOIN users u ON u.id = fm.user_id
  WHERE u.email != 'support@agorox.africa'
  AND fm.farm_id NOT IN (
    SELECT fm2.farm_id FROM farm_members fm2
    JOIN users u2 ON u2.id = fm2.user_id
    WHERE u2.email = 'support@agorox.africa'
  )
);

-- Step 4: batches
DELETE FROM batches WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm
  JOIN users u ON u.id = fm.user_id
  WHERE u.email != 'support@agorox.africa'
  AND fm.farm_id NOT IN (
    SELECT fm2.farm_id FROM farm_members fm2
    JOIN users u2 ON u2.id = fm2.user_id
    WHERE u2.email = 'support@agorox.africa'
  )
);

-- Step 5: pairing_codes for those farms
DELETE FROM pairing_codes WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm
  JOIN users u ON u.id = fm.user_id
  WHERE u.email != 'support@agorox.africa'
  AND fm.farm_id NOT IN (
    SELECT fm2.farm_id FROM farm_members fm2
    JOIN users u2 ON u2.id = fm2.user_id
    WHERE u2.email = 'support@agorox.africa'
  )
);

-- Step 5b: payments for those farms
DELETE FROM payments WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm
  JOIN users u ON u.id = fm.user_id
  WHERE u.email != 'support@agorox.africa'
  AND fm.farm_id NOT IN (
    SELECT fm2.farm_id FROM farm_members fm2
    JOIN users u2 ON u2.id = fm2.user_id
    WHERE u2.email = 'support@agorox.africa'
  )
);

-- Step 5c: support_tickets for those farms
DELETE FROM support_tickets WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm
  JOIN users u ON u.id = fm.user_id
  WHERE u.email != 'support@agorox.africa'
  AND fm.farm_id NOT IN (
    SELECT fm2.farm_id FROM farm_members fm2
    JOIN users u2 ON u2.id = fm2.user_id
    WHERE u2.email = 'support@agorox.africa'
  )
);

-- Step 6: the farms themselves
DELETE FROM farms WHERE id IN (
  SELECT fm.farm_id FROM farm_members fm
  JOIN users u ON u.id = fm.user_id
  WHERE u.email != 'support@agorox.africa'
  AND fm.farm_id NOT IN (
    SELECT fm2.farm_id FROM farm_members fm2
    JOIN users u2 ON u2.id = fm2.user_id
    WHERE u2.email = 'support@agorox.africa'
  )
);

-- Step 7: farm_members rows for users being removed
DELETE FROM farm_members WHERE user_id IN (
  SELECT id FROM users WHERE email != 'support@agorox.africa'
);

-- Step 8: profiles for users being removed
DELETE FROM profiles WHERE id IN (
  SELECT id FROM users WHERE email != 'support@agorox.africa'
);

-- Step 9: platform_admins rows for users being removed (defensive; should
-- already be empty since only support@agorox.africa was ever granted this)
DELETE FROM platform_admins WHERE user_id IN (
  SELECT id FROM users WHERE email != 'support@agorox.africa'
);

-- Step 10: the users themselves
DELETE FROM users WHERE email != 'support@agorox.africa';
