
class CSVHelper {

    generateCSV(headers, rows, filename) {        
        let csvContent = "data:text/csv;charset=utf-8,";

        csvContent += headers.join(',') + "\r\n";
        
        rows.forEach(function(rowArray) {
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link); // Required for FF

        link.click(); // This will download the data file named "my_data.csv".
    }
}

export default new CSVHelper()