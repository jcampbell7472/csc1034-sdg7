const url = "https://jcampbell2052.webhosting1.eeecs.qub.ac.uk/dbConnector.php";

const RunQuery = async (query) => {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded"},
        body: "query=" + encodeURIComponent(query)
    });

    const result = await response.json();

    if (result.error){
        console.error("Server Error", result.error)
        console.log("Failed query:", query);
        return [];
    }
    return result.data;
}

const chart1 = async () => {
    const records = await RunQuery("SELECT * FROM vw_greatestFossilRegions");

    const regionYears = [];
    const totalGWhs = [];

    for(let i=0; i<records.length; i++){
        regionYears.push(records[i].RegionYear);
        totalGWhs.push(parseFloat(records[i].TotalGWh));
    }

    new Chart(document.getElementById("bar1"), {
        type: "bar",
        data: {
            labels: regionYears,
            datasets: [{
                label: "Year and region",
                backgroundColor: "#237819",
                data: totalGWhs
            }]
        }
    });
}

const chart2 = async () => {
    const records = await RunQuery("SELECT * FROM vw_RegionalEnergyDifference");

    const regionYears = [];
    const renewPercent = [];

    for(let i=0; i<records.length; i++){
        regionYears.push(records[i].RegionYear);
        renewPercent.push(parseFloat(records[i].RenewablePercentDiff));
    }

    new Chart(document.getElementById("bar2"), {
        type: "bar",
        data: {
            labels: regionYears,
            datasets: [{
                label: "Year and region",
                backgroundColor: "#237819",
                data: renewPercent 
            }]
        }
    });
}

const chart3 = async () => {
    const records = await RunQuery(`SELECT CONCAT(gr.Year, ' ', es.SourceName) AS YearSource, gr.Generation_GWh FROM GenerationRecord gr LEFT JOIN EnergySource es ON gr.SourceID = es.SourceID WHERE es.SourceName IN ('Solar', 'Wind') ORDER BY gr.Year, es.SourceName DESC;`);

    const yearSource = [];
    const gen_GWhs = [];
    
    if (!records || records.length === 0) return;
    
    for(let i=0; i<records.length; i++){
        yearSource.push(records[i].YearSource);
        gen_GWhs.push(parseFloat(records[i].Generation_GWh));
    }

    new Chart(document.getElementById("bar3"), {
        type: "bar",
        data: {
            labels: yearSource,
            datasets: [{
                label: "Year and source",
                backgroundColor: "#237819",
                data: gen_GWhs
            }]
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    chart1();
    chart2();
    chart3();
});