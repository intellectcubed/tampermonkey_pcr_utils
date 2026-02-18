# Tampermonkey Script Setup Guide (Chrome)

This guide walks you through installing **Tampermonkey** in Google
Chrome and adding the custom user script from this GitHub repository.

------------------------------------------------------------------------

## ✅ Step 1: Install the Tampermonkey Extension

1.  Open **Google Chrome**
2.  Go to the official Tampermonkey extension page in the Chrome Web
    Store:\
    https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
3.  Click **Add to Chrome**
4.  Click **Add Extension** when prompted

Once installed, you should see the Tampermonkey icon (a black square
with white dots) in your browser toolbar.

------------------------------------------------------------------------

## ✅ Step 2: Open the User Script Link

Your script is hosted publicly on GitHub.

Open this link in Chrome:

    https://raw.githubusercontent.com/intellectcubed/mrs_tampermonkey/main/src/pcr_toolbar/pcr_toolbar.user.js

Chrome will display the raw script contents.

------------------------------------------------------------------------

## ✅ Step 3: Install the Script in Tampermonkey

1.  After opening the script URL, Tampermonkey should automatically
    detect it.
2.  You will be redirected to a Tampermonkey install page.
3.  Click the **Install** button in the top-left corner.

Tampermonkey will now add the script to your active userscripts list.

------------------------------------------------------------------------

## ✅ Step 4: Confirm the Script is Enabled

1.  Click the Tampermonkey extension icon in Chrome
2.  Select **Dashboard**
3.  Make sure the script is listed and the toggle is **Enabled**

------------------------------------------------------------------------

## ✅ Step 5: Verify It's Running

1.  Navigate to the Imagetrend website.  
2.  Create a new PCR (you can delete it later)
3.  The toolbar should appear at the top of the page

------------------------------------------------------------------------

## 🆘 Troubleshooting

-   Make sure Tampermonkey is enabled in Chrome Extensions
-   Ensure the script has the correct `@match` rules for your target
    site
-   Refresh the page after installing

------------------------------------------------------------------------

## 📌 Script Source

Installed from:

    https://raw.githubusercontent.com/intellectcubed/mrs_tampermonkey/main/src/pcr_toolbar/pcr_toolbar.user.js

------------------------------------------------------------------------

Happy scripting! 🚀
