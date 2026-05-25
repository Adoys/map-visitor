USE map_visitor;

CREATE TABLE IF NOT EXISTS map_point_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  map_point_id INT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  alt_text VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_map_point_images_point_order (map_point_id, sort_order),
  CONSTRAINT fk_map_point_images_point_id
    FOREIGN KEY (map_point_id) REFERENCES map_points(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS map_point_translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  map_point_id INT NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description_html LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_map_point_translations_point_language (map_point_id, language_code),
  INDEX idx_map_point_translations_language (language_code),
  CONSTRAINT fk_map_point_translations_point_id
    FOREIGN KEY (map_point_id) REFERENCES map_points(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
