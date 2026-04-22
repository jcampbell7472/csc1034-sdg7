// simple CRUD for AnnualEmissionsRecord

const API_URL = "http://localhost:8000/dbConnector.php";

let selectedYear = null;

// helper to show messages
function showMessage(text, type) {
    const output = document.getElementById("output");
    output.innerText = text;
    output.className = type;
}

// fetch and display records
async function fetchRecords() {
    const sql = "SELECT Year, EMISSIONS_MtCO2e FROM AnnualEmissionsRecord ORDER BY Year";

    const response = await fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();

    const tbody = document.getElementById("recordsBody");
    tbody.innerHTML = "";

    for (let row of result.data) {
        tbody.innerHTML += `
            <tr>
                <td>${row.Year}</td>
                <td>${row.EMISSIONS_MtCO2e}</td>
                <td>
                    <button onclick="editRecord(${row.Year}, ${row.EMISSIONS_MtCO2e})">Edit</button>
                    <button onclick="deleteRecord(${row.Year})">Delete</button>
                </td>
            </tr>
        `;
    }
}

fetchRecords();

// delete
async function deleteRecord(year) {
    if (!confirm("Delete this record?")) return;

    const sql = `DELETE FROM AnnualEmissionsRecord WHERE Year = ${year}`;

    const response = await fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();

    if (result.success) {
        showMessage("Record deleted.", "success");
        fetchRecords();
    } else {
        showMessage("Delete failed.", "error");
    }
}

// edit
function editRecord(year, emissions) {
    selectedYear = year;

    document.getElementById("year").value = year;
    document.getElementById("emissions").value = emissions;

    document.getElementById("formTitle").innerText = "Edit Record";
    document.getElementById("submitBtn").innerText = "Update Record";
}

// reset form
function resetForm() {
    selectedYear = null;

    document.getElementById("year").value = "";
    document.getElementById("emissions").value = "";

    document.getElementById("formTitle").innerText = "Add Record";
    document.getElementById("submitBtn").innerText = "Add Record";
}

// submit (insert/update)
async function submitForm() {
    const year = document.getElementById("year").value.trim();
    const emissions = document.getElementById("emissions").value.trim();

    if (!year || !emissions) {
        showMessage("All fields required.", "error");
        return;
    }

    if (year < 2000 || year > 2100) {
        showMessage("Invalid year.", "error");
        return;
    }

    if (emissions < 0) {
        showMessage("Emissions cannot be negative.", "error");
        return;
    }

    let sql;

    if (selectedYear) {
        sql = `UPDATE AnnualEmissionsRecord 
               SET EMISSIONS_MtCO2e = ${emissions} 
               WHERE Year = ${selectedYear}`;
    } else {
        sql = `INSERT INTO AnnualEmissionsRecord (Year, EMISSIONS_MtCO2e) 
               VALUES (${year}, ${emissions})`;
    }

    const response = await fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();

    if (result.success) {
        showMessage(selectedYear ? "Updated successfully." : "Added successfully.", "success");
        resetForm();
        fetchRecords();
    } else {
        showMessage("Operation failed.", "error");
    }
}