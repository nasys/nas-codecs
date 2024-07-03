# NAS Codec Chirpstack Installation Guide

1. Navigate to *https://github.com/nasys/nas-codecs/blob/main/generated*
2. Choose the correct **minified** file for your device (`deviceFamily.min.js`) and copy the Raw code. Minified files should be used due to a character limit in Chirpstack. 
3. On Chirpstack, select your desired **Device-Profile**. Navigate to the **Codec** tab
4. For **Payload codec**, select **Custom JavaScript codec function**
5. Paste the copied raw code to the upper window
6. Navigate to **Application**, select your device and any upcoming packages will be parsed into a json format.

## Example parsed output files

- https://github.com/nasys/nas-codecs/blob/main/LCU_chirpstack_example_data.json (parsed data is named as objectJSON)
- https://github.com/nasys/nas-codecs/blob/main/OIR_chirpstack_example_data.json (parsed data is named as objectJSON)
