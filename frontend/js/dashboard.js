const API_URL = "https://jcampbell2052.webhosting1.eeecs.qub.ac.uk/dbConnector.php";

async function sendQuery(query) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "query=" + encodeURIComponent(query)
    });
    const result = await response.json();
    if (!result.success) {
        console.error("Query failed:", result.error);
        return null;
    }
    return result.data;
}

async function loadDashboard() {

    // get the most recent year in the database
    const yearData = await sendQuery("SELECT MAX(Year) AS Year FROM GenerationRecord");
    if (!yearData) return;
    const year = yearData[0].Year;
    document.getElementById("stat-year").innerText = year;

    // stat cards
    const totals = await sendQuery(
        "SELECT SUM(Generation_GWh) AS Total FROM GenerationRecord WHERE Year = " + year
    );
    document.getElementById("stat-total").innerText = Math.round(totals[0].Total).toLocaleString();

    const renewableData = await sendQuery(
        "SELECT ROUND(SUM(CASE WHEN ec.IsRenewable = 1 THEN gr.Generation_GWh ELSE 0 END) * 100.0 / SUM(gr.Generation_GWh), 1) AS Pct FROM GenerationRecord gr INNER JOIN EnergySource es ON gr.SourceID = es.SourceID INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID WHERE gr.Year = " + year
    );
    document.getElementById("stat-renewable").innerText = renewableData[0].Pct + "%";

    const emissionsData = await sendQuery(
        "SELECT EMISSIONS_MtCO2e FROM AnnualEmissionsRecord WHERE Year = " + year
    );
    if (emissionsData && emissionsData.length > 0) {
        document.getElementById("stat-emissions").innerText = emissionsData[0].EMISSIONS_MtCO2e;
    }

    // chart 1: generation by source
    const sourceData = await sendQuery(
        "SELECT es.SourceName, gr.Generation_GWh FROM GenerationRecord gr INNER JOIN EnergySource es ON gr.SourceID = es.SourceID WHERE gr.Year = " + year + " AND gr.Generation_GWh > 0 ORDER BY gr.Generation_GWh DESC"
    );
    const sourceLabels = [];
    const sourceValues = [];
    for (let i = 0; i < sourceData.length; i++) {
        sourceLabels.push(sourceData[i].SourceName);
        sourceValues.push(parseFloat(sourceData[i].Generation_GWh));
    }
    new Chart(document.getElementById("chart-sources"), {
        type: "bar",
        data: {
            labels: sourceLabels,
            datasets: [{
                label: "Generation (GWh)",
                data: sourceValues,
                backgroundColor: "#2d6a4f"
            }]
        },
        options: {
            scales: { y: { title: { display: true, text: "GWh" } } }
        }
    });

    // chart 2: renewable vs non-renewable split
    const splitData = await sendQuery(
        "SELECT ec.CategoryName, SUM(gr.Generation_GWh) AS Total FROM GenerationRecord gr INNER JOIN EnergySource es ON gr.SourceID = es.SourceID INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID WHERE gr.Year = " + year + " GROUP BY ec.CategoryName"
    );
    const splitLabels = [];
    const splitValues = [];
    for (let i = 0; i < splitData.length; i++) {
        splitLabels.push(splitData[i].CategoryName);
        splitValues.push(parseFloat(splitData[i].Total));
    }
    new Chart(document.getElementById("chart-split"), {
        type: "pie",
        data: {
            labels: splitLabels,
            datasets: [{
                data: splitValues,
                backgroundColor: ["#aaa", "#2d6a4f"]
            }]
        }
    });

    // chart 3: emissions over time
    const allEmissions = await sendQuery(
        "SELECT Year, EMISSIONS_MtCO2e FROM AnnualEmissionsRecord ORDER BY Year"
    );
    const emLabels = [];
    const emValues = [];
    for (let i = 0; i < allEmissions.length; i++) {
        emLabels.push(allEmissions[i].Year);
        emValues.push(parseFloat(allEmissions[i].EMISSIONS_MtCO2e));
    }
    new Chart(document.getElementById("chart-emissions"), {
        type: "line",
        data: {
            labels: emLabels,
            datasets: [{
                label: "Emissions (MtCO₂e)",
                data: emValues,
                borderColor: "#2d6a4f",
                tension: 0.3,
                fill: false
            }]
        },
        options: {
            scales: { y: { title: { display: true, text: "MtCO₂e" } } }
        }
    });
}

loadDashboard();