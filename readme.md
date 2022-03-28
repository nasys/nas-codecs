# NAS Payload Codec
## Supported devices
- Decoding NAS all Luminaire Controller Units (LCU) with firmware 1.0.x (does not support _legacy_status_packet_)

## Codec Overview
- Written in ES5 javascript (ES5 required by e.g. chirpstack and TTN etc).
- `decodeRawDownlink()` and `decodeRawUplink()` output raw JSON objects. Each data-point contains _value_ key plus optionally _raw_, _unit_ etc.
- Raw output can be easily re-formatted or used programmatically. Default `toFormatted()` converts raw to compact format where _value_ and _unit_ are concatenated and serves as an example.

## Output of decodeRawDownlink()
```{
  "data": {
    "packet_type": {
      "value": "profile_config_packet"
    },
    "profile_id": {
      "value": 22,
      "raw": 22
    },
    "profile_version": {
      "value": 3,
      "raw": 3
    },
    "profile_override": {
      "value": "none",
      "raw": 3
    },
    "dali_address_short": {
      "value": "broadcast",
      "raw": 254
    },
    "days_active": {
      "value": [
        "mon",
        "tue",
        "wed",
        "thu"
      ],
      "raw": 30
    },
    "dimming_steps": [
      {
        "step_time": {
          "value": "00:00",
          "raw": 0,
        },
        "dimming_level": {
          "value": 0,
          "unit": "%"
        }
      },
      {
        "step_time": {
          "value": "01:00",
          "raw": 60,
        },
        "dimming_level": {
          "value": 30,
          "unit": "%"
        }
      },
      {
        "step_time": {
          "value": "06:00",
          "raw": 360,
        },
        "dimming_level": {
          "value": 80,
          "unit": "%"
        }
      },
      {
        "step_time": {
          "value": "10:00",
          "raw": 600,
        },
        "dimming_level": {
          "value": 30,
          "unit": "%"
        }
      },
      {
        "step_time": {
          "value": "17:00",
          "raw": 1020,
        },
        "dimming_level": {
          "value": 80,
          "unit": "%"
        }
      }
    ]
  },
  "errors": [],
  "warnings": []
}
```
## Same payload formatted with toFormatted()
```{
  "packet_type": "profile config packet",
  "profile_id": "22",
  "profile_version": "3",
  "profile_override": "none",
  "dali_address_short": "broadcast",
  "days_active": "mon,tue,wed,thu",
  "dimming_steps": [
    {
      "step_time": "00:00",
      "dimming_level": "0 %"
    },
    {
      "step_time": "01:00",
      "dimming_level": "30 %"
    },
    {
      "step_time": "06:00",
      "dimming_level": "80 %"
    },
    {
      "step_time": "10:00",
      "dimming_level": "30 %"
    },
    {
      "step_time": "17:00",
      "dimming_level": "80 %"
    }
  ]
}
```
# Getting started
Test the codec in browser by downloading and opening generated/lcu_up_and_downlink_decoder.html.

For testing on your platform download respective file from generated/ folder and modify/replace the entry function `decodeDownlink()` or `decodeUplink()`. Inside that function the output can also be reformatted however is needed.

Since new features are added occasionally and bugs fixed, the library will be updated.
Re-generating codec files with custom entry function can be achieved by modifying default entry functions in config/ folder and then generating the js files again (see Rebuild below).

## Installation
must have Node installed / npm
`npm install`

## Running tests:
`npm test`

## Rebuild
`npm run build_lcu_downlink`
`npm run build_lcu_uplink`
