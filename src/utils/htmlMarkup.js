export const generateTableRow = ({ xml, info }) => {
  const receipt = info.data.map((item) => `<pre>${item.text.trim()}</pre>`);
  return `
  <tr>
    <td colspan="2" >Global No.: ${
      info.info.nGlobalReceipt
    }&nbsp;&nbsp; DI: ${Number(
    info.info.numberDI
  )}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${getDateFormate(
    info.info.dateTime
  )}</td>
  </tr>
  <tr>
    <td>${receipt.join("")}</td>
    <td>${xml}</td>
  </tr>
`;
};

const getDateFormate = (date) => {
  const { day, month, year, hour, min, sec } = date;
  return `${day}-${month + 1}-${year + 1900}  ${hour}:${min}:${sec}`;
};

// Function to generate the HTML content dynamically
export const generateHeaderHTML = () => {
  const header = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dynamic HTML Table</title>
      <style>
      body {
        font-size: 12px;
      }
      pre {
        margin: 0;
        padding: 0;
        font-family: monospace;
      }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid black;
          padding: 8px;
        }
      </style>
    </head>
    <body>
      <h1>Text and XML Table</h1>
      <table>
        <thead>
          <tr>
            <th>Text</th>
            <th>XML</th>
          </tr>
        </thead>
        <tbody>
  `;

  return header;
};

export const generateFooterHTML = () => {
  return `
        </tbody>
      </table>
    </body>
    </html>
  `;
};
