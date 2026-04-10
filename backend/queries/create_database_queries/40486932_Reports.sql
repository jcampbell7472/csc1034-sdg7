-- Matthew Rollo 3 SQL Reports

USE energy_monitoring;


-- Report 1: Top Energy Sources by National Generation (2024)
-- Report Title: Top Energy Sources by National Generation
-- Business Question: Which energy sources generated the most electricity in 2024,
-- and are they renewable or non-renewable?
-- Why this report is useful: Identifies the dominant sources in the UK energy mix,
-- helping analysts understand which technologies are driving
-- generation and whether the mix is shifting towards renewables.
-- Tables used: GenerationRecord, EnergySource, EnergyCategory

CREATE VIEW vw_TopSourcesByGeneration AS
SELECT
    es.SourceName,
    ec.CategoryName,
    ec.IsRenewable,
    SUM(gr.Generation_GWh) AS TotalGeneration_GWh,
    ROUND(
        SUM(gr.Generation_GWh) * 100.0 /
        (SELECT SUM(g2.Generation_GWh) FROM GenerationRecord g2 WHERE g2.Year = 2024),
    2) AS ShareOfTotal_Pct
FROM GenerationRecord gr
INNER JOIN EnergySource es ON gr.SourceID = es.SourceID
INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
WHERE gr.Year = 2024
    AND gr.Generation_GWh > 0
GROUP BY es.SourceName, ec.CategoryName, ec.IsRenewable
ORDER BY TotalGeneration_GWh DESC
LIMIT 10;

SELECT * FROM vw_TopSourcesByGeneration;


-- Report 2: Regions With No Recorded Generation for Each Source
-- Report Title: Regional Generation Coverage Gaps
-- Business Question: Which regions have no recorded generation data for a given
-- energy source in the most recent year?
-- Why this report is useful: Highlights gaps in regional data coverage, allowing
-- analysts to identify where generation is either absent
-- or simply not recorded — useful for data quality checks
-- and identifying regions not yet using certain energy sources.
-- Tables used: RegionEnergySource, Region, EnergySource, RegionalGenerationRecord

SELECT
    r.RegionName,
    es.SourceName,
    ec.CategoryName,
    CASE
        WHEN rgr.Generation_GWh IS NULL THEN 'No Data'
        ELSE 'Recorded'
    END AS DataStatus
FROM RegionEnergySource res
INNER JOIN Region r ON res.RegionID = r.RegionID
INNER JOIN EnergySource es ON res.SourceID = es.SourceID
INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
LEFT JOIN RegionalGenerationRecord rgr
    ON res.RegionID = rgr.RegionID
    AND res.SourceID = rgr.SourceID
    AND rgr.Year = 2024
WHERE rgr.Generation_GWh IS NULL
ORDER BY r.RegionName, es.SourceName;


-- Report 3: Year-on-Year Change in National Generation by Source
-- Report Title: Year-on-Year Generation Change by Energy Source
-- Business Question: How has electricity generation from each energy source
-- changed between 2023 and 2024?
-- Why this report is useful: Tracks momentum in the energy transition by showing
-- which sources are growing and which are declining.
-- Large positive changes in renewables or large negative
-- changes in fossil fuels indicate progress towards net zero.
-- Tables used: GenerationRecord, EnergySource, EnergyCategory

SELECT
    es.SourceName,
    ec.CategoryName,
    prev.Generation_GWh AS Generation_2023_GWh,
    curr.Generation_GWh AS Generation_2024_GWh,
    ROUND(curr.Generation_GWh - prev.Generation_GWh, 2) AS Change_GWh,
    ROUND(
        (curr.Generation_GWh - prev.Generation_GWh) * 100.0 / NULLIF(prev.Generation_GWh, 0),
    2) AS PercentChange
FROM GenerationRecord curr
INNER JOIN GenerationRecord prev
    ON curr.SourceID = prev.SourceID
    AND curr.Year = 2024
    AND prev.Year = 2023
INNER JOIN EnergySource es ON curr.SourceID = es.SourceID
INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
ORDER BY Change_GWh DESC;