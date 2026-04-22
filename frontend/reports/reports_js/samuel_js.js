//Samuel Campbell
//PHP_URL stores the path to dbConnector.php which handles all communication between the front end and the MySQL database
const PHP_URL = "https://jcampbell2052.webhosting1.eeecs.qub.ac.uk/dbConnector.php";

//sendQuery takes a SQL string, sends it as a POST request to dbConnector.php, and returns the parsed JSON response
async function sendQuery(query) {
    const response = await fetch(PHP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "query=" + encodeURIComponent(query)
    });
    return await response.json();
}

//buildTable takes an array of row objects and builds an HTML table dynamically, using object keys as column headers
function buildTable(data, containerId) {
    const container = document.getElementById(containerId);

    if (!data || data.length === 0) {
        container.innerHTML = "<p>No results returned.</p>";
        return;
    }

    const headers = Object.keys(data[0]);
    let html = "<table><tr>";
    headers.forEach(h => html += `<th>${h}</th>`);
    html += "</tr>";

    data.forEach(row => {
        html += "<tr>";
        headers.forEach(h => {
            //IsRenewable is stored as 1 or 0, convert to readable Yes/No badge
            if (h === "IsRenewable") {
                const label = row[h] == 1 ? "Yes" : "No";
                const cls = row[h] == 1 ? "badge-yes" : "badge-no";
                html += `<td><span class="renewable-badge ${cls}">${label}</span></td>`;
            } else {
                html += `<td>${row[h] !== null ? row[h] : "—"}</td>`;
            }
        });
        html += "</tr>";
    });

    html += "</table>";
    container.innerHTML = html;
}

// 
// REPORT 1 - Dominant Energy Category Per Region
// 

//r1ChartInstance stores the current chart so it can be destroyed before redrawing
let r1ChartInstance = null;

//runReport1 fetches total generation grouped by region and category, displays a table and stacked bar chart
async function runReport1() {
    const msg = document.getElementById("r1_msg");
    msg.textContent = "Loading...";

    const query = `SELECT r.RegionName, ec.CategoryName,
        ROUND(SUM(rgr.Generation_GWh), 2) AS TotalGeneration_GWh
        FROM RegionalGenerationRecord rgr
        INNER JOIN Region r ON rgr.RegionID = r.RegionID
        INNER JOIN EnergySource es ON rgr.SourceID = es.SourceID
        INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
        GROUP BY r.RegionName, ec.CategoryName
        ORDER BY r.RegionName, TotalGeneration_GWh DESC
    `;

    const result = await sendQuery(query);

    if (!result.success) {
        msg.textContent = "Error: " + result.error;
        return;
    }

    msg.textContent = `${result.data.length} results found.`;
    buildTable(result.data, "r1_table");

    //get unique regions and categories from the results to use as chart labels and datasets
    const regions = [...new Set(result.data.map(r => r.RegionName))];
    const categories = [...new Set(result.data.map(r => r.CategoryName))];
    const colours = ["#2d6a4f", "#c0392b"];

    //build one dataset per category, finding the matching GWh value for each region
    const datasets = categories.map((cat, i) => ({
        label: cat,
        data: regions.map(reg => {
            const match = result.data.find(r => r.RegionName === reg && r.CategoryName === cat);
            return match ? parseFloat(match.TotalGeneration_GWh) : 0;
        }),
        backgroundColor: colours[i % colours.length]
    }));

    if (r1ChartInstance) r1ChartInstance.destroy();

    const ctx = document.getElementById("r1_chart").getContext("2d");
    r1ChartInstance = new Chart(ctx, {
        type: "bar",
        data: { labels: regions, datasets: datasets },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: "Energy Category Generation Per Region (GWh)" }
            },
            scales: {
                x: { stacked: true },
                y: { stacked: true, title: { display: true, text: "GWh" } }
            }
        }
    });
}

// 
// REPORT 2 - Underperforming Energy Sources
// 

//runReport2 fetches sources whose total generation across all years falls below the selected threshold
async function runReport2() {
    const threshold = document.getElementById("r2_threshold").value;
    const msg = document.getElementById("r2_msg");
    msg.textContent = "Loading...";

    // the threshold value from the dropdown is inserted into HAVING to filter low-generating sources
    const query = `SELECT es.SourceName, ec.CategoryName, ec.IsRenewable,
        COUNT(gr.Year) AS YearsRecorded,
        ROUND(SUM(gr.Generation_GWh), 2) AS TotalGeneration_GWh,
        ROUND(AVG(gr.Generation_GWh), 2) AS AvgGenerationPerYear_GWh
        FROM GenerationRecord gr
        INNER JOIN EnergySource es ON gr.SourceID = es.SourceID
        INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
        GROUP BY es.SourceName, ec.CategoryName, ec.IsRenewable
        HAVING TotalGeneration_GWh <= ${threshold}
        ORDER BY TotalGeneration_GWh ASC
    `;

    const result = await sendQuery(query);

    if (!result.success) {
        msg.textContent = "Error: " + result.error;
        return;
    }

    if (result.data.length === 0) {
        msg.textContent = "No sources found below this threshold.";
        document.getElementById("r2_table").innerHTML = "";
        return;
    }

    msg.textContent = `${result.data.length} underperforming sources found.`;
    buildTable(result.data, "r2_table");
}

// 
// REPORT 3 - Carbon Efficiency By Year
// 

//r3ChartInstance stores the current chart so it can be destroyed before redrawing
let r3ChartInstance = null;

//runReport3 calculates emissions per GWh generated for each year, displays a table and line chart
async function runReport3() {
    const msg = document.getElementById("r3_msg");
    msg.textContent = "Loading...";

    //LEFT JOIN used so years with no generation data still appear in results
    // NULLIF prevents divide by zero if total generation is 0 for a year
    const query = `SELECT aer.Year,
        aer.EMISSIONS_MtCO2e AS ActualEmissions_MtCO2e,
        ROUND(SUM(gr.Generation_GWh), 2) AS TotalGeneration_GWh,
        ROUND(aer.EMISSIONS_MtCO2e / NULLIF(SUM(gr.Generation_GWh), 0) * 1000, 4) AS EmissionsPerGWh_ktCO2e
        FROM AnnualEmissionsRecord aer
        LEFT JOIN GenerationRecord gr ON aer.Year = gr.Year
        GROUP BY aer.Year, aer.EMISSIONS_MtCO2e
        ORDER BY aer.Year ASC
    `;

    const result = await sendQuery(query);

    if (!result.success) {
        msg.textContent = "Error: " + result.error;
        return;
    }

    msg.textContent = `${result.data.length} years of data found.`;
    buildTable(result.data, "r3_table");

    const labels = result.data.map(r => r.Year);
    const values = result.data.map(r => parseFloat(r.EmissionsPerGWh_ktCO2e));

    if (r3ChartInstance) r3ChartInstance.destroy();

    const ctx = document.getElementById("r3_chart").getContext("2d");
    r3ChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Emissions Per GWh (ktCO2e)",
                data: values,
                borderColor: "#c0392b",
                backgroundColor: "rgba(192, 57, 43, 0.1)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: "UK Grid Carbon Efficiency Over Time" }
            },
            scales: {
                y: { title: { display: true, text: "ktCO2e per GWh" } }
            }
        }
    });
}