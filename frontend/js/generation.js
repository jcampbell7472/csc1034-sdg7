const fetchRecords = async () => {
    const sql = "SELECT gr.GenerationID, es.SourceID, es.SourceName, gr.Year, gr.Generation_GWh FROM GenerationRecord gr INNER JOIN EnergySource es ON gr.SourceID = es.SourceID ORDER BY gr.Year";

    const response = await fetch("https://jcampbell2052.webhosting1.eeecs.qub.ac.uk/dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();
    const tbody = document.querySelector("#recordsBody");
    tbody.innerHTML = "";

    for (const row of result.data) {
        tbody.innerHTML += `<tr>
            <td>${row.GenerationID}</td>
            <td>${row.SourceName}</td>
            <td>${row.Year}</td>
            <td>${row.Generation_GWh}</td>
            <td>
                <button onclick="editRecord(${row.GenerationID}, ${row.SourceID}, ${row.Year}, ${row.Generation_GWh})">Edit</button>
                <button onclick="deleteRecord(${row.GenerationID})">Delete</button>
            </td>
        </tr>`;
    }
};

fetchRecords();

const fetchSources = async () => {
    const sql = "SELECT SourceID, SourceName FROM EnergySource ORDER BY SourceName";

    const response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();
    const select = document.querySelector("#sourceID");

    for (const row of result.data) {
        const option = document.createElement("option");
        option.value = row.SourceID;
        option.textContent = row.SourceName;
        select.appendChild(option);
    }
};

fetchSources();

const deleteRecord = async (id) => {
    const shouldDelete = confirm("Are you sure you want to delete this record?");
    if (!shouldDelete) return;

    const sql = `DELETE FROM GenerationRecord WHERE GenerationID = ${id}`;

    const response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();

    if (result.success) {
        showMessage("Record deleted successfully.", "success");
        fetchRecords();
    } else {
        showMessage("Failed to delete record.", "error");
    }
};

const showMessage = (text, type) => {
    const output = document.querySelector("#output");
    output.textContent = text;
    output.className = type;
};

let selectedID = null;

const editRecord = (id, sourceID, year, generation) => {
    selectedID = id;
    document.querySelector("#sourceID").value = sourceID;
    document.querySelector("#year").value = year;
    document.querySelector("#generation").value = generation;
    document.querySelector("#formTitle").textContent = "Edit Record";
    document.querySelector("#submitBtn").textContent = "Update Record";
};

const resetForm = () => {
    selectedID = null;
    document.querySelector("#sourceID").value = "";
    document.querySelector("#year").value = "";
    document.querySelector("#generation").value = "";
    document.querySelector("#formTitle").textContent = "Add Record";
    document.querySelector("#submitBtn").textContent = "Add Record";
};

const submitForm = async () => {
    const sourceID = document.querySelector("#sourceID").value;
    const year = document.querySelector("#year").value.trim();
    const generation = document.querySelector("#generation").value.trim();

    if (!sourceID || !year || !generation) {
        showMessage("All fields are required.", "error");
        return;
    }

    if (year < 2000 || year > 2100) {
        showMessage("Please enter a valid year between 2000 and 2100.", "error");
        return;
    }

    if (generation < 0) {
        showMessage("Generation cannot be negative.", "error");
        return;
    }

    const submitBtn = document.querySelector("#submitBtn");
    submitBtn.disabled = true;

    let sql;

    if (selectedID) {
        sql = `UPDATE GenerationRecord SET SourceID = ${sourceID}, Year = ${year}, Generation_GWh = ${generation} WHERE GenerationID = ${selectedID}`;
    } else {
        sql = `INSERT INTO GenerationRecord (SourceID, Year, Generation_GWh) VALUES (${sourceID}, ${year}, ${generation})`;
    }

    const response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();

    if (result.success) {
        showMessage(selectedID ? "Record updated successfully." : "Record added successfully.", "success");
        resetForm();
        fetchRecords();
    } else {
        showMessage("Operation failed. Please try again.", "error");
    }

    submitBtn.disabled = false;
};