const API_URL = "http://localhost:8000/dbConnector.php";

async function loadTable() {
    const tableName = document.getElementById("tableSelect").value;

    if (!tableName) {
        alert("Please select a table");
        return;
    }

    const sql = `SELECT * FROM ${tableName};`;

    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "query=" + encodeURIComponent(sql)
    });

    const result = await response.json();

    if (!result.success) {
        alert("Error: " + result.error);
        return;
    }

    displayTable(result.data);
}

function displayTable(data) {
    const container = document.getElementById("tableContainer");
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = "<p>No data found.</p>";
        return;
    }

    const table = document.createElement("table");
    table.border = "1";
    table.style.borderCollapse = "collapse";
    table.style.marginTop = "20px";

    // Create header row
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement("tr");

    headers.forEach(header => {
        const th = document.createElement("th");
        th.innerText = header;
        th.style.padding = "8px";
        headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    // Create data rows
    data.forEach(row => {
        const tr = document.createElement("tr");

        headers.forEach(header => {
            const td = document.createElement("td");
            td.innerText = row[header];
            td.style.padding = "8px";
            tr.appendChild(td);
        });

        table.appendChild(tr);
    });

    container.appendChild(table);

    function deleteRecord() {
        const table = document.getElementById("deleteTable").value;
        const id = document.getElementById("deleteId").value;
        const resultBox = document.getElementById("deleteResult");

        if (!table || !id) {
            resultBox.innerText = "Please select a table and enter an ID.";
            return;
        }

        // Determine correct ID column for each table
        let idColumn = "";

        if (table === "GenerationRecord") idColumn = "GenerationID";
        if (table === "RegionalGenerationRecord") idColumn = "RegionalGenerationID";
        if (table === "AnnualEmissionsRecord") idColumn = "Year";
        if (table === "EnergyEmissionsTarget") idColumn = "TargetYear";

        const query = `DELETE FROM ${table} WHERE ${idColumn} = ${id};`;

        fetch("dbConnector.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "query=" + encodeURIComponent(query)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    resultBox.innerText = "Record deleted successfully.";
                } else {
                    resultBox.innerText = data.error;
                }
            })
            .catch(err => resultBox.innerText = err);
    }
}

function deleteRecord() {
    const table = document.getElementById("deleteTable").value;
    const id = document.getElementById("deleteId").value;
    const resultBox = document.getElementById("deleteResult");

    if (!table || !id) {
        resultBox.innerText = "Please select a table and enter an ID.";
        return;
    }

    // Determine correct ID column for each table
    let idColumn = "";

    if (table === "GenerationRecord") idColumn = "GenerationID";
    if (table === "RegionalGenerationRecord") idColumn = "RegionalGenerationID";
    if (table === "AnnualEmissionsRecord") idColumn = "Year";
    if (table === "EnergyEmissionsTarget") idColumn = "TargetYear";

    const query = `DELETE FROM ${table} WHERE ${idColumn} = ${id};`;

    fetch("dbConnector.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "query=" + encodeURIComponent(query)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            resultBox.innerText = "Record deleted successfully.";
        } else {
            resultBox.innerText = data.error;
        }
    })
    .catch(err => resultBox.innerText = err);
}

function updateRecord() {
    const table = document.getElementById("updateTable").value;
    const id = document.getElementById("updateId").value;
    const column = document.getElementById("updateColumn").value;
    const value = document.getElementById("updateValue").value;
    const resultBox = document.getElementById("updateResult");

    if (!table || !id || !column || !value) {
        resultBox.innerText = "All fields are required.";
        return;
    }

    let idColumn = "";

    if (table === "GenerationRecord") idColumn = "GenerationID";
    if (table === "RegionalGenerationRecord") idColumn = "RegionalGenerationID";
    if (table === "AnnualEmissionsRecord") idColumn = "Year";
    if (table === "EnergyEmissionsTarget") idColumn = "TargetYear";

    const query = `UPDATE ${table} SET ${column} = ${value} WHERE ${idColumn} = ${id};`;

    fetch("dbConnector.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "query=" + encodeURIComponent(query)
    })
    .then(res => res.json())
    .then(data => {
        resultBox.innerText = data.success ? "Record updated." : data.error;
    })
    .catch(err => resultBox.innerText = err);
}

function postQuery(query, outputId) {
    fetch("dbConnector.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "query=" + encodeURIComponent(query)
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById(outputId).textContent =
            JSON.stringify(data, null, 2);
    });
}

function insertGeneration() {
    const q = `INSERT INTO GenerationRecord (SourceID, Year, Generation_GWh)
               VALUES (${g_source.value}, ${g_year.value}, ${g_gwh.value})`;
    postQuery(q, "out_gen");
}

function insertRegional() {
    const q = `INSERT INTO RegionalGenerationRecord (RegionID, SourceID, Year, Generation_GWh)
               VALUES (${r_region.value}, ${r_source.value}, ${r_year.value}, ${r_gwh.value})`;
    postQuery(q, "out_reg");
}

function insertEmissions() {
    const q = `INSERT INTO AnnualEmissionsRecord (Year, EMISSIONS_MtCO2e)
               VALUES (${e_year.value}, ${e_em.value})`;
    postQuery(q, "out_em");
}

function insertTarget() {
    const q = `INSERT INTO EnergyEmissionsTarget (TargetYear, RenewableTarget_Pct, EmissionsTarget_MtCO2e)
               VALUES (${t_year.value}, ${t_pct.value}, ${t_em.value})`;
    postQuery(q, "out_tar");
}