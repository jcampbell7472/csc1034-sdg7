
-- Report 1: main non renewable contributers by region
-- Report title: Main non renewable contributers by region
-- Business question: What regions are the main non renewable contributers per year?

-- Why is this report useful: Identify what regions are mainly non renewable based that must be improved
-- in order to reach carbon emission goals

-- Tables used: RegionalGenerationRecord, Region, EnergySource, EnergyCategory

CREATE VIEW vw_greatestFossilRegions AS
SELECT
    CONCAT(rgr.year, ' ', r.RegionName) AS RegionYear,
    SUM(CASE WHEN ec.IsRenewable = 0 THEN rgr.Generation_GWh END) as TotalGWh
FROM RegionalGenerationRecord rgr
INNER JOIN Region r ON rgr.RegionID = r.RegionID
INNER JOIN EnergySource es ON rgr.SourceID = es.SourceID
INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
GROUP BY RegionName, rgr.year
HAVING SUM(CASE WHEN ec.IsRenewable = 0 THEN rgr.Generation_GWh END) > SUM(CASE WHEN ec.IsRenewable = 1 THEN rgr.Generation_GWh END)
ORDER BY rgr.year


SELECT * FROM vw_greatestFossilRegions

-- Report 2: Energy difference for renewable and non renewable per region
-- Report title: Energy difference of renewable and non renewable sources per region
-- Business question: What is the difference in power output between renewables
-- non renewables by percentage

-- Why is this report is useful: Allows analaysts to compare the output of renewable sources
-- to non renewable sources in the form of a percentage relative to the ouput of non renewables

-- Tables used: RegionalGenerationRecord, Region, EnergySource, EnergyCategory

CREATE VIEW vw_RegionalEnergyDifference AS
SELECT
    CONCAT(rgr.year, ' ', r.RegionName) AS RegionYear,
    ROUND(SUM(
            CASE 
                WHEN ec.IsRenewable = 1 THEN rgr.Generation_GWh
                ELSE 0
            END
    ) / SUM(CASE 
                WHEN ec.IsRenewable = 0 THEN rgr.Generation_GWh 
                ELSE 0
            END) * 100, 2) AS RenewablePercentDiff
FROM RegionalGenerationRecord rgr
INNER JOIN Region r ON rgr.RegionID = r.RegionID
INNER JOIN EnergySource es ON rgr.SourceID = es.SourceID
INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
GROUP BY RegionName, rgr.year
HAVING RenewablePercentDiff != 0.00
ORDER BY rgr.year DESC;

SELECT * FROM vw_RegionalEnergyDifference

-- Report 3: Generation of wind and solar per year
-- Report title: Generation of wind and solar per year
-- Business question: How much power have wind and solar produced each year?

-- Why this report is useful: With the rapid reduction in cost in wind and solar,
-- it can be useful to track if the reduced cost would be worth investment based on
-- their generation

-- Tables used: EnergySource, GenerationRecord

SELECT
    CONCAT(gr.Year, ' ', es.SourceName) AS YearSource,
    gr.Generation_GWh
FROM GenerationRecord gr
LEFT JOIN EnergySource es ON gr.SourceID = es.SourceID
WHERE es.SourceName IN ('Solar', 'Wind')
ORDER BY gr.Year, es.SourceName DESC;

