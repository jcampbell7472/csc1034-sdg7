const url = "../dbConnector.php";

const RunQuery = async () => {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded"},
        body: "query=" + encodeURIComponent(query)
    });

    const result = await response.json();
    return result.data;
}

const chart1 = async () => {
    const records = await RunQuery("SELECT * vw_greatestFossilRegions")

    const regionYears = [];
    const totalGWhs = [];

    for(let i=0; i<data.records.length; i++){
        regionYears.push(records[i].regionYear);
        totalGWhs.push(parseFloat(records[i].TotalGWhs));
    }

    new chart(document.getElementById("bar1"), {
        type: "bar",
        data: {
            labels: regionYears,
            datasets: [{
                backgroundColor: "237819",
                data: totalGWhs
            }]
        }
    });
}

const chart2 = async () => {
    const records = await RunQuery("SELECT * vw_RegionalEnergyDifference")

    const regionYears = [];
    const renewPercent = [];

    for(let i=0; i<data.records.length; i++){
        regionYears.push(records[i].regionYear);
        renewPercent.push(parseFloat(records[i].RenewablePercentDiff));
    }

    new chart(document.getElementById("bar2"), {
        type: "bar",
        data: {
            labels: regionYears,
            datasets: [{
                backgroundColor: "237819",
                data: renewPercent 
            }]
        }
    });
}

const chart3 = async () => {
    const records = await RunQuery("SELECT CONCAT(gr.Year, ' ', es.SourceName) AS YearSource, gr.Generation_GWh FROM GenerationRecord gr LEFT JOIN EnergySource es ON gr.SourceID = es.SourceID WHERE es.SourceName IN ('Solar', 'Wind') ORDER BY gr.Year, es.SourceName DESC;")

    const yearSource = [];
    const gen_GWhs = [];

    for(let i=0; i<data.records.length; i++){
        regionYears.push(records[i].YearSource);
        gen_GWhs.push(parseFloat(records[i].Generation_GWh));
    }

    new chart(document.getElementById("bar3"), {
        type: "bar",
        data: {
            labels: yearSource,
            datasets: [{
                backgroundColor: "237819",
                data: gen_GWhs
            }]
        }
    });
}

chart1();
chart2();
chart3();