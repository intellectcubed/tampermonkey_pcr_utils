// ==UserScript==
// @name         PCR Toolbar
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  PCR Toolbar enhancement script - Automates populating call times
// @author       Your Name
// @match        https://newjersey.imagetrendelite.com/Elite/Organizationnewjersey/Agencymartinsvil/EmsRunForm
// @icon         https://www.google.com/s2/favicons?sz=64&domain=imagetrendelite.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Field mapping configuration - Update field IDs here as needed
    const fieldMapping = {
        "incidentTimes": {
            "cad": "819240",
            "times": {
                "notifiedByDispatch": {
                    "date": "819243Date",
                    "time": "819243Time"
                },
                "enRoute": {
                    "date": "819245Date",
                    "time": "819245Time"
                },
                "onScene": {
                    "date": "819246Date",
                    "time": "819246Time"
                },
                "arrivedAtPatient": {
                    "date": "819247Date",
                    "time": "819247Time"
                },
                "leftScene": {
                    "date": "819248Date",
                    "time": "819248Time"
                },
                "ptArrivedAtDestination": {
                    "date": "819249Date",
                    "time": "819249Time"
                },
                "destinationPatientTransferOfCare": {
                    "date": "819250Date",
                    "time": "819250Time"
                },
                "backInService": {
                    "date": "819251Date",
                    "time": "819251Time"
                }
            }
        }
    };

    // File input element for data files
    let dataFileInput = null;

    // Stored call times data
    let callTimesData = null;

    // UI elements
    let callTimesBtn = null;
    let statusIndicator = null;

    /**
     * Sleep/delay function
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise}
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Click a section by its name
     * @param {string} sectionName - The section name to click
     */
    function clickSection(sectionName) {
        const label = Array.from(document.querySelectorAll('.section .text-padding'))
            .find(el => el.textContent.trim() === sectionName);

        if (label) {
            label.closest('.section').click();
            console.log(`Clicked ${sectionName} section.`);
            return true;
        } else {
            console.log(`Section "${sectionName}" not found.`);
            return false;
        }
    }

    /**
     * Navigate to the Mileage/CAD/Times section
     */
    async function navigateToMileageSection() {
        console.log('Starting navigation to Mileage/CAD/Times section...');

        // Click Dispatch Info
        if (!clickSection("Dispatch Info")) {
            throw new Error('Failed to click "Dispatch Info" section');
        }

        // Wait 5 seconds
        await sleep(5000);

        // Click Mileage / CAD / Times
        if (!clickSection("Mileage / CAD / Times")) {
            throw new Error('Failed to click "Mileage / CAD / Times" section');
        }

        // Wait 5 seconds for section to load
        await sleep(5000);

        console.log('Navigation complete');
    }

    /**
     * Set value of a form field by ID
     * @param {string} fieldId - The ID of the field
     * @param {string} value - The value to set
     */
    function setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
            // Trigger change event in case the page listens for it
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('input', { bubbles: true }));
            console.log(`Set field ${fieldId} = ${value}`);
            return true;
        } else {
            console.warn(`Field with ID "${fieldId}" not found`);
            return false;
        }
    }

    /**
     * Populate fields based on data and field mapping
     * @param {object} data - The call times data
     */
    function populateFields(data) {
        if (!fieldMapping) {
            throw new Error('Field mapping configuration not loaded');
        }

        if (!data.incidentTimes) {
            throw new Error('Invalid data format: missing incidentTimes');
        }

        let successCount = 0;
        let failCount = 0;

        // Populate CAD number
        if (data.incidentTimes.cad && fieldMapping.incidentTimes.cad) {
            if (setFieldValue(fieldMapping.incidentTimes.cad, data.incidentTimes.cad)) {
                successCount++;
            } else {
                failCount++;
            }
        }

        // Populate time fields
        if (data.incidentTimes.times && fieldMapping.incidentTimes.times) {
            const times = data.incidentTimes.times;
            const timeMappings = fieldMapping.incidentTimes.times;

            for (const [key, value] of Object.entries(times)) {
                if (timeMappings[key]) {
                    // Set date field
                    if (value.date && timeMappings[key].date) {
                        if (setFieldValue(timeMappings[key].date, value.date)) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    }

                    // Set time field
                    if (value.time && timeMappings[key].time) {
                        if (setFieldValue(timeMappings[key].time, value.time)) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    }
                }
            }
        }

        console.log(`Population complete: ${successCount} succeeded, ${failCount} failed`);
        return { successCount, failCount };
    }

    /**
     * Read and parse JSON file
     * @param {File} file - The file to read
     * @returns {Promise<object>}
     */
    function readJsonFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    resolve(json);
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Handle Load Info button click
     */
    async function handleLoadInfoClick() {
        try {
            showMessage('Select call times data file...', 'info');

            const data = await new Promise((resolve, reject) => {
                dataFileInput.onchange = async (e) => {
                    try {
                        const file = e.target.files[0];
                        if (!file) {
                            reject(new Error('No file selected'));
                            return;
                        }

                        console.log('Loading call times data file...');
                        const jsonData = await readJsonFile(file);
                        console.log('Data loaded successfully', jsonData);
                        resolve(jsonData);
                    } catch (error) {
                        console.error('Data load error:', error);
                        reject(error);
                    }
                };

                // Trigger file picker
                dataFileInput.click();
            });

            // Store the loaded data
            callTimesData = data;

            // Enable Call Times button
            callTimesBtn.disabled = false;
            callTimesBtn.style.opacity = '1';
            callTimesBtn.style.cursor = 'pointer';

            // Update status indicator
            statusIndicator.textContent = '✓ Data Loaded';
            statusIndicator.style.display = 'inline-block';
            statusIndicator.style.color = '#4CAF50';

            showMessage('Call times data loaded successfully', 'success');

        } catch (error) {
            console.error('Error loading info:', error);
            showMessage(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Handle Call Times button click
     */
    async function handleCallTimesClick() {
        try {
            // Check if data is loaded
            if (!callTimesData) {
                showMessage('Please load call times data first', 'error');
                return;
            }

            // Navigate to the correct section
            // TODO: Fix navigation - currently not working
            // showMessage('Navigating to Mileage/CAD/Times section...', 'info');
            // await navigateToMileageSection();

            // Populate fields
            showMessage('Populating fields...', 'info');
            const result = populateFields(callTimesData);

            // Show success message
            if (result.failCount === 0) {
                showMessage(`Successfully populated ${result.successCount} fields`, 'success');
            } else {
                showMessage(`Populated ${result.successCount} fields, ${result.failCount} failed`, 'warning');
            }

        } catch (error) {
            console.error('Error:', error);
            showMessage(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Show a message to the user
     * @param {string} message - The message to display
     * @param {string} type - Message type: info, success, error, warning
     */
    function showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('pcr-toolbar-message');
        if (!messageDiv) return;

        const colors = {
            info: '#2196F3',
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800'
        };

        messageDiv.textContent = message;
        messageDiv.style.backgroundColor = colors[type] || colors.info;
        messageDiv.style.display = 'block';

        // Auto-hide after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Create the toolbar UI
     */
    function createToolbar() {
        // Create toolbar container
        const toolbar = document.createElement('div');
        toolbar.id = 'pcr-toolbar';
        toolbar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 37px;
            background-color: #1976D2;
            color: white;
            display: flex;
            align-items: center;
            padding: 0 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        // Create toolbar title
        const title = document.createElement('span');
        title.textContent = 'PCR Toolbar';
        title.style.cssText = `
            font-weight: bold;
            margin-right: 15px;
            font-size: 12px;
        `;
        toolbar.appendChild(title);

        // Create Load Info button
        const loadInfoBtn = document.createElement('button');
        loadInfoBtn.textContent = 'Load Info';
        loadInfoBtn.style.cssText = `
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
            margin-right: 8px;
        `;
        loadInfoBtn.addEventListener('click', handleLoadInfoClick);
        loadInfoBtn.addEventListener('mouseenter', () => {
            loadInfoBtn.style.backgroundColor = '#66BB6A';
        });
        loadInfoBtn.addEventListener('mouseleave', () => {
            loadInfoBtn.style.backgroundColor = '#4CAF50';
        });
        toolbar.appendChild(loadInfoBtn);

        // Create Call Times button (initially disabled)
        callTimesBtn = document.createElement('button');
        callTimesBtn.textContent = 'Call Times';
        callTimesBtn.disabled = true;
        callTimesBtn.style.cssText = `
            background-color: #FFC107;
            color: #000;
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: not-allowed;
            font-size: 11px;
            font-weight: bold;
            margin-right: 8px;
            opacity: 0.5;
        `;
        callTimesBtn.addEventListener('click', handleCallTimesClick);
        callTimesBtn.addEventListener('mouseenter', () => {
            if (!callTimesBtn.disabled) {
                callTimesBtn.style.backgroundColor = '#FFD54F';
            }
        });
        callTimesBtn.addEventListener('mouseleave', () => {
            if (!callTimesBtn.disabled) {
                callTimesBtn.style.backgroundColor = '#FFC107';
            }
        });
        toolbar.appendChild(callTimesBtn);

        // Create status indicator
        statusIndicator = document.createElement('span');
        statusIndicator.style.cssText = `
            font-size: 11px;
            font-weight: bold;
            margin-left: 8px;
            display: none;
        `;
        toolbar.appendChild(statusIndicator);

        // Create message display area
        const messageDiv = document.createElement('div');
        messageDiv.id = 'pcr-toolbar-message';
        messageDiv.style.cssText = `
            margin-left: auto;
            padding: 6px 12px;
            border-radius: 3px;
            font-size: 11px;
            display: none;
        `;
        toolbar.appendChild(messageDiv);

        // Create hidden file input for data files
        dataFileInput = document.createElement('input');
        dataFileInput.type = 'file';
        dataFileInput.accept = '.json';
        dataFileInput.style.display = 'none';

        // Add to page
        document.body.insertBefore(toolbar, document.body.firstChild);
        document.body.appendChild(dataFileInput);

        // Adjust page content to account for fixed toolbar
        document.body.style.paddingTop = '37px';

        console.log('PCR Toolbar created successfully');
    }

    /**
     * Initialize the script
     */
    function init() {
        console.log('PCR Toolbar script initializing...');
        console.log('Field mapping configuration loaded:', fieldMapping);

        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createToolbar);
        } else {
            createToolbar();
        }
    }

    // Start the script
    init();

})();
