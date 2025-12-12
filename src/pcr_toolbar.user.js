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
// @grant        unsafeWindow
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
        },
        "incidentLocation": {
            "location_name": "850922",
            "street_address": "819256",
            "apartment": "819258",
            "zip_code": "819259"
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
     * Get incident data from unsafeWindow.EMSIncidentData (set by ems-incident-integration script)
     * @returns {object|null}
     */
    function getIncidentData() {
        try {
            // Read from unsafeWindow.EMSIncidentData which is set by ems-incident-integration.user.js
            if (unsafeWindow.EMSIncidentData) {
                return unsafeWindow.EMSIncidentData;
            }
            return null;
        } catch (error) {
            console.error('Error getting incident data:', error);
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
     * Check if we're on the Incident Address page
     * @returns {boolean}
     */
    function isOnAddressPage() {
        const panelHeader = document.getElementById('panel-header');
        if (!panelHeader) {
            return false;
        }
        return panelHeader.textContent.trim() === 'Incident Address';
    }

    /**
     * Update button states based on current page and data availability
     */
    function updateButtonStates() {
        const incidentData = getIncidentData();
        const onTimesPage = isOnTimesPage();
        const onAddressPage = isOnAddressPage();
        const hasData = incidentData !== null;

        // Update Times button - only active on Times page
        if (timesBtn) {
            const shouldEnableTimes = onTimesPage && hasData;
            timesBtn.disabled = !shouldEnableTimes;
            if (shouldEnableTimes) {
                timesBtn.style.opacity = '1';
                timesBtn.style.cursor = 'pointer';
            } else {
                timesBtn.style.opacity = '0.5';
                timesBtn.style.cursor = 'not-allowed';
            }
        }

        // Update Address button - only active on Address page
        if (addressBtn) {
            const shouldEnableAddress = onAddressPage && hasData;
            addressBtn.disabled = !shouldEnableAddress;
            if (shouldEnableAddress) {
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

            if (!incidentData.incidentLocation) {
                console.error('No incident location data available');
                return;
            }

            console.log('Populating address fields...');
            const location = incidentData.incidentLocation;
            const mapping = fieldMapping.incidentLocation;
            let successCount = 0;
            let failCount = 0;

            // Populate location_name if available
            if (location.location_name && mapping.location_name) {
                if (setFieldValue(mapping.location_name, location.location_name)) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            // Populate street_address if available
            if (location.street_address && mapping.street_address) {
                if (setFieldValue(mapping.street_address, location.street_address)) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            // Populate apartment if available
            if (location.apartment && mapping.apartment) {
                if (setFieldValue(mapping.apartment, location.apartment)) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            // Populate zip_code and trigger lookup button if available
            if (location.zip_code && mapping.zip_code) {
                if (setFieldValue(mapping.zip_code, location.zip_code)) {
                    successCount++;

                    // Wait a moment for the field to update, then click the lookup button
                    await sleep(500);

                    // Find and click the "Incident Address Postal Code Lookup" button
                    const lookupButton = Array.from(document.querySelectorAll('button'))
                        .find(btn => btn.textContent.trim() === 'Incident Address Postal Code Lookup');

                    if (lookupButton) {
                        lookupButton.click();
                        console.log('Clicked "Incident Address Postal Code Lookup" button');
                    } else {
                        console.warn('Could not find "Incident Address Postal Code Lookup" button');
                    }
                } else {
                    failCount++;
                }
            }

            console.log(`Address population complete: ${successCount} succeeded, ${failCount} failed`);

        } catch (error) {
            console.error('Error:', error);
        }
    }

    /**
     * Handle Debug button click
     */
    function handleDebugClick() {
        console.log('=== PCR TOOLBAR DEBUG INFO ===');

        // Check incident data
        const incidentData = getIncidentData();
        console.log('Incident Data exists:', incidentData !== null);
        console.log('Incident Data:', incidentData);

        // Check panel header
        const panelHeader = document.getElementById('panel-header');
        console.log('panel-header element found:', panelHeader !== null);
        if (panelHeader) {
            console.log('panel-header textContent:', `"${panelHeader.textContent}"`);
            console.log('panel-header textContent (trimmed):', `"${panelHeader.textContent.trim()}"`);
            console.log('panel-header innerHTML:', panelHeader.innerHTML);
        } else {
            // Try to find it by other means
            console.log('Searching for elements that might be the header...');
            const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="header"], [class*="title"]');
            headers.forEach((header, index) => {
                const text = header.textContent.trim();
                if (text.includes('Mileage') || text.includes('CAD') || text.includes('Times')) {
                    console.log(`Possible header ${index}:`, {
                        element: header.tagName,
                        id: header.id,
                        className: header.className,
                        text: text
                    });
                }
            });
        }

        // Check page state
        const onTimesPage = isOnTimesPage();
        console.log('isOnTimesPage():', onTimesPage);

        // Check button states
        console.log('Times button disabled:', timesBtn ? timesBtn.disabled : 'button not found');
        console.log('Address button disabled:', addressBtn ? addressBtn.disabled : 'button not found');

        // Check unsafeWindow.EMSIncidentData (shared across scripts)
        console.log('unsafeWindow.EMSIncidentData exists:', unsafeWindow.EMSIncidentData !== undefined);
        console.log('unsafeWindow.EMSIncidentData:', unsafeWindow.EMSIncidentData);

        // Check GM storage raw value (for comparison - won't work across scripts)
        const rawValue = GM_getValue("incident_json");
        console.log('Raw GM_getValue("incident_json") [isolated to this script]:', rawValue);

        console.log('=== END DEBUG INFO ===');
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

        // Create Debug button (always enabled)
        const debugBtn = document.createElement('button');
        debugBtn.textContent = 'Debug';
        debugBtn.style.cssText = `
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            opacity: 1;
            border: 1px solid white;
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 3px;
            margin-left: auto;
        `;
        debugBtn.addEventListener('click', handleDebugClick);
        toolbar.appendChild(debugBtn);

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
