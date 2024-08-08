// import { decodeRaw as decodeRawV10 } from '../src/ul20xx_1_0_x_decoder.processed';
import { decodeRaw } from '../src/ul20xx_1_1_x_decoder.processed';
import { testPacket } from './utils/test_utils';

describe('Status and usage', () => {
  test('status from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 23,
      data: '01 F37F205E 8244 32 09 16 20 07 01 D2 02 9455 04 01  FE 50 19 00 12 50 19 00',
      expected: {
        data: {
          "packet_type": "status_packet",
          "device_unix_epoch": "2020-01-16T15:23:31.000Z",
          "status": {
            "dali_connection_error": true,
            "metering_com_error": false,
            "ext_rtc_warning": false,
            "internal_relay_closed": true,
            "open_drain_output_on": true,
            "lumalink_connected": true,
            "lumalink_connected_after_boot": false
          },
          "downlink_rssi__dBm": -50,
          "downlink_snr__dB": 9,
          "mcu_temperature__C": 22,
          "active_alerts": {
            "voltage_alert_in_24h": false,
            "lamp_error_alert_in_24h": true,
            "power_alert_in_24h": false,
            "power_factor_alert_in_24h": false
          },
          "sensor_source": {
            "ldr_input": 210,
            "light_sensor__lx": "299.9",
            "dig_input_1_on": true
          },
          "dimming_source": [
            {
              "address": "dali_broadcast",
              "reason": "calendar_dusk_step_0",
              "dimming_level__percent": 25,
              "status": {
                "driver_error": false,
                "lamp_failure": false,
                "lamp_on": false,
                "limit_error": false,
                "fade_running": false,
                "reset_state": false,
                "missing_short_address": false,
                "power_failure": false
              }
            },
            {
              "address": "dali_single_9",
              "reason": "calendar_dusk_step_0",
              "dimming_level__percent": 25,
              "status": {
                "driver_error": false,
                "lamp_failure": false,
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
        errors: [],
        warnings: [
          "dali_connection_error",
          "lamp_error_alert_in_24h"
        ]
      },
    });
  });

  test('status from DS + unknown sensor source', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 23,
      data: '01 F37F205E 82C4 32 09 16 20 09 01 D2 02 9455 04 01 2100 FE 51 19 00 12 3F 19 00',
      expected: {
        data: {
          "packet_type": "status_packet",
          "device_unix_epoch": "2020-01-16T15:23:31.000Z",
          "status": {
            "dali_connection_error": true,
            "metering_com_error": false,
            "ext_rtc_warning": false,
            "internal_relay_closed": true,
            "open_drain_output_on": true,
            "lumalink_connected": true,
            "lumalink_connected_after_boot": true
          },
          "downlink_rssi__dBm": -50,
          "downlink_snr__dB": 9,
          "mcu_temperature__C": 22,
          "active_alerts": {
            "voltage_alert_in_24h": false,
            "lamp_error_alert_in_24h": true,
            "power_alert_in_24h": false,
            "power_factor_alert_in_24h": false
          },
          "sensor_source": {
            "ldr_input": 210,
            "light_sensor__lx": "299.9",
            "dig_input_1_on": true
          },
          "dimming_source": [
            {
              "address": "dali_broadcast",
              "reason": "calendar_dusk_step_1",
              "dimming_level__percent": 25,
              "status": {
                "driver_error": false,
                "lamp_failure": false,
                "lamp_on": false,
                "limit_error": false,
                "fade_running": false,
                "reset_state": false,
                "missing_short_address": false,
                "power_failure": false
              }
            },
            {
              "address": "dali_single_9",
              "reason": "calendar_dawn_step_15",
              "dimming_level__percent": 25,
              "status": {
                "driver_error": false,
                "lamp_failure": false,
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
          "dali_connection_error",
          "lamp_error_alert_in_24h"
        ],
        "errors": [
          "unsupported_sensor_source"
        ]
      },
    });
  });


  test('status preliminary from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 23,
      data: '00 F37F205E 92 32 09 16 00  FE 71 19 00  12 81 19 00',
      expected: {
        data: {
          "packet_type": "status_packet",
          "device_unix_epoch": "2020-01-16T15:23:31.000Z",
          "status": {
            "dali_connection_error": true,
            "metering_com_error": false,
            "ext_rtc_warning": false,
            "internal_relay_closed": true,
            "ldr_input_on": false,
            "dig_input_on": true,
            "open_drain_output_on": false
          },
          "downlink_rssi__dBm": -50,
          "downlink_snr__dB": 9,
          "mcu_temperature__C": 22,
          "dimming_source": [
            {
              "address": "dali_broadcast",
              "reason": "dig_active",
              "dimming_level__percent": 25,
              "status": {
                "driver_error": false,
                "lamp_failure": false,
                "lamp_on": false,
                "limit_error": false,
                "fade_running": false,
                "reset_state": false,
                "missing_short_address": false,
                "power_failure": false
              }
            },
            {
              "address": "dali_single_9",
              "reason": "light_monitor_step_1",
              "dimming_level__percent": 25,
              "status": {
                "driver_error": false,
                "lamp_failure": false,
                "lamp_on": false,
                "limit_error": false,
                "fade_running": false,
                "reset_state": false,
                "missing_short_address": false,
                "power_failure": false
              }
            }
          ]
        }, errors: [],
        warnings: [
          "dali_connection_error"
        ]
      },
    });
  });

  test('status preliminary with relay off', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 23,
      data: '00F6E5853800340718000EF5FFFF',
      expected: {
        data: {
          "packet_type": "status_packet",
          "device_unix_epoch": "invalid_timestamp",
          "status": {
            "dali_connection_error": false,
            "metering_com_error": false,
            "ext_rtc_warning": false,
            "internal_relay_closed": false,
            "ldr_input_on": false,
            "dig_input_on": false,
            "open_drain_output_on": false
          },
          "downlink_rssi__dBm": -52,
          "downlink_snr__dB": 7,
          "mcu_temperature__C": 24,
          "dimming_source": [
            {
              "address": "dali_single_7",
              "reason": "relay_off",
              "dimming_level__percent": "n/a",
              "status": {
                "driver_error": false,
                "lamp_failure": false,
                "lamp_on": false,
                "limit_error": false,
                "fade_running": false,
                "reset_state": false,
                "missing_short_address": false,
                "power_failure": false
              }
            }
          ]
        }, errors: [],
        warnings: [
          "invalid_timestamp"
        ]
      },
    });
  });

  test('usage from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 26,
      data: '00 FF 80 D0EF2F01 12 FF 47940300 2A00 F94A0300 2700 5D E5 C072D902 D0EF2F01  ',
      expected: {
        data: {
          "packet_type": "usage_packet",
          "consumption": [
            {
              "address": "internal_measurement",
              "lamp_on_time__h": 5533
            },
            {
              "address": "dali_single_9",
              "active_energy__Wh": 234567,
              "active_power__W": 42,
              "load_side_energy__Wh": 215801,
              "load_side_power__W": 39,
              "power_factor": 0.93,
              "mains_voltage__V": 229,
              "driver_operating_time__h": 13279,
              "lamp_on_time__h": 5533
            }
          ]
        }, errors: [],
        warnings: [],
      },
    });
  });
});

