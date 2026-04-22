//Matthew Rollo JavaScript Crud

// simple message output
const showMessage = (text, type) => {
    const output = document.querySelector("#output");
    output.textContent = text;
    output.className = type;
};

let selectedYear = null;

// load all records
const fetchEmissions = async () => {
    const sql = "SELECT Year, EMISSIONS_MtCO2e FROM AnnualEmissionsRecord ORDER BY Year";

    const response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();
    const tbody = document.querySelector("#recordsBody");
    tbody.innerHTML = "";

    for (const row of result.data) {
        tbody.innerHTML += `<tr>
            <td>${row.Year}</td>
            <td>${row.EMISSIONS_MtCO2e}</td>
            <td>
                <button onclick="editRecord(${row.Year}, ${row.EMISSIONS_MtCO2e})">Edit</button>
                <button onclick="deleteRecord(${row.Year})">Delete</button>
            </td>
        </tr>`;
    }
};

fetchEmissions();

// delete
const deleteRecord = async (year) => {
    if (!confirm("Are you sure?")) return;

    const sql = `DELETE FROM AnnualEmissionsRecord WHERE Year = ${year}`;

    const response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();

    if (result.success) {
        showMessage("Deleted successfully", "success");
        fetchEmissions();
    } else {
        showMessage("Delete failed", "error");
    }
};

// edit
const editRecord = (year, emissions) => {
    selectedYear = year;
    document.querySelector("#year").value = year;
    document.querySelector("#emissions").value = emissions;
    document.querySelector("#formTitle").textContent = "Edit Record";
    document.querySelector("#submitBtn").textContent = "Update Record";
};

// reset form
const resetForm = () => {
    selectedYear = null;
    document.querySelector("#year").value = "";
    document.querySelector("#emissions").value = "";
    document.querySelector("#formTitle").textContent = "Add Record";
    document.querySelector("#submitBtn").textContent = "Add Record";
};

// submit
const submitForm = async () => {
    const year = document.querySelector("#year").value.trim();
    const emissions = document.querySelector("#emissions").value.trim();

    if (!year || !emissions) {
        showMessage("All fields required", "error");
        return;
    }

    if (year < 2000 || year > 2100) {
        showMessage("Enter valid year", "error");
        return;
    }

    if (emissions < 0) {
        showMessage("Emissions cannot be negative", "error");
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

    const response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();

    if (result.success) {
        showMessage(selectedYear ? "Updated successfully" : "Added successfully", "success");
        resetForm();
        fetchEmissions();
    } else {
        showMessage("Operation failed", "error");
    }
};