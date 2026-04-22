// Samuel Campbell
// PHP_URL stores the path to dbConnector.php which handles all communication between the front end and the MySQL database
const PHP_URL = "dbConnector.php";

// sendQuery takes a SQL string, sends it as a POST request to dbConnector.php and returns the parsed JSON response
const sendQuery = async (sql) => {
    const response = await fetch(PHP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "query=" + encodeURIComponent(sql)
    });
    return await response.json();
};

// showMessage displays a success or error message to the user in the output element
const showMessage = (text, type) => {
    const output = document.querySelector("#output");
    output.textContent = text;
    output.className = "result-msg " + type;
};

// fetchRegions loads all regions from the database into the region dropdown
const fetchRegions = async () => {
    const result = await sendQuery("SELECT RegionID, RegionName FROM Region ORDER BY RegionName");
    const select = document.querySelector("#regionID");

    for (const row of result.data) {
        const option = document.createElement("option");
        option.value = row.RegionID;
        option.textContent = row.RegionName;
        select.appendChild(option);
    }
};

// fetchSources loads all energy sources from the database into the source dropdown
const fetchSources = async () => {
    const result = await sendQuery("SELECT SourceID, SourceName FROM EnergySource ORDER BY SourceName");
    const select = document.querySelector("#sourceID");

    for (const row of result.data) {
        const option = document.createElement("option");
        option.value = row.SourceID;
        option.textContent = row.SourceName;
        select.appendChild(option);
    }
};

// fetchRecords loads all regional generation records and builds the table
const fetchRecords = async () => {
    const sql = `
        SELECT rgr.RegionalGenerationID, r.RegionName, es.SourceName,
        rgr.Year, rgr.Generation_GWh
        FROM RegionalGenerationRecord rgr
        INNER JOIN Region r ON rgr.RegionID = r.RegionID
        INNER JOIN EnergySource es ON rgr.SourceID = es.SourceID
        ORDER BY rgr.Year DESC, r.RegionName
    `;

    const result = await sendQuery(sql);
    const tbody = document.querySelector("#recordsBody");
    tbody.innerHTML = "";

    for (const row of result.data) {
        tbody.innerHTML += `<tr>
            <td>${row.RegionalGenerationID}</td>
            <td>${row.RegionName}</td>
            <td>${row.SourceName}</td>
            <td>${row.Year}</td>
            <td>${row.Generation_GWh}</td>
            <td>
                <button onclick="editRecord(${row.RegionalGenerationID}, ${row.RegionID}, ${row.SourceID}, ${row.Year}, ${row.Generation_GWh})">Edit</button>
                <button onclick="deleteRecord(${row.RegionalGenerationID})">Delete</button>
            </td>
        </tr>`;
    }
};

// deleteRecord asks for confirmation then deletes the selected record by ID
const deleteRecord = async (id) => {
    // confirmation prevents accidental deletion
    const confirmed = confirm("Are you sure you want to delete this record?");
    if (!confirmed) return;

    const result = await sendQuery(`DELETE FROM RegionalGenerationRecord WHERE RegionalGenerationID = ${id}`);

    if (result.success) {
        showMessage("Record deleted successfully.", "success");
        fetchRecords();
    } else {
        showMessage("Failed to delete record.", "error");
    }
};

// selectedID tracks which record is being edited, null means we are adding a new record
let selectedID = null;

// editRecord populates the form with the selected record's values ready for editing
const editRecord = (id, regionID, sourceID, year, generation) => {
    selectedID = id;
    document.querySelector("#regionID").value = regionID;
    document.querySelector("#sourceID").value = sourceID;
    document.querySelector("#year").value = year;
    document.querySelector("#generation").value = generation;
    document.querySelector("#formTitle").textContent = "Edit Record";
    document.querySelector("#submitBtn").textContent = "Update Record";
};

// resetForm clears all inputs and returns the form to add mode
const resetForm = () => {
    selectedID = null;
    document.querySelector("#regionID").value = "";
    document.querySelector("#sourceID").value = "";
    document.querySelector("#year").value = "";
    document.querySelector("#generation").value = "";
    document.querySelector("#formTitle").textContent = "Add Record";
    document.querySelector("#submitBtn").textContent = "Add Record";
};

// submitForm validates inputs then either inserts a new record or updates an existing one
const submitForm = async () => {
    const regionID = document.querySelector("#regionID").value;
    const sourceID = document.querySelector("#sourceID").value;
    const year = document.querySelector("#year").value.trim();
    const generation = document.querySelector("#generation").value.trim();

    // validate all fields are filled before submitting
    if (!regionID || !sourceID || !year || !generation) {
        showMessage("All fields are required.", "error");
        return;
    }

    // validate year is within a sensible range
    if (year < 2000 || year > 2100) {
        showMessage("Please enter a valid year between 2000 and 2100.", "error");
        return;
    }

    // validate generation cannot be negative as per database constraint
    if (generation < 0) {
        showMessage("Generation cannot be negative.", "error");
        return;
    }

    // disable button to prevent accidental double submission
    const submitBtn = document.querySelector("#submitBtn");
    submitBtn.disabled = true;

    let sql;

    if (selectedID) {
        // update existing record if an ID is selected
        sql = `UPDATE RegionalGenerationRecord SET RegionID = ${regionID}, SourceID = ${sourceID}, Year = ${year}, Generation_GWh = ${generation} WHERE RegionalGenerationID = ${selectedID}`;
    } else {
        // insert new record if no ID is selected
        sql = `INSERT INTO RegionalGenerationRecord (RegionID, SourceID, Year, Generation_GWh) VALUES (${regionID}, ${sourceID}, ${year}, ${generation})`;
    }

    const result = await sendQuery(sql);

    if (result.success) {
        showMessage(selectedID ? "Record updated successfully." : "Record added successfully.", "success");
        resetForm();
        fetchRecords();
    } else {
        showMessage("Operation failed. Please try again.", "error");
    }

    // re-enable button after operation completes
    submitBtn.disabled = false;
};

// load regions, sources and existing records when the page first loads
fetchRegions();
fetchSources();
fetchRecords();