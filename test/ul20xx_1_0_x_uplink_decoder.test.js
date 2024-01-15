import { decodeRaw } from '../src/ul20xx_1_0_x_decoder.processed';
import { testPacket } from './utils/test_utils';

describe('Status and usage', () => {
  test('status from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 24,
      data: 'DFD41D5E004B041502AE05050AFF32030306FF00',
      expected: {
        data: {
          "packet_type": "status_packet",
          "device_unix_epoch": "2020-01-14T14:49:03.000Z",
          "status": {
            "dali_error_external": false,
            "dali_connection_error": false,
            "ldr_input_on": false,
            "dig_input_on": false,
            "hardware_error": false,
            "internal_relay_closed": false,
            "open_drain_output_on": false
          },
          "downlink_rssi__dBm": -75,
          "downlink_snr__dB": 4,
          "mcu_temperature__C": 21,
          "analog_interfaces": {
            "voltage_alert_in_24h": false,
            "lamp_error_alert_in_24h": false,
            "power_alert_in_24h": false,
            "power_factor_alert_in_24h": false
          },
          "ldr_input_value": 174,
          "profiles": [
            {
              "profile_id": 5,
              "profile_version": 5,
              "address": "dali_single_5",
              "days_active": [
                "holiday",
                "mon",
                "tue",
                "wed",
                "thu",
                "fri",
                "sat",
                "sun"
              ],
              "dimming_level__percent": 50
            },
            {
              "profile_id": 3,
              "profile_version": 3,
              "address": "dali_single_3",
              "days_active": [
                "holiday",
                "mon",
                "tue",
                "wed",
                "thu",
                "fri",
                "sat",
                "sun"
              ],
              "dimming_level__percent": 0
            }
          ]
        }
      },
    });
  });

  test('status 2', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 24,
      data: '8044465e054d07ff02db02fafeff00',
      expected: {
        data: {
          "packet_type": "status_packet",
          "device_unix_epoch": "2020-02-14T06:56:00.000Z",
          "status": {
            "dali_error_external": true,
            "dali_connection_error": false,
            "ldr_input_on": true,
            "dig_input_on": false,
            "hardware_error": false,
            "internal_relay_closed": false,
            "open_drain_output_on": false
          },
          "downlink_rssi__dBm": -77,
          "downlink_snr__dB": 7,
          "mcu_temperature__C": -1,
          "analog_interfaces": {
            "voltage_alert_in_24h": false,
            "lamp_error_alert_in_24h": false,
            "power_alert_in_24h": false,
            "power_factor_alert_in_24h": false
          },
          "ldr_input_value": 219,
          "profiles": [
            {
              "profile_id": 2,
              "profile_version": "ldr_input_active",
              "address": "dali_broadcast",
              "days_active": [
                "holiday",
                "mon",
                "tue",
                "wed",
                "thu",
                "fri",
                "sat",
                "sun"
              ],
              "dimming_level__percent": 0
            }
          ]
        },
        "warnings": [
          "dali_external_error"
        ]
      },
    });
  });

  test('usage from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: '04030000000000000603151400000000',
      expected: {
        data: {
          "packet_type": "usage_packet",
          "consumption": [
            {
              "address": "dali_single_2",
              "active_energy__Wh": 0,
              "active_power__W": 0
            },
            {
              "address": "dali_single_3",
              "active_energy__Wh": 5141,
              "active_power__W": 0
            }
          ]
        }
      },
    });
  });

  test('usage 2', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: 'ff03ed0000000000',
      expected: {
        data: {
          "packet_type": "usage_packet",
          "consumption": [
            {
              "address": "internal_measurement",
              "active_energy__Wh": 237,
              "active_power__W": 0
            }
          ]
        }
      },
    });
  });

  test('usage d4i', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: 'ff830100000004000000000012cf1e000000000000000000000070de060011000000',
      expected: {
        data: {
          "packet_type": "usage_packet",
          "consumption": [
            {
              "address": "internal_measurement",
              "active_energy__Wh": 1,
              "active_power__W": 4,
              "lamp_on_time__s": 0
            },
            {
              "address": "dali_single_9",
              "active_energy__Wh": 30,
              "active_power__W": 0,
              "load_side_energy__Wh": 0,
              "load_side_power__W": 0,
              "driver_operating_time__s": 450160,
              "lamp_on_time__s": 17
            }
          ]
        }
      },
    });
  });

  test('usage d4i invalid address', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: 'ff830100000004000000000009cf1e000000000000000000000070de060011000000',
      expected: {
        data: {
          "packet_type": "usage_packet",
          "consumption": [
            {
              "address": "internal_measurement",
              "active_energy__Wh": 1,
              "active_power__W": 4,
              "lamp_on_time__s": 0
            },
            {
              "address": "invalid",
              "active_energy__Wh": 30,
              "active_power__W": 0,
              "load_side_energy__Wh": 0,
              "load_side_power__W": 0,
              "driver_operating_time__s": 450160,
              "lamp_on_time__s": 17
            }
          ]
        },
        "warnings": [
          "invalid_address"
        ]
      },
    });
  });
});

