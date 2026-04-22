// Matthew Rollo (40484527)
// matthew.js — JS for the individual reports page

const PHP_URL = "https://jcampbell2052.webhosting1.eeecs.qub.ac.uk/dbConnector.php";

// ─── UTILITY: sendQuery ───────────────────────────────────────────────────────
// Sends a SQL string to dbConnector.php via POST and returns parsed JSON.
// Throws a descriptive error if the network request fails or the response
// is not valid JSON — prevents silent crashes.
async function sendQuery(query) {
    let response;
    try {
        response = await fetch(PHP_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            // encodeURIComponent escapes special characters so the query string is safe to send
            body: "query=" + encodeURIComponent(query)
        });
    } catch (networkError) {
        // fetch itself failed — likely a wrong path or server not running
        throw new Error("Could not reach the server. Check that dbConnector.php path is correct and the server is running.");
    }

    let json;
    try {
        json = await response.json();
    } catch (parseError) {
        // server responded but not with valid JSON — often means PHP crashed
        throw new Error("Server returned an invalid response. Check PHP error logs.");
    }

    return json;
}

// ─── UTILITY: buildTable ──────────────────────────────────────────────────────
// Takes an array of row objects returned from the DB and builds an HTML table.
// Column headers are taken from the keys of the first row object.
function buildTable(data, containerId) {
    const container = document.getElementById(containerId);

    // show a message if no rows were returned instead of an empty table
    if (!data || data.length === 0) {
        container.innerHTML = "<p class='result-msg'>No results found. Check that test data exists for the selected year.</p>";
        return;
    }

    const headers = Object.keys(data[0]);
    let html = "<table><thead><tr>";
    headers.forEach(h => html += `<th>${h}</th>`);
    html += "</tr></thead><tbody>";

    data.forEach(row => {
        html += "<tr>";
        headers.forEach(h => {
            // IsRenewable is stored as 1/0 in the DB — convert to a coloured badge
            if (h === "IsRenewable") {
                const label = row[h] == 1 ? "Yes" : "No";
                const cls   = row[h] == 1 ? "badge-yes" : "badge-no";
                html += `<td><span class="renewable-badge ${cls}">${label}</span></td>`;
            } else {
                // show a dash for null values instead of blank cells
                html += `<td>${row[h] !== null && row[h] !== undefined ? row[h] : "—"}</td>`;
            }
        });
        html += "</tr>";
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}

// ─── UTILITY: showToast ───────────────────────────────────────────────────────
// Shows a small toast notification at the bottom of the screen.
// type is "success" or "error" — controls the colour.
// Automatically fades out after 3 seconds.
function showToast(message, type = "success") {
    // remove any existing toast before showing a new one
    const existing = document.getElementById("toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast toast-" + type;
    toast.textContent = message;
    document.body.appendChild(toast);

    // trigger the fade-in by adding the visible class after a tiny delay
    setTimeout(() => toast.classList.add("toast-visible"), 10);

    // remove the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove("toast-visible");
        setTimeout(() => toast.remove(), 400); // wait for fade-out transition
    }, 3000);
}

// ─── UTILITY: setButtonLoading ────────────────────────────────────────────────
// Disables a button and changes its text while a report is loading.
// This prevents double-submission if the user clicks the button twice.
// Call setButtonLoading(btn, false) to re-enable after the report finishes.
function setButtonLoading(btn, isLoading) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent; // save original label
        btn.textContent = "Loading…";
    } else {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || "Run Report";
    }
}

// ─── REPORT 1 ─────────────────────────────────────────────────────────────────
// Top Energy Sources by National Generation
// Shows the top 10 sources for a selected year with a bar chart.

// store the chart instance so we can destroy it before drawing a new one
let r1ChartInstance = null;

