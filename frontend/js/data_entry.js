/*
author: Jake Campbell
*/

const PHP_URL = "http://localhost:8000/dbConnector.php";

//function to send a query to the database, display result text in outputId if provided
async function sendQuery(query, outputId) {
    //send POST request to dbConnector.php
    const response = await fetch(PHP_URL, {
        method: "POST", //POST request
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "query=" + encodeURIComponent(query) //body is sql query, uses encodeURIComponent to ignore special characters
    });
    const result = await response.json(); //parse json to object
    //if outputId is passed in, gives a success or error message depending on if the request was successful
    if (outputId) {
        if (result.success) {
            document.getElementById(outputId).innerText = "Success.";
        }
        else {
            document.getElementById(outputId).innerText = "Error: " + result.error;
        }
    }
    return result; //return result so that it can be used
}

// Returns the primary key column name for a given table, returns null if not found
function getPrimaryKey(table) {
    if (table === "GenerationRecord") return "GenerationID";
    if (table === "RegionalGenerationRecord") return "RegionalGenerationID";
    if (table === "AnnualEmissionsRecord") return "Year";
    if (table === "EnergyEmissionsTarget") return "TargetYear";
    return null;
}

// Get an element's value by ID, put into a function for convenience
function getValue(id) {
    return document.getElementById(id).value;
}

//function to load a table from the database using the page's dropdown menu
//async function to allow use of await
async function loadTable() {
    const table = getValue("tableSelect"); //get the selected table from the dropdown

    //validate a table has been selected
    if (!table) {
        alert("Please select a table.");
        return;
    }

    //send query using sendQuery function, uses await to block code until response is received
    const result = await sendQuery(`SELECT * FROM ${table}`);

    //show error if query fails
    if (!result.success) {
        alert("Error: " + result.error);
        return;
    }

    //call displayTable
    displayTable(result.data);
}

//function to display a table, data parameter is an array of objects that represent rows in a table from the database
function displayTable(data) {
    //get tableContainer and assign it to a variable
    const container = document.getElementById("tableContainer");

    //check if the table contains any data, display a message if it doesn't
    if (!data || data.length === 0) {
        container.innerHTML = "<p>No data found.</p>";
        return;
    }

    //get table headers
    const headers = Object.keys(data[0]);

    //start building table
    let html = "<table>";

    // header row
    html += "<tr>";
    headers.forEach(h => html += `<th>${h}</th>`);
    html += "</tr>";

    // data rows
    data.forEach(row => {
        html += "<tr>";
        headers.forEach(h => html += `<td>${row[h]}</td>`);
        html += "</tr>";
    });

    html += "</table>";

    //set constructed table to tableContainer
    container.innerHTML = html;
}

//async function to delete a record from a table
async function deleteRecord() {
    //get required values
    const table = getValue("deleteTable");
    const id = getValue("deleteId");
    const pk = getPrimaryKey(table);
    //check that all values have been provided
    if (!table || !id) {
        document.getElementById("deleteResult").innerText = "Please fill in all fields."; return;
    }
    //send query to database
    await sendQuery(`DELETE FROM ${table} WHERE ${pk} = ${id}`, "deleteResult");
}

//async function to update a record in a table
async function updateRecord() {
    //get required values
    const table = getValue("updateTable");
    const id = getValue("updateId");
    const column = getValue("updateColumn");
    const value = getValue("updateValue");
    const pk = getPrimaryKey(table);
    //check that all values have been provided
    if (!table || !id || !column || !value) {
        document.getElementById("updateResult").innerText = "All fields are required."; return;
    }
    //send query to database
    await sendQuery(`UPDATE ${table} SET ${column} = '${value}' WHERE ${pk} = ${id}`, "updateResult");
}

//async function to insert a record into GenerationRecord
async function insertGeneration() {
    await sendQuery(`INSERT INTO GenerationRecord (SourceID, Year, Generation_GWh)
        VALUES (${getValue("g_source")}, ${getValue("g_year")}, ${getValue("g_gwh")})`, "out_gen");
}

//async function to insert a record into RegionalGenerationRecord
async function insertRegional() {
    await sendQuery(`INSERT INTO RegionalGenerationRecord (RegionID, SourceID, Year, Generation_GWh)
        VALUES (${getValue("r_region")}, ${getValue("r_source")}, ${getValue("r_year")}, ${getValue("r_gwh")})`, "out_reg");
}

//async function to insert a record into AnnualEmissionsRecord
async function insertEmissions() {
    await sendQuery(`INSERT INTO AnnualEmissionsRecord (Year, EMISSIONS_MtCO2e)
        VALUES (${getValue("e_year")}, ${getValue("e_em")})`, "out_em");
}

//async function to insert a record into EnergyEmissionsTarget
async function insertTarget() {
    await sendQuery(`INSERT INTO EnergyEmissionsTarget (TargetYear, RenewableTarget_Pct, EmissionsTarget_MtCO2e)
        VALUES (${getValue("t_year")}, ${getValue("t_pct")}, ${getValue("t_em")})`, "out_tar");
}