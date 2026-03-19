CREATE TABLE EnergySources (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(50) NOT NULL UNIQUE,
    renewable_category VARCHAR(50)
);

INSERT INTO EnergySources (source_name, renewable_category)
VALUES
('Solar', 'Renewable'),
('Wind', 'Renewable'),
('Hydro', 'Renewable'),
('Geothermal', 'Renewable'),
('Biomass', 'Renewable');