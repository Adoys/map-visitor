USE map_visitor;

INSERT INTO company_languages (code, name, flag, is_default, company_settings_id)
VALUES 
    ('es', 'Español', '+8PIO/II1SY2efx/eHk2efx/eHkDyBUmNnn8f3h5Nnn8f3h5A8gVJjZ5/H94eTZ5/H94eQPIFSY2efx/eHk2efx/eHkDyBUmNnn8f3h5Nnn8f3h5A8gVJjZ5/H94eTZ5/H94eQPIFSY2efx/eHk2efx/eHkDyBUmNnn8f3h5Nnn8f3h5A8gVJjZ5/H94eTZ5/H94eQPIFSY2efx/eHk2efx/eHkDyBUmNnn8f3h5APIFSZ//Z', true,  (SELECT id FROM company_settings LIMIT 1)),
    ('en', 'English',   NULL, false, (SELECT id FROM company_settings LIMIT 1)),
    ('fr', 'Français',  NULL, false, (SELECT id FROM company_settings LIMIT 1));
