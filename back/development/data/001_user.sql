USE map_visitor;

INSERT INTO Users (user_id, password, email, role)
VALUES (
  'admin',
  '$2b$10$.aEAdoXWA1YRQ15ICqC2CenJ4vr3OciNMdFlSmDcA7RvUrB2RAkdy', -- Contraseña: admin123
  'admin@admin.com',
  'ADMIN'
);