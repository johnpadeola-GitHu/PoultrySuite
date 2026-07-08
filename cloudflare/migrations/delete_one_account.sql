-- Delete everything for johnpadeola@agorox.africa specifically, in
-- dependency order (children before parents).

DELETE FROM farm_records WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm JOIN users u ON u.id = fm.user_id
  WHERE u.email = 'johnpadeola@agorox.africa'
);
DELETE FROM devices WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm JOIN users u ON u.id = fm.user_id
  WHERE u.email = 'johnpadeola@agorox.africa'
);
DELETE FROM subscriptions WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm JOIN users u ON u.id = fm.user_id
  WHERE u.email = 'johnpadeola@agorox.africa'
);
DELETE FROM batches WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm JOIN users u ON u.id = fm.user_id
  WHERE u.email = 'johnpadeola@agorox.africa'
);
DELETE FROM pairing_codes WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm JOIN users u ON u.id = fm.user_id
  WHERE u.email = 'johnpadeola@agorox.africa'
);
DELETE FROM payments WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm JOIN users u ON u.id = fm.user_id
  WHERE u.email = 'johnpadeola@agorox.africa'
);
DELETE FROM support_tickets WHERE farm_id IN (
  SELECT fm.farm_id FROM farm_members fm JOIN users u ON u.id = fm.user_id
  WHERE u.email = 'johnpadeola@agorox.africa'
);
DELETE FROM farms WHERE id IN (
  SELECT fm.farm_id FROM farm_members fm JOIN users u ON u.id = fm.user_id
  WHERE u.email = 'johnpadeola@agorox.africa'
);
DELETE FROM farm_members WHERE user_id IN (
  SELECT id FROM users WHERE email = 'johnpadeola@agorox.africa'
);
DELETE FROM profiles WHERE id IN (
  SELECT id FROM users WHERE email = 'johnpadeola@agorox.africa'
);
DELETE FROM platform_admins WHERE user_id IN (
  SELECT id FROM users WHERE email = 'johnpadeola@agorox.africa'
);
DELETE FROM users WHERE email = 'johnpadeola@agorox.africa';
