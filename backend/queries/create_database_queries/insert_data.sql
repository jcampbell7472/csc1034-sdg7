USE energy_monitoring;

-- Insert Energy Categories, these are never changed
INSERT INTO EnergyCategory (CategoryName, IsRenewable)
VALUES
('Renewable', 1),
('Non-Renewable', 0);

-- Insert renewable Energy Sources, these are constant too
INSERT INTO EnergySource (SourceName, CategoryID)
VALUES
('Solar', 1),
('Wind', 1),
('Hydro', 1),
('Geothermal', 1),
('Biomass', 1);

-- Insert non-renewable Energy Sources, also constant
INSERT INTO EnergySource (SourceName, CategoryID)
VALUES
('Natural Gas', 2),
('Coal', 2),
('Oil', 2),
('Nuclear', 2),
('Diesel', 2);

-- Insert regions
INSERT INTO Region (RegionName)
VALUES
('England'),
('Scotland'),
('Wales'),
('Northern Ireland');

-- Add rows for GenerationRecord (SourceID, Year, Generation_GWh)

-- Add rows for RegionalGenerationRecord (RegionID, SourceID, Year, Generation_GWh)

-- Add rows for AnnualEmissionsRecord (Year, EMISSIONS_MtCO2e)
