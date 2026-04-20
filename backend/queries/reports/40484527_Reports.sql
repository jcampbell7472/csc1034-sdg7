-- Jake Campbell 40484527
-- 3 SQL Reports

-- Report 1: Renewable Generation Progress Toward 2030 Target
-- Business Question: How is the UK's renewable generation percentage trending
--   against the 2030 clean power target of 95%?
-- Why this report is useful: Shows whether the UK is on track to meet its 2030
--   clean energy target by comparing actual renewable share each year against the goal.
-- Tables used: GenerationRecord, EnergySource, EnergyCategory, EnergyEmissionsTarget
CREATE VIEW vw_RenewableProgressTo2030 AS
SELECT
    gr.Year,
    ROUND(
        SUM(CASE WHEN ec.IsRenewable = 1 THEN gr.Generation_GWh ELSE 0 END) * 100.0
        / SUM(gr.Generation_GWh)
    , 2) AS RenewablePct,
    (SELECT RenewableTarget_Pct FROM EnergyEmissionsTarget WHERE TargetYear = 2030) AS Target_2030_Pct
FROM GenerationRecord gr
INNER JOIN EnergySource es ON gr.SourceID = es.SourceID
INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
GROUP BY gr.Year
ORDER BY gr.Year;
SELECT * FROM vw_RenewableProgressTo2030;

-- Report 2: Regional Contribution to National Generation by Source
-- Business Question: For each energy source, how much does each UK region
--   contribute to the national total?
-- Why this report is useful: Identifies which regions are driving generation
--   for each source, useful for targeting regional investment.
-- Tables used: RegionalGenerationRecord, GenerationRecord, Region, EnergySource
CREATE VIEW vw_RegionalContribution AS
SELECT
    r.RegionName,
    es.SourceName,
    ROUND(SUM(rgr.Generation_GWh), 2) AS RegionalGeneration_GWh,
    ROUND(
        SUM(rgr.Generation_GWh) * 100.0
        / (SELECT SUM(gr.Generation_GWh) FROM GenerationRecord gr WHERE gr.SourceID = rgr.SourceID)
    , 2) AS ContributionPct
FROM RegionalGenerationRecord rgr
INNER JOIN Region r ON rgr.RegionID = r.RegionID
INNER JOIN EnergySource es ON rgr.SourceID = es.SourceID
GROUP BY r.RegionName, es.SourceName, rgr.SourceID
ORDER BY es.SourceName, ContributionPct DESC;
SELECT * FROM vw_RegionalContribution;

-- Report 3: Year-on-Year Emissions Reduction
-- Business Question: How much have UK carbon emissions fallen each year,
--   and is the rate of reduction improving?
-- Why this report is useful: Shows whether the UK is accelerating or slowing
--   its emissions reduction, which is key to assessing net zero progress.
-- Tables used: AnnualEmissionsRecord
SELECT
    curr.Year,
    curr.EMISSIONS_MtCO2e AS Emissions_MtCO2e,
    prev.EMISSIONS_MtCO2e AS PrevYear_MtCO2e,
    ROUND(prev.EMISSIONS_MtCO2e - curr.EMISSIONS_MtCO2e, 3) AS Reduction_MtCO2e
FROM AnnualEmissionsRecord curr
INNER JOIN AnnualEmissionsRecord prev ON curr.Year = prev.Year + 1
ORDER BY curr.Year;