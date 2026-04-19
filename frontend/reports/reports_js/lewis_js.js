const showMessage = (elementId, text, type) => {
    const output = document.querySelector(`#${elementId}`);
    output.textContent = text;
    output.className = type;
};

// Report 1, renewable vs non renewable share by year including percentage share
const loadReport1 = async () => {
    const sql = `SELECT gr.Year, ec.CategoryName, 
        ROUND(SUM(gr.Generation_GWh), 2) AS TotalGeneration_GWh,
        ROUND(SUM(gr.Generation_GWh) * 100.0 / (SELECT SUM(g2.Generation_GWh) FROM GenerationRecord g2 WHERE g2.Year = gr.Year), 2) AS Percentage
        FROM GenerationRecord gr
        INNER JOIN EnergySource es ON gr.SourceID = es.SourceID
        INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
        GROUP BY gr.Year, ec.CategoryName
        HAVING TotalGeneration_GWh > 0
        ORDER BY gr.Year`;

    const response = await fetch("../dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();
    const tbody = document.querySelector("#report1Body");
    tbody.innerHTML = "";

    for (const row of result.data) {
        tbody.innerHTML += `<tr>
            <td>${row.Year}</td>
            <td>${row.CategoryName}</td>
            <td>${row.TotalGeneration_GWh}</td>
            <td>${row.Percentage}%</td>
        </tr>`;
    }

    buildChart1(result.data);
};

const buildChart1 = (data) => {
    const years = [];
    const renewable = [];
    const nonRenewable = [];

    for (const row of data) {
        if (!years.includes(row.Year)) {
            years.push(row.Year);
        }
    }

    for (const year of years) {
        let renewableVal = 0;
        let nonRenewableVal = 0;
        for (const row of data) {
            if (row.Year == year && row.CategoryName === "Renewable") {
                renewableVal = row.Percentage;
            }
            if (row.Year == year && row.CategoryName === "Non-Renewable") {
                nonRenewableVal = row.Percentage;
            }
        }
        renewable.push(renewableVal);
        nonRenewable.push(nonRenewableVal);
    }

    const ctx = document.querySelector("#chart1");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: years,
            datasets: [
                { label: "Renewable (%)", data: renewable, backgroundColor: "#52b788" },
                { label: "Non-Renewable (%)", data: nonRenewable, backgroundColor: "#e63946" }
            ]
        }
    });
};

// Report 2, shows top regions and sources for renewable generation filtered by year
const loadReport2 = async () => {
    const year = document.querySelector("#yearFilter").value;

    const sql = `SELECT r.RegionName, es.SourceName, ROUND(SUM(rgr.Generation_GWh), 2) AS TotalGeneration_GWh
        FROM RegionalGenerationRecord rgr
        INNER JOIN Region r ON rgr.RegionID = r.RegionID
        INNER JOIN EnergySource es ON rgr.SourceID = es.SourceID
        INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
        WHERE rgr.Year = ${year} AND ec.IsRenewable = 1
        GROUP BY r.RegionName, es.SourceName
        HAVING TotalGeneration_GWh > 0
        ORDER BY TotalGeneration_GWh DESC
        LIMIT 10`;

    const response = await fetch("../dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();
    const tbody = document.querySelector("#report2Body");
    tbody.innerHTML = "";

    for (const row of result.data) {
        tbody.innerHTML += `<tr>
            <td>${row.RegionName}</td>
            <td>${row.SourceName}</td>
            <td>${row.TotalGeneration_GWh}</td>
        </tr>`;
    }

    buildChart2(result.data);
};

const buildChart2 = (data) => {
    const labels = [];
    const values = [];

    for (const row of data) {
        labels.push(`${row.RegionName} - ${row.SourceName}`);
        values.push(row.TotalGeneration_GWh);
    }

    const ctx = document.querySelector("#chart2");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Generation (GWh)",
                data: values,
                backgroundColor: "#52b788"
            }]
        }
    });
};

// Report 3, compares actual UK emissions against government targets and calculates difference
const loadReport3 = async () => {
    const sql = `SELECT aer.Year, aer.EMISSIONS_MtCO2e AS ActualEmissions, 
        eet.EmissionsTarget_MtCO2e AS TargetEmissions, 
        eet.RenewableTarget_Pct AS RenewableTarget,
        ROUND(aer.EMISSIONS_MtCO2e - eet.EmissionsTarget_MtCO2e, 2) AS DifferenceFromTarget
        FROM AnnualEmissionsRecord aer
        LEFT JOIN EnergyEmissionsTarget eet ON aer.Year = eet.TargetYear
        ORDER BY aer.Year`;

    const response = await fetch("../dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();
    const tbody = document.querySelector("#report3Body");
    tbody.innerHTML = "";

    for (const row of result.data) {
        tbody.innerHTML += `<tr>
            <td>${row.Year}</td>
            <td>${row.ActualEmissions}</td>
            <td>${row.TargetEmissions ? row.TargetEmissions : "N/A"}</td>
            <td>${row.RenewableTarget ? row.RenewableTarget : "N/A"}</td>
            <td>${row.DifferenceFromTarget ? row.DifferenceFromTarget : "N/A"}</td>
            </tr>`;
    }
};

loadReport1();
loadReport2();
loadReport3();