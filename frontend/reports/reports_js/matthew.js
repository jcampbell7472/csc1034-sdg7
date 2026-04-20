//Matthew Rollo
// PHP_URL stores the path to dbConnector.php which handles all communication between the front end and the MySQL database
const PHP_URL = "../dbConnector.php";

// sendQuery takes a SQL string, sends it as a POST request to dbConnector.php, and returns the parsed JSON response
async function sendQuery(query) {
    const response = await fetch(PHP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "query=" + encodeURIComponent(query) // encodeURIComponent escapes special characters in the query string
    });
    return await response.json(); // parse the response body as JSON and return it
}

// buildTable takes an array of row objects from the database and builds an HTML table dynamically, using object keys as column headers
function buildTable(data, containerId) {
    const container = document.getElementById(containerId);

    // if no data was returned, show a message instead of an empty table
    if (!data || data.length === 0) {
        container.innerHTML = "<p>No results returned.</p>";
        return;
    }

    // get column names from the keys of the first row object
    const headers = Object.keys(data[0]);
    let html = "<table><tr>";
    headers.forEach(h => html += `<th>${h}</th>`);
    html += "</tr>";

    data.forEach(row => {
        html += "<tr>";
        headers.forEach(h => {
            // IsRenewable is stored as 1 or 0 in the database, this converts it to a coloured badge for readability
            if (h === "IsRenewable") {
                const label = row[h] == 1 ? "Yes" : "No";
                const cls   = row[h] == 1 ? "badge-yes" : "badge-no";
                html += `<td><span class="renewable-badge ${cls}">${label}</span></td>`;
            } else {
                // if a value is null, display a dash instead of blank space
                html += `<td>${row[h] !== null ? row[h] : "—"}</td>`;
            }
        });
        html += "</tr>";
    });

    html += "</table>";
    container.innerHTML = html;
}

// r1ChartInstance stores a reference to the current chart so it can be destroyed before a new one is drawn
let r1ChartInstance = null;

// runReport1 reads the selected year, runs the top sources query, displays the results as a table, and draws a bar chart
async function runReport1() {
    const year = document.getElementById("r1_year").value;
    const msg  = document.getElementById("r1_msg");
    msg.textContent = "Loading...";

    // the year variable from the dropdown is inserted into the query here, making this a parameterised report
    const query = `
        SELECT
            es.SourceName,
            ec.CategoryName,
            ec.IsRenewable,
            SUM(gr.Generation_GWh) AS TotalGeneration_GWh,
            ROUND(
                SUM(gr.Generation_GWh) * 100.0 /
                (SELECT SUM(g2.Generation_GWh) FROM GenerationRecord g2 WHERE g2.Year = ${year}),
            2) AS ShareOfTotal_Pct
        FROM GenerationRecord gr
        INNER JOIN EnergySource es ON gr.SourceID = es.SourceID
        INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
        WHERE gr.Year = ${year}
            AND gr.Generation_GWh > 0
        GROUP BY es.SourceName, ec.CategoryName, ec.IsRenewable
        ORDER BY TotalGeneration_GWh DESC
        LIMIT 10
    `;

    const result = await sendQuery(query);

    if (!result.success) {
        msg.textContent = "Error: " + result.error;
        return;
    }

    msg.textContent = `${result.data.length} sources found for ${year}.`;
    buildTable(result.data, "r1_table");

    // destroy the existing chart before drawing a new one to prevent multiple charts stacking on the same canvas
    if (r1ChartInstance) r1ChartInstance.destroy();

    // map extracts just the source names and GWh values from the result array to use as chart labels and bar heights
    const labels = result.data.map(r => r.SourceName);
    const values = result.data.map(r => parseFloat(r.TotalGeneration_GWh));
    // colour each bar green for renewables and red for non-renewables
    const colors = result.data.map(r => r.IsRenewable == 1 ? "#2d6a4f" : "#c0392b");

    // create a new bar chart on the canvas element using Chart.js
    const ctx = document.getElementById("r1_chart").getContext("2d");
    r1ChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: `Generation (GWh) — ${year}`,
                data: values,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        // format the tooltip value with commas and the GWh unit when hovering over a bar
                        label: ctx => " " + ctx.parsed.y.toLocaleString() + " GWh"
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "GWh" }
                }
            }
        }
    });
}

// runReport2 reads the selected year and runs the coverage gap query, showing which regions have no recorded data for each source
async function runReport2() {
    const year = document.getElementById("r2_year").value;
    const msg  = document.getElementById("r2_msg");
    msg.textContent = "Loading...";

    // the LEFT JOIN returns all region/source combinations and the WHERE keeps only rows with no matching generation record
    const query = `
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
            AND rgr.Year = ${year}
        WHERE rgr.Generation_GWh IS NULL
        ORDER BY r.RegionName, es.SourceName
    `;

    const result = await sendQuery(query);

    if (!result.success) {
        msg.textContent = "Error: " + result.error;
        return;
    }

    msg.textContent = `${result.data.length} coverage gaps found for ${year}.`;
    buildTable(result.data, "r2_table");
}

// runReport3 reads both year dropdowns and shows how generation changed for each source between the two years
async function runReport3() {
    const fromYear = document.getElementById("r3_from").value;
    const toYear   = document.getElementById("r3_to").value;
    const msg      = document.getElementById("r3_msg");

    // stop the report if both years are the same, as the comparison would always return zero change
    if (fromYear === toYear) {
        msg.textContent = "Please select two different years.";
        return;
    }

    msg.textContent = "Loading...";

    // GenerationRecord is joined to itself twice under different aliases (curr and prev) to compare both years in one row
    const query = `
        SELECT
            es.SourceName,
            ec.CategoryName,
            prev.Generation_GWh AS Generation_${fromYear}_GWh,
            curr.Generation_GWh AS Generation_${toYear}_GWh,
            ROUND(curr.Generation_GWh - prev.Generation_GWh, 2) AS Change_GWh,
            ROUND(
                (curr.Generation_GWh - prev.Generation_GWh) * 100.0 / NULLIF(prev.Generation_GWh, 0),
            2) AS PercentChange
        FROM GenerationRecord curr
        INNER JOIN GenerationRecord prev
            ON curr.SourceID = prev.SourceID
            AND curr.Year = ${toYear}
            AND prev.Year = ${fromYear}
        INNER JOIN EnergySource es ON curr.SourceID = es.SourceID
        INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
        ORDER BY Change_GWh DESC
    `;

    const result = await sendQuery(query);

    if (!result.success) {
        msg.textContent = "Error: " + result.error;
        return;
    }

    msg.textContent = `Year-on-year change from ${fromYear} to ${toYear}.`;
    buildTable(result.data, "r3_table");
}