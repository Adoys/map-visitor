USE map_visitor;

CREATE INDEX idx_languages_code ON company_languages (code);
CREATE INDEX idx_languages_default ON company_languages (is_default);