async function runReport1() {
    const year = document.getElementById("r1_year").value;
    const msg  = document.getElementById("r1_msg");
    const btn  = document.getElementById("r1_btn");

    // disable the button to prevent double-submission while the query runs
    setButtonLoading(btn, true);
    msg.textContent = "Loading…";

    // the year value from the dropdown is inserted into the WHERE clause —
    // this is what makes the report parameterised
    const query = `SELECT
    es.SourceName,
    ec.CategoryName,
    ec.IsRenewable,
    SUM(gr.Generation_GWh) AS TotalGeneration_GWh,
    ROUND(
        SUM(gr.Generation_GWh) * 100.0 /
        (
            SELECT SUM(g2.Generation_GWh)
            FROM GenerationRecord g2
            WHERE g2.Year = ${year}
        )
    , 2) AS ShareOfTotal_Pct
FROM GenerationRecord gr
INNER JOIN EnergySource es ON gr.SourceID = es.SourceID
INNER JOIN EnergyCategory ec ON es.CategoryID = ec.CategoryID
WHERE gr.Year = ${year}
  AND gr.Generation_GWh > 0
GROUP BY es.SourceName, ec.CategoryName, ec.IsRenewable
ORDER BY TotalGeneration_GWh DESC
LIMIT 10;`;

    try {
        const result = await sendQuery(query);

        if (!result.success) {
            // DB returned an error — show it in the message and as a toast
            msg.textContent = "Query error: " + result.error;
            showToast("Query failed: " + result.error, "error");
            setButtonLoading(btn, false);
            return;
        }

        msg.textContent = `${result.data.length} sources found for ${year}.`;
        buildTable(result.data, "r1_table");

        // destroy the old chart if one exists, otherwise Chart.js stacks them
        if (r1ChartInstance) r1ChartInstance.destroy();

        // map result rows to labels and values for the chart
        const labels = result.data.map(r => r.SourceName);
        const values = result.data.map(r => parseFloat(r.TotalGeneration_GWh));
        // colour each bar based on whether the source is renewable
        const colors = result.data.map(r => r.IsRenewable == 1 ? "#2d6a4f" : "#c0392b");

        const ctx = document.getElementById("r1_chart").getContext("2d");
        r1ChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: `Generation (GWh) — ${year}`,
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            // format tooltip with commas and GWh unit
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

        showToast(`Report 1 loaded — ${result.data.length} results for ${year}.`, "success");

    } catch (err) {
        // catch any network or parse errors thrown by sendQuery
        msg.textContent = "Error: " + err.message;
        showToast(err.message, "error");
    }

    setButtonLoading(btn, false);
}

// ─── REPORT 2 ─────────────────────────────────────────────────────────────────
// Regional Generation Coverage Gaps
// Uses a LEFT JOIN to find region/source combinations with no recorded data.

async function runReport2() {
    const year = document.getElementById("r2_year").value;
    const msg  = document.getElementById("r2_msg");
    const btn  = document.getElementById("r2_btn");

    setButtonLoading(btn, true);
    msg.textContent = "Loading…";

    // LEFT JOIN returns all expected region/source pairs; WHERE filters to only
    // those with no matching record — these are the coverage gaps
    const query = `SELECT
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

    try {
        const result = await sendQuery(query);

        if (!result.success) {
            msg.textContent = "Query error: " + result.error;
            showToast("Query failed: " + result.error, "error");
            setButtonLoading(btn, false);
            return;
        }

        msg.textContent = `${result.data.length} coverage gaps found for ${year}.`;
        buildTable(result.data, "r2_table");
        showToast(`Report 2 loaded — ${result.data.length} gaps for ${year}.`, "success");

    } catch (err) {
        msg.textContent = "Error: " + err.message;
        showToast(err.message, "error");
    }

    setButtonLoading(btn, false);
}

// ─── REPORT 3 ─────────────────────────────────────────────────────────────────
// Year-on-Year Generation Change by Source
// Self-joins GenerationRecord twice to compare two selected years in one row.

async function runReport3() {
    const fromYear = document.getElementById("r3_from").value;
    const toYear   = document.getElementById("r3_to").value;
    const msg      = document.getElementById("r3_msg");
    const btn      = document.getElementById("r3_btn");

    // validate that the two years are different before running
    if (fromYear === toYear) {
        msg.textContent = "Please select two different years.";
        showToast("Select two different years for this report.", "error");
        return;
    }

    setButtonLoading(btn, true);
    msg.textContent = "Loading…";

    // GenerationRecord is aliased as curr (toYear) and prev (fromYear) so both
    // years appear as columns in the same result row
    const query = `SELECT
            es.SourceName,
            ec.CategoryName,
            ec.IsRenewable,
            prev.Generation_GWh AS Generation_${fromYear}_GWh,
            curr.Generation_GWh AS Generation_${toYear}_GWh,
            ROUND(curr.Generation_GWh - prev.Generation_GWh, 2) AS Change_GWh,
            ROUND(
                (curr.Generation_GWh - prev.Generation_GWh) * 100.0
                / NULLIF(prev.Generation_GWh, 0),
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

    try {
        const result = await sendQuery(query);

        if (!result.success) {
            msg.textContent = "Query error: " + result.error;
            showToast("Query failed: " + result.error, "error");
            setButtonLoading(btn, false);
            return;
        }

        msg.textContent = `Year-on-year change from ${fromYear} to ${toYear} — ${result.data.length} sources.`;
        buildTable(result.data, "r3_table");
        showToast(`Report 3 loaded — ${result.data.length} sources compared.`, "success");

    } catch (err) {
        msg.textContent = "Error: " + err.message;
        showToast(err.message, "error");
    }

    setButtonLoading(btn, false);
}