# NAS Payload Codec
## Supported devices
- __cm30xx__: _CM3011, CM3021, CM3022, CM3030, CM3040, CM3061, CM3080, CM3120, CM3130_ with 1.3.x and 2.3.x firmwares. Note: 1.3.x and 2.3.x protocol is identical, major version number signifies used radio chipset.
- __ul20xx__: _UL2002, UL2014, UL2020, UL2021, UL2030_ with 1.0.x and 1.1.x firmwares. Note: does not support _legacy_status_packet_.
- __um30xx__: _UM3070, UM3081, UM3090, UM3100, UM3110_ with 4.0.x firmware.

## Live decoding example
[CM30xx 1.3.x / 2.3.x live decoder](https://nasys.github.io/nas-codecs/generated/cm30xx_2_3_x_decoder.html)

[UL20xx 1.0.x live decoder](https://nasys.github.io/nas-codecs/generated/ul20xx_1_0_x_decoder.html)

[UL20xx 1.1.x live decoder](https://nasys.github.io/nas-codecs/generated/ul20xx_1_1_x_decoder.html)

[UM30xx live decoder](https://nasys.github.io/nas-codecs/generated/um30xx_4_0_x_decoder.html)

Or download respective .html file in [generated](https://github.com/nasys/nas-codecs/tree/main/generated) folder.

## Using on TTN (or Chirpstack)
- open minified .js file for appropriate device from gerenated folder.
- click on file (like /generated/ul20xx_1_0_x_decoder.min.js)
- click on Raw
- copy everything
- in e.g. TTN Select your LCU Application -> then Payload Formatters -> Uplink -> Formatter type: Custom Javascript Formatter and paste the code there.
- repeat it for Downlink aswell

## Supported platforms
- Chirpstack
- The Things Network (add as Custom Javascript Formatter to both Uplink and Downlink)
- easily adoptable to anything that uses javascript
- at least useful starting point for porting to other platforms / languages
TTN has maximum code limit of 40960 characters. No one thought that anyone needs that much, but yep, some overengineering and there you go. If you see this error just use the minified version, e.g. generated/some_decoder.min.js.

## Codec Overview
- Written in ES5 javascript (ES5 required by e.g. chirpstack and TTN).
- `decodeRaw()` output raw JSON objects. On UL20xx each data-point contains _value_ key plus optionally _raw_, _unit_ etc. On CM30xx and UM30xx key of data-point contains unit (e.g. accumulated_volume__m3) and sometimes __formatted field.
- Raw output can be easily re-formatted or used programmatically. Default `convertToFormatted()` converts raw to compact format where _value_ and _unit_ are concatenated and serves as an example.
- Serves as annex for respective Payload Description documents.

## Structure
Structure is based on TTN.

__data__ - the decoded output.

__errors__ - payload parsing errors, field ommited if None 

__warnings__ - alerts from the device, field ommited if None
```
{
  "data": {},
  "errors": [],
  "warnings": []
}
```

## Decoding output Example
```
{
  "data": {
    "packet_type": "status_packet",
    "device_unix_epoch": "2020-01-14T14:49:03.000Z",
    "status": {
      "dali_error_external": "false",
      "dali_connection_error": "false",
      "ldr_on": "false",
      "dig_on": "false",
      "hardware_error": "false",
      "internal_relay_closed": "false"
      "open_drain_output_on": "false",
    },
    "downlink_rssi": "-75 dBm",
    "downlink_snr": "4 dB",
    "mcu_temperature": "21 °C",
    "analog_interfaces": {
      "voltage_alert_in_24h": "false",
      "lamp_error_alert_in_24h": "false",
      "power_alert_in_24h": "false",
      "power_factor_alert_in_24h": "false"
    },
    "ldr_value": "174",
    "profiles": [
      {
        "profile_id": "5",
        "profile_version": "5",
        "profile_override": "none",
        "dali_address_short": "dali_single_5",
        "days_active": "holiday,mon,tue,wed,thu,fri,sat,sun",
        "dimming_level": "50 %"
      },
      {
        "profile_id": "3",
        "profile_version": "3",
        "profile_override": "none",
        "dali_address_short": "dali_single_3",
        "days_active": "holiday,mon,tue,wed,thu,fri,sat,sun",
        "dimming_level": "0 %"
      }
    ]
  }
}
```  

# Reporting errors
Please report issues in Github Issues page.

# Getting started
First test the codec Live - See Live decoding example above.

For testing on your platform download respective file from generated/ folder and modify/replace the entry function to call `decodeRaw()`. Inside that function the output can also be reformatted however is needed.

Since new features are added occasionally and bugs fixed, the library will be updated.
Re-generating codec files with custom entry function can be achieved by modifying default entry functions in config/ folder and then generating the js files again (see Rebuild below).

## Installation
Only needed if one wants to regenerate the output or run tests etc.
Node must be installed. To install dependencies:
`npm install`

## Build
`npm run build_cm30xx_2_3_x && npm run build_cm30xx_2_3_x_html`
`npm run build_ul20xx_1_0_x && npm run build_ul20xx_1_0_x_html`
`npm run build_ul20xx_1_1_x && npm run build_ul20xx_1_1_x_html`
`npm run build_um30xx_4_0_x && npm run build_um30xx_4_0_x_html`

## Running tests:
`npm test`
If src folder has been modified, run at least first half of the build command (generating html not needed).
`npm run build_cm30xx_2_3_x && npm run build_um30xx_4_0_x && npm run build_ul20xx_1_0_x && npm run build_ul20xx_1_1_x && npm test`


## Coverage overlay in VS Code
install VS Code 'Jest' extension
Cmd+P Command pallete: Jest: Start All Runners 
Cmd+P Command pallete: Jest: Toggle Coverage

