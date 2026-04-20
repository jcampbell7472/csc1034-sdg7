const API_URL = "http://localhost:8000/dbConnector.php";

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

async function loadReport1() {
    const data = await sendQuery("SELECT * FROM vw_RenewableProgressTo2030");
    if (!data) return;

    const labels = [];
    const actual = [];
    const target = [];

    for (let i = 0; i < data.length; i++) {
        labels.push(data[i].Year);
        actual.push(parseFloat(data[i].RenewablePct));
        target.push(parseFloat(data[i].Target_2030_Pct));
    }

    new Chart(document.getElementById("chart1"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Renewable %",
                    data: actual,
                    borderColor: "#2d6a4f",
                    tension: 0.3,
                    fill: false
                },
                {
                    label: "2030 Target (95%)",
                    data: target,
                    borderColor: "#aaa",
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            scales: {
                y: { min: 0, max: 100, title: { display: true, text: "%" } }
            }
        }
    });
}

async function loadReport2() {
    const data = await sendQuery("SELECT * FROM vw_RegionalContribution");
    if (!data) return;

    const colours = ["#2d6a4f", "#52b788", "#aaa", "#ccc"];

    // build unique source and region lists
    const sources = [];
    const regions = [];
    for (let i = 0; i < data.length; i++) {
        if (!sources.includes(data[i].SourceName)) sources.push(data[i].SourceName);
        if (!regions.includes(data[i].RegionName)) regions.push(data[i].RegionName);
    }

    // build a dataset per region
    const datasets = [];
    for (let i = 0; i < regions.length; i++) {
        const region = regions[i];
        const values = [];
        for (let j = 0; j < sources.length; j++) {
            const source = sources[j];
            let pct = 0;
            for (let k = 0; k < data.length; k++) {
                if (data[k].RegionName === region && data[k].SourceName === source) {
                    pct = parseFloat(data[k].ContributionPct);
                    break;
                }
            }
            values.push(pct);
        }
        datasets.push({
            label: region,
            data: values,
            backgroundColor: colours[i]
        });
    }

    new Chart(document.getElementById("chart2"), {
        type: "bar",
        data: { labels: sources, datasets: datasets },
        options: {
            scales: {
                x: { stacked: true },
                y: { stacked: true, title: { display: true, text: "% of national total" } }
            }
        }
    });
}

async function loadReport3() {
    const query = "SELECT curr.Year, ROUND(prev.EMISSIONS_MtCO2e - curr.EMISSIONS_MtCO2e, 3) AS Reduction_MtCO2e FROM AnnualEmissionsRecord curr INNER JOIN AnnualEmissionsRecord prev ON curr.Year = prev.Year + 1 ORDER BY curr.Year";
    const data = await sendQuery(query);
    if (!data) return;

    const labels = [];
    const reductions = [];
    const colours = [];

    for (let i = 0; i < data.length; i++) {
        labels.push(data[i].Year);
        const val = parseFloat(data[i].Reduction_MtCO2e);
        reductions.push(val);
        colours.push(val >= 0 ? "#2d6a4f" : "#c0392b");
    }

    new Chart(document.getElementById("chart3"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Emissions Reduction (MtCO₂e)",
                data: reductions,
                backgroundColor: colours
            }]
        },
        options: {
            scales: {
                y: { title: { display: true, text: "MtCO₂e" } }
            }
        }
    });
}

loadReport1();
loadReport2();
loadReport3();