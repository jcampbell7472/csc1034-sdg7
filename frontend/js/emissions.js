// Matthew Rollo (40486932)
// CRUD for AnnualEmissionsRecord

const PHP_URL = "https://jcampbell2052.webhosting1.eeecs.qub.ac.uk/dbConnector.php";

let selectedYear = null;

// showToast 
// Shows a fading toast notification at the bottom right of the screen.
// type is "success" (green) or "error" (red).
// Automatically removes itself after 3 seconds of appearing.
function showToast(message, type = "success") {
    // remove any existing toast before showing a new one
    const existing = document.getElementById("toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast toast-" + type;
    toast.textContent = message;
    document.body.appendChild(toast);

    // small delay before adding toast-visible triggers the CSS fade-in transition
    setTimeout(() => toast.classList.add("toast-visible"), 10);

    // remove the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove("toast-visible");
        setTimeout(() => toast.remove(), 400); // wait for fade-out to finish
    }, 3000);
}

// setButtonLoading 
// Disables a button and changes the label while a request is running.
// Prevents double-submission if the user clicks twice quickly.
// Pass isLoading=false to re-enable the button after the request finishes.
function setButtonLoading(btn, isLoading) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent; // save original label
        btn.textContent = "Loading…";
    } else {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || "Submit";
    }
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
    // confirmation required before any destructive action
    if (!confirm(`Are you sure you want to delete the record for ${year}? This cannot be undone.`)) return;

    const sql = `DELETE FROM AnnualEmissionsRecord WHERE Year = ${year}`;

    const response = await fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();

    if (result.success) {
        showToast(`Record for ${year} deleted successfully.`, "success");
        fetchRecords();
    } else {
        showToast("Delete failed: " + (result.error || "unknown error"), "error");
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
    const btn = document.getElementById("submitBtn");

    if (!year || !emissions) {
        showToast("All fields are required.", "error");
        return;
    }

    if (year < 2000 || year > 2100) {
        showToast("Year must be between 2000 and 2100.", "error");
        return;
    }

    if (emissions < 0) {
        showToast("Emissions cannot be negative.", "error");
        return;
    }

    // disable the button while the request runs to prevent double-submission
    setButtonLoading(btn, true);

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
        showToast(selectedYear ? "Record updated successfully." : "Record added successfully.", "success");
        resetForm();
        fetchRecords();
    } else {
        showToast("Operation failed: " + (result.error || "unknown error"), "error");
    }

    // re-enable button after success or failure
    setButtonLoading(btn, false);
}