# PCR Toolbar

Tampermonkey script that automates populating call times on the New Jersey EMS run form.

## Features

- Creates a fixed toolbar at the top of the page
- **Call Times** button - Loads call times data from a JSON file and auto-populates form fields
- **Load Config** button - Loads field mapping configuration
- Automatic navigation to the correct form sections
- Visual feedback with status messages
- Error handling and validation

## Installation

### 1. Install Tampermonkey

Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension for your browser:
- [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

### 2. Install the Script

1. Open Tampermonkey dashboard
2. Click the "+" tab to create a new script
3. Copy the contents of `src/pcr_toolbar.user.js`
4. Paste into the Tampermonkey editor
5. Save (Ctrl+S or Cmd+S)

**Or** if you have the script hosted on GitHub:
1. Navigate to the raw `.user.js` file URL
2. Tampermonkey will automatically detect it and prompt for installation

## Configuration

### Field Mapping Configuration File

The script needs a field mapping configuration file that maps JSON field names to HTML element IDs on the form.

1. Use the example at `examples/field_mapping.json` as a template
2. Update the element IDs to match your form's actual field IDs
3. Save the file locally on your computer

**Format:**
```json
{
  "incidentTimes": {
    "cad": "819240",
    "times": {
      "notifiedByDispatch": {
        "date": "819243Date",
        "time": "819243Time"
      },
      ...
    }
  }
}
```

## Usage

### First Time Setup

1. Navigate to the EMS run form page
2. The PCR Toolbar should appear at the top of the page
3. Click **Load Config** button
4. Select your `field_mapping.json` file
5. You should see "Configuration loaded successfully"

### Populating Call Times

1. Prepare your call times data file (see `examples/call_info.json`)
2. Click the **Call Times** button
3. If config isn't loaded, you'll be prompted to load it first
4. Select your call times JSON file
5. The script will:
   - Navigate to "Dispatch Info" section
   - Navigate to "Mileage / CAD / Times" section
   - Populate all date and time fields
   - Show success/error message

### Call Times Data Format

Your call times JSON file should follow this structure:

```json
{
  "incidentTimes": {
    "cad": "123456789",
    "times": {
      "notifiedByDispatch": {
        "date": "11/20/2025",
        "time": "00:01:15"
      },
      "enRoute": {
        "date": "11/20/2025",
        "time": "00:06:45"
      },
      ...
    }
  }
}
```

**Date format:** MM/DD/YYYY
**Time format:** HH:MM:SS

## Project Structure

```
pcr_toolbar/
├── src/
│   └── pcr_toolbar.user.js      # Main Tampermonkey script
├── examples/
│   ├── field_mapping.json       # Example configuration file
│   └── call_info.json           # Example call times data
├── prompts/
│   └── initial.md               # Implementation requirements
└── README.md                     # This file
```

## Troubleshooting

### Configuration not loading
- Make sure you're selecting a valid JSON file
- Check browser console (F12) for error messages
- Verify JSON syntax is valid

### Fields not populating
- Check that field IDs in `field_mapping.json` match the actual form field IDs
- Inspect the form elements to verify the correct IDs
- Check console for "Field with ID not found" warnings

### Navigation not working
- Section names must match exactly (case-sensitive)
- Check console logs to see which section failed
- You may need to adjust the section names in the code

### Script not loading
- Verify the `@match` pattern includes your form URL
- Check Tampermonkey is enabled for the site
- Look for errors in the Tampermonkey dashboard

## Development

### Testing Locally

1. Edit `src/pcr_toolbar.user.js`
2. Copy the updated code
3. Paste into Tampermonkey editor
4. Save
5. Reload the page

### Finding Field IDs

1. Open browser DevTools (F12)
2. Click the element inspector (or press Ctrl+Shift+C)
3. Click on a form field
4. Look for the `id` attribute in the HTML
5. Update your `field_mapping.json` with the correct IDs

## License

This is a personal automation script. Use at your own discretion.
