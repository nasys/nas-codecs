# NAS Payload Codec
## Supported devices
- UL2002, UL2014, UL2020, UL2021, UL2030 with 1.0.x firmwares. Note: does not support _legacy_status_packet_.
- CM3011, CM3021, CM3022, CM3030, CM3040, CM3061, CM3080, CM3120, CM3130 with 1.3.x and 2.3.x firmwares.
- UM3070, UM3081, UM3090, UM3100, UM3110 with 4.0.x firmware.

## Codec Overview
- Written in ES5 javascript (ES5 required by e.g. chirpstack and TTN).
- `decodeRaw()` output raw JSON objects. On UL20xx each data-point contains _value_ key plus optionally _raw_, _unit_ etc. On CM30xx and UM30xx key of data-point contains unit (e.g. accumulated_volume__m3) and sometimes __formatted field.
- Raw output can be easily re-formatted or used programmatically. Default `convertToFormatted()` converts raw to compact format where _value_ and _unit_ are concatenated and serves as an example.
- Serves as annex for respective Payload Description documents.

## Live decoding example
Download .html file in [generated](https://github.com/nasys/nas-codecs/tree/main/generated) folder and open in brower to decode payloads.

# Reporting errors
Please report issues in Github Issues page.

# Getting started
Test the codec in browser by opening generated/cm30xx_decoder.html.

For testing on your platform download respective file from generated/ folder and modify/replace the entry function `decodeRaw()`. Inside that function the output can also be reformatted however is needed.

Since new features are added occasionally and bugs fixed, the library will be updated.
Re-generating codec files with custom entry function can be achieved by modifying default entry functions in config/ folder and then generating the js files again (see Rebuild below).

## Installation
must have Node installed / npm
`npm install`

## Running tests:
`npm test`

## Rebuild
`npm run build_cm30xx`
`npm run build_cm30xx_html`

`npm run build_um30xx`
`npm run build_um30xx_html`

`npm run build_ul20xx`
`npm run build_ul20xx_html`

## Coverage overlay in VS Code
install VS Code 'Jest' extension
Cmd+P Command pallete: Jest: Start All Runners 
Cmd+P Command pallete: Jest: Toggle Coverage

