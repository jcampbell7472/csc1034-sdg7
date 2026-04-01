-- Report title: Renewable vs Non Renewable generation per year
-- Business question: Is the United kingdom increasing its renewable energy generation percentage over time?
-- Why this report is useful: Tracks the UKs yearly progress towards clean energy generation.
-- Tables used: GenerationRecord, EnergySource, EnergyCategory

CREATE VIEW vw_RenewableShareByYear AS
SELECT gr.Year, ec.CategoryName, SUM(gr.Generation_GWh) AS TotalGeneration_GWh,
ROUND(SUM(gr.Generation_GWh) * 100.0 / (SELECT SUM(g2.Generation_GWh) FROM GenerationRecord g2 WHERE g2.Year = gr.Year), 2) AS Percentage
FROM GenerationRecord gr
INNER JOIN EnergySource es ON gr.SourceID = es.SourceID
INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
GROUP BY gr.Year, ec.CategoryName
HAVING TotalGeneration_GWh > 0
ORDER BY gr.Year;
SELECT * FROM vw_RenewableShareByYear;

-- Report title: Renewable energy generation by region and source
-- Business question: Which regions and energy sources are contributing the most to renewable generation?
-- Why this report is useful: Identifies which uk regions and energy sources are driving renewable generation
-- Tables used: RegionalGenerationRecord, Region, EnergySource, EnergyCategory

SELECT r.RegionName, es.SourceName, ROUND(SUM(rgr.Generation_GWh), 2) AS TotalGeneration_GWh
FROM RegionalGenerationRecord rgr
INNER JOIN Region r ON rgr.RegionID = r.RegionID
INNER JOIN EnergySource es ON rgr.SourceID = es.SourceID
INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
WHERE rgr.Year = 2023 AND ec.IsRenewable = 1
GROUP BY r.RegionName, es.SourceName
HAVING TotalGeneration_GWh > 0
ORDER BY TotalGeneration_GWh DESC
LIMIT 10;

-- Report title: Actual emissions vs targets over time
-- Business question: How is the UK tracking against its emissions reduction targets
-- Why this report is useful: Showcases whether the UKs carbon emissions are on track to meet their progress goals
-- Tables used: AnnualEmissionsRecord, EnergyEmissionsTarget

SELECT aer.Year, aer.EMISSIONS_MtCO2e AS ActualEmissions, eet.EmissionsTarget_MtCO2e AS TargetEmissions, eet.RenewableTarget_Pct AS RenewableTarget
ROUND(aer.EMISSIONS_MtCO2e - eet.EmissionsTarget_MtCO2e, 2) AS DifferenceFromTarget
FROM AnnualEmissionsRecord aer
LEFT JOIN EnergyEmissionsTarget eet ON aer.Year = eet.TargetYear
ORDER BY aer.Year;