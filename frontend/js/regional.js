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

// resetForm clears all inputs and returns the form to add mode
const resetForm = () => {
    document.querySelector("#regionID").value = "";
    document.querySelector("#sourceID").value = "";
    document.querySelector("#year").value = "";
    document.querySelector("#generation").value = "";
};

// submitForm validates inputs then inserts a new record into RegionalGenerationRecord
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

    const sql = `INSERT INTO RegionalGenerationRecord (RegionID, SourceID, Year, Generation_GWh) VALUES (${regionID}, ${sourceID}, ${year}, ${generation})`;

    const result = await sendQuery(sql);

    if (result.success) {
        showMessage("Record added successfully.", "success");
        resetForm();
    } else {
        showMessage("Operation failed. Please try again.", "error");
    }

    // re-enable button after operation completes
    submitBtn.disabled = false;
};

// load regions and sources when the page first loads
fetchRegions();
fetchSources();