describe('Commands', () => {
  test('manual_dimming_command', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '01fe64',
      expected: {
        data: {
          "packet_type": "manual_dimming",
          "destination": [
            {
              "address": "dali_broadcast",
              "dimming_level__percent": 100
            }
          ]
        }
      },
    });
  });

  test('dali_status_request response from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '00020406020C02',
      expected: {
        data: {
          "packet_type": "dali_status_request",
          "dali_statuses": [
            {
              "address": "dali_single_1",
              "status": {
                "driver_error": false,
                "lamp_failure": false,
                "lamp_on": true,
                "limit_error": false,
                "fade_running": false,
                "reset_state": false,
                "missing_short_address": false,
                "power_failure": false
              }
            },
            {
              "address": "dali_single_3",
              "status": {
                "driver_error": false,
                "lamp_failure": true,
                "lamp_on": false,
                "limit_error": false,
                "fade_running": false,
                "reset_state": false,
                "missing_short_address": false,
                "power_failure": false
              }
            },
            {
              "address": "dali_single_6",
              "status": {
                "driver_error": false,
                "lamp_failure": true,
                "lamp_on": false,
                "limit_error": false,
                "fade_running": false,
                "reset_state": false,
                "missing_short_address": false,
                "power_failure": false
              }
            }
          ]
        },
        "warnings": [
          "dali_single_3 lamp_failure",
          "dali_single_6 lamp_failure"
        ]
      },
    });
  });

  test('manual_dimming_command response from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '01FE64',
      expected: {
        data: {
          "packet_type": "manual_dimming",
          "destination": [
            {
              "address": "dali_broadcast",
              "dimming_level__percent": 100
            }
          ]
        }
      },
    });
  });

  test('custom_dali_request response from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '0348A1FE48A2A848A3FE48A4FE48A507',
      expected: {
        data: {
          "packet_type": "custom_dali_request",
          "query_data_raw": "48A1FE48A2A848A3FE48A4FE48A507"
        }
      },
    });
  });

  test('custom_dali_command response from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '04027F0321032B',
      expected: {
        data: {
          "packet_type": "custom_dali_command",
          "dali_command": "027F0321032B"
        }
      },
    });
  });

  test('interface_request response from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '060100024503FF0400',
      expected: {
        data: {
          "packet_type": "interface_request",
          "dig": "off",
          "ldr": 69,
          "internal_relay_closed": false,
          "open_drain_output_on": false
        }
      },
    });
  });

  test('driver_memory_write response', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '080400030607edface82e5',
      expected: {
        data: {
          "packet_type": "driver_memory_write",
          "address": "dali_single_2",
          "memory_bank": 0,
          "memory_address": 3,
          "memory_value": "0607EDFACE82E5"
        }
      },
    });
  });

  test('driver_memory_write response failed', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '08',
      expected: {
        data: {
          "packet_type": "driver_memory_write"
        },
        "warnings": [
          "driver_memory_write_failed"
        ]
      },
    });
  });
});

describe('Alerts, notifications', () => {
  test('dig_input_alert from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '80200600',
      expected: {
        data: {
          "packet_type": "dig_input_alert",
          "dig_input_event_counter": 6
        },
        "warnings": [
          "dig_input_alert"
        ]
      },
    });
  });

  test('ldr_input_alert from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '81200079',
      expected: {
        data: {
          "packet_type": "ldr_input_alert",
          "ldr_input_on": false,
          "ldr_input_value": 121
        },
        "warnings": [
          "ldr_input_alert"
        ]
      },

    });
  });

  test('dali_driver_alert from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '83200202',
      expected: {
        data: {
          "packet_type": "dali_driver_alert",
          "drivers": [
            {
              "address": "dali_single_1",
              "status": {
                "driver_error": false,
                "lamp_failure": true,
                "lamp_on": false,
                "limit_error": false,
                "fade_running": false,
                "reset_state": false,
                "missing_short_address": false,
                "power_failure": false
              }
            }
          ]
        },
        "warnings": [
          "dali_single_1 lamp_failure"
        ]
      },
    });
  });

  test('metering_alert from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '84025900e50056',
      expected: {
        data: {
          "packet_type": "metering_alert",
          "lamp_error_alert": false,
          "over_current_alert": true,
          "under_voltage_alert": false,
          "over_voltage_alert": false,
          "low_power_factor_alert": false,
          "power__W": 89,
          "voltage__V": 229,
          "power_factor": 0.86
        },
        "warnings": [
          "metering_over_current"
        ]
      },
    });
  });
});

describe('Boot, etc sys packets', () => {
  test('boot_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '000D008350010101F37F205E000CFE0104',
      expected: {
        data: {
          "packet_type": "boot_packet",
          "device_serial": "5083000D",
          "firmware_version": "1.1.1",
          "device_unix_epoch": "2020-01-16T15:23:31.000Z",
          "device_config": "dali",
          "optional_features": {
            "dig_input": true,
            "ldr_input": true,
            "metering": false,
            "open_drain_output": false
          },
          "dali_supply_state__V": "bus_high",
          "dali_power_source_external": "external",
          "dali_addressed_driver_count": 1,
          "dali_unadressed_driver_found": false,
          "reset_reason": [
            "soft_reset"
          ]
        }
      },
    });
  });

  test('boot_packet external', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '00563412510100168e436d3803687e0000',
      expected: {
        data: {
          "packet_type": "boot_packet",
          "device_serial": "51123456",
          "firmware_version": "1.0.22",
          "device_unix_epoch": "invalid_timestamp",
          "device_config": "analog_nc",
          "optional_features": {
            "dig_input": false,
            "ldr_input": true,
            "metering": true,
            "open_drain_output": false
          },
          "dali_supply_state__V": "bus_high",
          "dali_power_source_external": "internal",
          "dali_addressed_driver_count": 0,
          "dali_unadressed_driver_found": false,
          "reset_reason": []
        },
        "warnings": [
          "invalid_timestamp"
        ]
      },
    });
  });

  test('invalid_downlink_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '13320a',
      expected: {
        data: {
          "packet_type": "invalid_downlink_packet",
          "downlink_from_fport": 50,
          "error_reason": "unsupported_header"
        },
        "warnings": [
          "downlink_unsupported_header"
        ]
      },
    });
  });
});
