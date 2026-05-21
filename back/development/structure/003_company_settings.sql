USE map_visitor;

CREATE TABLE company_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,

    phone VARCHAR(50) NULL,
    phone_is_whatsapp BOOLEAN NULL,

    email VARCHAR(255) NULL,

    background_color VARCHAR(50) NULL,
    header_color VARCHAR(50) NULL,
    button_color VARCHAR(50) NULL,

    logo_url TEXT NULL,
    logo_base64 LONGTEXT NULL,

    map_image_url TEXT NULL,
    map_image_base64 LONGTEXT NULL,

    info_marker_icon_url TEXT NULL,
    info_marker_icon_base64 LONGTEXT NULL,

    tourist_marker_icon_url TEXT NULL,
    tourist_marker_icon_base64 LONGTEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
