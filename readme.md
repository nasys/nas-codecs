# NAS Payload Codec
## Supported devices
- UL2002, UL2014, UL2020, UL2021, UL2030 with 1.0.x firmwares. Note: does not support _legacy_status_packet_.
- CM3011, CM3021, CM3022, CM3030, CM3040, CM3061, CM3080, CM3120, CM3130 with 1.3.x and 2.3.x firmwares. Note: 1.3.x and 2.3.x protocol is identical, major version number signifies used radio chipset.
- UM3070, UM3081, UM3090, UM3100, UM3110 with 4.0.x firmware.

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

## Live decoding example
Download .html file in [generated](https://github.com/nasys/nas-codecs/tree/main/generated) folder and open in brower to decode payloads.

## Decoding output Example
<details>
  <summary>Decoded UL20xx status packet</summary>
```
{
  "data": {
    "packet_type": "status_packet",
    "device_unix_epoch": "2020-01-14T14:49:03.000Z",
    "status_field": {
      "dali_error_external": "false",
      "dali_error_connection": "false",
      "ldr_state": "false",
      "dig_state": "false",
      "hardware_error": "false",
      "firmware_error": "false",
      "internal_relay_state": "false"
    },
    "downlink_rssi": "-75 dBm",
    "downlink_snr": "4 dB",
    "mcu_temperature": "21 °C",
    "analog_interfaces": {
      "open_drain_out_state": "false",
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
        "dali_address_short": "single 5",
        "days_active": "holiday,mon,tue,wed,thu,fri,sat,sun",
        "dimming_level": "50 %"
      },
      {
        "profile_id": "3",
        "profile_version": "3",
        "profile_override": "none",
        "dali_address_short": "single 3",
        "days_active": "holiday,mon,tue,wed,thu,fri,sat,sun",
        "dimming_level": "0 %"
      }
    ]
  },
  "errors": [],
  "warnings": []
}
```  
</details>

# Reporting errors
Please report issues in Github Issues page.

# Getting started
First test the codec in browser by opening generated/cm30xx_decoder.html.

For testing on your platform download respective file from generated/ folder and modify/replace the entry function to call `decodeRaw()`. Inside that function the output can also be reformatted however is needed.

Since new features are added occasionally and bugs fixed, the library will be updated.
Re-generating codec files with custom entry function can be achieved by modifying default entry functions in config/ folder and then generating the js files again (see Rebuild below).

## Installation
Only needed if one wants to regenerate the output or run tests etc.
Node must be installed. To install dependencies:
`npm install`

## Running tests:
`npm test`

## Rebuild
`npm run build_cm30xx_2_3_x`
`npm run build_cm30xx_2_3_x_html`

`npm run build_um30xx_4_0_x`
`npm run build_um30xx_4_0_x_html`

`npm run build_ul20xx_1_0_x`
`npm run build_ul20xx_1_0_x_html`


## Coverage overlay in VS Code
install VS Code 'Jest' extension
Cmd+P Command pallete: Jest: Start All Runners 
Cmd+P Command pallete: Jest: Toggle Coverage

