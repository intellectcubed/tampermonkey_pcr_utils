// ==UserScript==
// @name         PCR Toolbar
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @description  PCR Toolbar enhancement script - Automates populating call times
// @author       Your Name
// @match        https://newjersey.imagetrendelite.com/Elite/Organizationnewjersey/Agencymartinsvil/EmsRunForm
// @icon         https://www.google.com/s2/favicons?sz=64&domain=imagetrendelite.com
// @updateURL    https://raw.githubusercontent.com/intellectcubed/tampermonkey_pcr_utils/main/src/pcr_toolbar.user.js
// @downloadURL  https://raw.githubusercontent.com/intellectcubed/tampermonkey_pcr_utils/main/src/pcr_toolbar.user.js
// @grant        GM_getValue
// @grant        GM_setValue
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

    // UI elements
    let timesBtn = null;
    let addressBtn = null;
    let incidentNumberSpan = null;

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
     * Get incident data from GM storage
     * @returns {object|null}
     */
    function getIncidentData() {
        try {
            const jsonString = GM_getValue("incident_json");
            if (!jsonString) {
                return null;
            }
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error parsing incident_json:', error);
            return null;
        }
    }

    /**
     * Check if we're on the Mileage/CAD/Times page
     * @returns {boolean}
     */
    function isOnTimesPage() {
        const panelHeader = document.getElementById('panel-header');
        if (!panelHeader) {
            return false;
        }
        return panelHeader.textContent.trim() === 'Mileage / CAD / Times';
    }

    /**
     * Update button states based on current page and data availability
     */
    function updateButtonStates() {
        const incidentData = getIncidentData();
        const onTimesPage = isOnTimesPage();
        const shouldEnable = onTimesPage && incidentData !== null;

        // Update Times button
        if (timesBtn) {
            timesBtn.disabled = !shouldEnable;
            if (shouldEnable) {
                timesBtn.style.opacity = '1';
                timesBtn.style.cursor = 'pointer';
            } else {
                timesBtn.style.opacity = '0.5';
                timesBtn.style.cursor = 'not-allowed';
            }
        }

        // Update Address button
        if (addressBtn) {
            addressBtn.disabled = !shouldEnable;
            if (shouldEnable) {
                addressBtn.style.opacity = '1';
                addressBtn.style.cursor = 'pointer';
            } else {
                addressBtn.style.opacity = '0.5';
                addressBtn.style.cursor = 'not-allowed';
            }
        }

        // Update incident number display
        if (incidentNumberSpan) {
            if (incidentData && incidentData.incidentNumber) {
                incidentNumberSpan.textContent = incidentData.incidentNumber;
                incidentNumberSpan.style.display = 'inline-block';
            } else {
                incidentNumberSpan.textContent = '';
                incidentNumberSpan.style.display = 'none';
            }
        }
    }

    /**
     * Handle Times button click
     */
    async function handleTimesClick() {
        try {
            // Get incident data
            const incidentData = getIncidentData();
            if (!incidentData) {
                console.error('No incident data available');
                return;
            }

            // Populate fields
            console.log('Populating time fields...');
            const result = populateFields(incidentData);

            console.log(`Population complete: ${result.successCount} succeeded, ${result.failCount} failed`);

        } catch (error) {
            console.error('Error:', error);
        }
    }

    /**
     * Handle Address button click
     */
    async function handleAddressClick() {
        try {
            // Get incident data
            const incidentData = getIncidentData();
            if (!incidentData) {
                console.error('No incident data available');
                return;
            }

            // TODO: Implement address population logic
            console.log('Address button clicked - functionality to be implemented');
            console.log('Incident data:', incidentData);

        } catch (error) {
            console.error('Error:', error);
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
            height: 40px;
            background-color: blue;
            color: white;
            display: flex;
            align-items: center;
            padding: 0 15px;
            gap: 12px;
            z-index: 10000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        // Create incident number display
        incidentNumberSpan = document.createElement('span');
        incidentNumberSpan.style.cssText = `
            color: white;
            font-size: 14px;
            font-weight: bold;
            display: none;
        `;
        toolbar.appendChild(incidentNumberSpan);

        // Create Times button (initially disabled)
        timesBtn = document.createElement('button');
        timesBtn.textContent = 'Times';
        timesBtn.disabled = true;
        timesBtn.style.cssText = `
            padding: 6px 12px;
            font-size: 12px;
            cursor: not-allowed;
            opacity: 0.5;
            border: 1px solid white;
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 3px;
        `;
        timesBtn.addEventListener('click', handleTimesClick);
        toolbar.appendChild(timesBtn);

        // Create Address button (initially disabled)
        addressBtn = document.createElement('button');
        addressBtn.textContent = 'Address';
        addressBtn.disabled = true;
        addressBtn.style.cssText = `
            padding: 6px 12px;
            font-size: 12px;
            cursor: not-allowed;
            opacity: 0.5;
            border: 1px solid white;
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 3px;
        `;
        addressBtn.addEventListener('click', handleAddressClick);
        toolbar.appendChild(addressBtn);

        // Add toolbar to page
        document.body.insertBefore(toolbar, document.body.firstChild);

        // Adjust page content to account for fixed toolbar
        document.body.style.paddingTop = '40px';

        console.log('PCR Toolbar created successfully');

        // Set up periodic checks for button state updates
        setInterval(updateButtonStates, 1000);

        // Initial button state update
        updateButtonStates();
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