describe('Commands', () => {
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
        }, errors: [],
        warnings: [],
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
        }, errors: [],
        warnings: [],
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
        }, errors: [],
        warnings: [],
      }

      ,
    });
  });

  test('dim_map_report_request resp from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '05 04 12 94 fe 00',
      expected: {
        data: {
          "packet_type": "status_usage_request",
          "status_requested": false,
          "usage_requested": false,
          "dim_map_report_requested": true,
          "request_gnss_notification": false,
          "drivers": [
            {
              "address": "dali_single_9",
              "dali_min_level": 148,
              "dali_max_level": 254,
              "dimming_curve": "logarithmic"
            }
          ]
        }, errors: [],
        warnings: [],
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
        }, errors: [],
        warnings: [],
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
        }, errors: [],
        warnings: [
          "driver_memory_write_failed"
        ]
      },
    });
  });
});

describe('Alerts, notifications', () => {
  test('dig_input_notification from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '804106000000',
      expected: {
        data: {
          "packet_type": "dig_input_notification",
          "dig_input_on": true,
          "dig_input_event_counter": 6
        }, errors: [],
        warnings: []
      },

    });
  });

  test('ldr_input_notification from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '81200079',
      expected: {
        data: {
          "packet_type": "ldr_input_notification",
          "ldr_input_on": false,
          "ldr_input_value": 121
        }, errors: [],
        warnings: []
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
        }, errors: [],
        warnings: [
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
        }, errors: [],
        warnings: [
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
            "open_drain_output": false,
            "metering": false
          },
          "dali_supply_state__V": "bus_high",
          "dali_power_source_external": "external",
          "dali_addressed_driver_count": 1,
          "dali_unaddressed_driver_found": false,
          "reset_reason": [
            "soft_reset"
          ]
        }, errors: [],
        warnings: [],
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
            "open_drain_output": false,
            "metering": true
          },
          "dali_supply_state__V": "bus_high",
          "dali_power_source_external": "internal",
          "dali_addressed_driver_count": 0,
          "dali_unaddressed_driver_found": false,
          "reset_reason": []
        }, errors: [],
        warnings: [
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
        }, errors: [],
        warnings: [
          "downlink_error unsupported_header"
        ]
      },
    });
  });
});
