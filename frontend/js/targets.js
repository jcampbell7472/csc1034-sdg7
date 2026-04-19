const showMessage = (text, type) => {
    const output = document.querySelector("#output");
    output.textContent = text;
    output.className = type;
};

let selectedYear = null;

const fetchTargets = async () => {
    const sql = "SELECT TargetYear, RenewableTarget_Pct, EmissionsTarget_MtCO2e FROM EnergyEmissionsTarget ORDER BY TargetYear";

    const response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();
    const tbody = document.querySelector("#targetsBody");
    tbody.innerHTML = "";

    for (const row of result.data) {
        tbody.innerHTML += `<tr>
            <td>${row.TargetYear}</td>
            <td>${row.RenewableTarget_Pct}</td>
            <td>${row.EmissionsTarget_MtCO2e}</td>
            <td>
                <button onclick="editTarget('${row.TargetYear}', ${row.RenewableTarget_Pct}, ${row.EmissionsTarget_MtCO2e})">Edit</button>
                <button onclick="deleteTarget('${row.TargetYear}')">Delete</button>
            </td>
        </tr>`;
    }
};

fetchTargets();

const deleteTarget = async (year) => {
    const shouldDelete = confirm("Are you sure you want to delete this target?");
    if (!shouldDelete) return;

    const sql = `DELETE FROM EnergyEmissionsTarget WHERE TargetYear = ${year}`;

    const response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();

    if (result.success) {
        showMessage("Target deleted successfully.", "success");
        fetchTargets();
    } else {
        showMessage("Failed to delete target.", "error");
    }
};

const editTarget = (year, renewablePct, emissionsTarget) => {
    selectedYear = year;
    document.querySelector("#targetYear").value = year;
    document.querySelector("#renewablePct").value = renewablePct;
    document.querySelector("#emissionsTarget").value = emissionsTarget;
    document.querySelector("#formTitle").textContent = "Edit Target";
    document.querySelector("#submitBtn").textContent = "Update Target";
};

const resetForm = () => {
    selectedYear = null;
    document.querySelector("#targetYear").value = "";
    document.querySelector("#renewablePct").value = "";
    document.querySelector("#emissionsTarget").value = "";
    document.querySelector("#formTitle").textContent = "Add Target";
    document.querySelector("#submitBtn").textContent = "Add Target";
};

const submitForm = async () => {
    const targetYear = document.querySelector("#targetYear").value.trim();
    const renewablePct = document.querySelector("#renewablePct").value.trim();
    const emissionsTarget = document.querySelector("#emissionsTarget").value.trim();

    if (!targetYear || !renewablePct || !emissionsTarget) {
        showMessage("All fields are required.", "error");
        return;
    }

    if (targetYear < 2024 || targetYear > 2100) {
        showMessage("Please enter a valid future year.", "error");
        return;
    }

    if (renewablePct < 0 || renewablePct > 100) {
        showMessage("Renewable target must be between 0 and 100.", "error");
        return;
    }

    if (emissionsTarget < 0) {
        showMessage("Emissions target cannot be negative.", "error");
        return;
    }

    const submitBtn = document.querySelector("#submitBtn");
    submitBtn.disabled = true;

    let sql;

    if (selectedYear) {
        sql = `UPDATE EnergyEmissionsTarget SET RenewableTarget_Pct = ${renewablePct}, EmissionsTarget_MtCO2e = ${emissionsTarget} WHERE TargetYear = ${selectedYear}`;
    } else {
        sql = `INSERT INTO EnergyEmissionsTarget (TargetYear, RenewableTarget_Pct, EmissionsTarget_MtCO2e) VALUES (${targetYear}, ${renewablePct}, ${emissionsTarget})`;
    }

    const response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql })
    });

    const result = await response.json();

    if (result.success) {
        showMessage(selectedYear ? "Target updated successfully." : "Target added successfully.", "success");
        resetForm();
        fetchTargets();
    } else {
        showMessage("Operation failed. Please try again.", "error");
    }

    submitBtn.disabled = false;
};