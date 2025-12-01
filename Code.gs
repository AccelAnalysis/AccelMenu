function doGet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DisplayData");
    if (!sheet) throw new Error("Sheet 'DisplayData' not found");

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    
    // Process headers for consistent lookup (lowercase, trim, remove spaces)
    const headers = data[0].map(h => h.toString().trim().toLowerCase().replace(/\s+/g, ''));
    const rows = data.slice(1);

    const tiles = rows.map(row => {
      const t = {};
      headers.forEach((h, i) => {
        let val = row[i];
        if (val === "" || val == null) return;
        val = val.toString().trim();

        const key = h;
        
        // Special parsing for boolean and numerical fields
        if (key.includes("visible")) t.visible = (val.toUpperCase() === "TRUE");
        else if (key.includes("opacity") || key.includes("rotate") || key.includes("zindex")) 
          t[key] = parseFloat(val);
        else if (key.includes("bold")) t.bold = val.toLowerCase();
        else t[key] = val; // Store as string for all other fields
      });
      return t;
    })
    // Filter out tiles explicitly marked as visible: false
    .filter(t => t.visible !== false);

    // Serve the resulting array of tiles as JSON
    return ContentService.createTextOutput(JSON.stringify(tiles)).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    // Return an error message as JSON if anything goes wrong
    return ContentService.createTextOutput(JSON.stringify({error: e.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}