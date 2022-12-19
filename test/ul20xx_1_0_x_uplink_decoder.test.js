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
          packet_type: { value: 'status_packet' },
          device_unix_epoch: { value: '2020-01-14T14:49:03.000Z', raw: 1579013343 },
          status: {
            dali_error_external: { value: false },
            dali_connection_error: { value: false },
            ldr_input_on: { value: false },
            dig_input_on: { value: false },
            hardware_error: { value: false },
            internal_relay_closed: { value: false },
            open_drain_output_on: { value: false },
          },
          downlink_rssi: { value: -75, unit: 'dBm' },
          downlink_snr: { value: 4, unit: 'dB' },
          mcu_temperature: { value: 21, unit: '°C' },
          analog_interfaces: {
            voltage_alert_in_24h: { value: false },
            lamp_error_alert_in_24h: { value: false },
            power_alert_in_24h: { value: false },
            power_factor_alert_in_24h: { value: false },
          },
          ldr_input_value: { value: 174 },
          profiles: [{
            profile_id: { value: 5, raw: 5 },
            profile_version: { value: 5, raw: 5 },
            address: { value: 'dali_single_5', raw: 10 },
            days_active: { value: ['holiday', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], raw: 255 },
            dimming_level: {
              value: 50, unit: '%', raw: 50,
            },
          }, {
            profile_id: { value: 3, raw: 3 },
            profile_version: { value: 3, raw: 3 },
            address: { value: 'dali_single_3', raw: 6 },
            days_active: { value: ['holiday', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], raw: 255 },
            dimming_level: {
              value: 0, unit: '%', raw: 0,
            },
          }],
        },
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
          packet_type: { value: 'status_packet' },
          device_unix_epoch: { value: '2020-02-14T06:56:00.000Z', raw: 1581663360 },
          status: {
            dali_error_external: { value: true },
            dali_connection_error: { value: false },
            ldr_input_on: { value: true },
            dig_input_on: { value: false },
            hardware_error: { value: false },
            internal_relay_closed: { value: false },
            open_drain_output_on: { value: false },
          },
          downlink_rssi: { value: -77, unit: 'dBm' },
          downlink_snr: { value: 7, unit: 'dB' },
          mcu_temperature: { value: -1, unit: '°C' },
          analog_interfaces: {
            voltage_alert_in_24h: { value: false },
            lamp_error_alert_in_24h: { value: false },
            power_alert_in_24h: { value: false },
            power_factor_alert_in_24h: { value: false },
          },
          ldr_input_value: { value: 219 },
          profiles: [{
            profile_id: { value: 2, raw: 2 },
            profile_version: { value: 'ldr_input_active', raw: 250 },
            address: { value: 'dali_broadcast', raw: 254 },
            days_active: { value: ['holiday', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], raw: 255 },
            dimming_level: {
              value: 0, unit: '%', raw: 0,
            },
          }],
        },
        warnings: ['dali_external_error'],
      },
    });
  });

  test('usage from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: '04030000000000000603151400000000',
      expected: { data: { packet_type: { value: 'usage_packet' }, consumption: [{ address: { value: 'dali_single_2', raw: 4 }, active_energy: { value: 0, unit: 'Wh' }, active_power: { value: 0, unit: 'W' } }, { address: { value: 'dali_single_3', raw: 6 }, active_energy: { value: 5141, unit: 'Wh' }, active_power: { value: 0, unit: 'W' } }] } },
    });
  });

  test('usage 2', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: 'ff03ed0000000000',
      expected: { data: { packet_type: { value: 'usage_packet' }, consumption: [{ address: { value: 'internal_measurement', raw: 255 }, active_energy: { value: 237, unit: 'Wh' }, active_power: { value: 0, unit: 'W' } }] } },
    });
  });

  test('usage d4i', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: 'ff830100000004000000000012cf1e000000000000000000000070de060011000000',
      expected: {
        data: {
          packet_type: { value: 'usage_packet' },
          consumption: [{
            address: { value: 'internal_measurement', raw: 255 }, active_energy: { value: 1, unit: 'Wh' }, active_power: { value: 4, unit: 'W' }, lamp_on_time: { value: 0, unit: 'h' },
          }, {
            address: { value: 'dali_single_9', raw: 18 }, active_energy: { value: 30, unit: 'Wh' }, active_power: { value: 0, unit: 'W' }, load_side_energy: { value: 0, unit: 'Wh' }, load_side_power: { value: 0, unit: 'W' }, driver_operating_time: { value: 450160, unit: 's' }, lamp_on_time: { value: 17, unit: 's' },
          }],
        },
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
          packet_type: { value: 'usage_packet' },
          consumption: [{
            address: { value: 'internal_measurement', raw: 255 }, active_energy: { value: 1, unit: 'Wh' }, active_power: { value: 4, unit: 'W' }, lamp_on_time: { value: 0, unit: 'h' },
          }, {
            address: { value: 'invalid', raw: 9 }, active_energy: { value: 30, unit: 'Wh' }, active_power: { value: 0, unit: 'W' }, load_side_energy: { value: 0, unit: 'Wh' }, load_side_power: { value: 0, unit: 'W' }, driver_operating_time: { value: 450160, unit: 's' }, lamp_on_time: { value: 17, unit: 's' },
          }],
        },
        warnings: ['invalid_address'],
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
      expected: { data: { packet_type: { value: 'manual_dimming' }, destination: [{ address: { value: 'dali_broadcast', raw: 254 }, dimming_level: { value: 100, unit: '%', raw: 100 } }] } },
    });
  });

  test('dali_status_request response from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '00020406020C02',
      expected: {
        data: {
          packet_type: { value: 'dali_status_request' },
          dali_statuses: [{
            address: { value: 'dali_single_1', raw: 2 },
            status: {
              driver_error: { value: false }, lamp_failure: { value: false }, lamp_on: { value: true }, limit_error: { value: false }, fade_running: { value: false }, reset_state: { value: false }, missing_short_address: { value: false }, power_failure: { value: false },
            },
          }, {
            address: { value: 'dali_single_3', raw: 6 },
            status: {
              driver_error: { value: false }, lamp_failure: { value: true }, lamp_on: { value: false }, limit_error: { value: false }, fade_running: { value: false }, reset_state: { value: false }, missing_short_address: { value: false }, power_failure: { value: false },
            },
          }, {
            address: { value: 'dali_single_6', raw: 12 },
            status: {
              driver_error: { value: false }, lamp_failure: { value: true }, lamp_on: { value: false }, limit_error: { value: false }, fade_running: { value: false }, reset_state: { value: false }, missing_short_address: { value: false }, power_failure: { value: false },
            },
          }],
        },
        warnings: ['dali_single_3 errors: lamp_failure', 'dali_single_6 errors: lamp_failure'],
      },
    });
  });

  test('manual_dimming_command response from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '01FE64',
      expected: { data: { packet_type: { value: 'manual_dimming' }, destination: [{ address: { value: 'dali_broadcast', raw: 254 }, dimming_level: { value: 100, unit: '%', raw: 100 } }] } },
    });
  });

  test('custom_dali_request response from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '0348A1FE48A2A848A3FE48A4FE48A507',
      expected: { data: { packet_type: { value: 'custom_dali_request' }, query_data_raw: { value: '48A1FE48A2A848A3FE48A4FE48A507' } } },
    });
  });

  test('custom_dali_command response from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '04027F0321032B',
      expected: { data: { packet_type: { value: 'custom_dali_command' }, dali_command: { value: '027F0321032B' } } },
    });
  });

  test('interface_request response from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '060100024503FF0400',
      expected: {
        data: {
          packet_type: { value: 'interface_request' }, dig: { value: 'off', raw: 0 }, ldr: { value: 69, raw: 69 }, internal_relay_closed: { value: false }, open_drain_output_on: { value: false },
        },
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
          packet_type: { value: 'driver_memory_write' }, address: { value: 'dali_single_2', raw: 4 }, memory_bank: { value: 0 }, memory_address: { value: 3 }, memory_value: { value: '0607EDFACE82E5' },
        },
      },
    });
  });

  test('driver_memory_write response failed', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '08',
      expected: { data: { packet_type: { value: 'driver_memory_write' } }, warnings: ['driver_memory_write_failed'] },
    });
  });
});

describe('Alerts, notifications', () => {
  test('dig_input_alert from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '80200600',
      expected: { data: { packet_type: { value: 'dig_input_alert' }, dig_input_event_counter: { value: 6 } } },
    });
  });

  test('ldr_input_alert from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '81200079',
      expected: { data: { packet_type: { value: 'ldr_input_alert' }, ldr_input_on: { value: false }, ldr_input_value: { value: 121 } } },
    });
  });

  test('dali_driver_alert from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '83200202',
      expected: {
        data: {
          packet_type: { value: 'dali_driver_alert' },
          drivers: [{
            address: { value: 'dali_single_1', raw: 2 },
            status: {
              driver_error: { value: false }, lamp_failure: { value: true }, lamp_on: { value: false }, limit_error: { value: false }, fade_running: { value: false }, reset_state: { value: false }, missing_short_address: { value: false }, power_failure: { value: false },
            },
          }],
        },
        warnings: ['dali_single_1 errors: lamp_failure'],
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
          packet_type: { value: 'metering_alert' }, lamp_error_alert: { value: false }, over_current_alert: { value: true }, under_voltage_alert: { value: false }, over_voltage_alert: { value: false }, low_power_factor_alert: { value: false }, power: { value: 89, unit: 'W' }, voltage: { value: 229, unit: 'V' }, power_factor: { value: 0.86 },
        },
        warnings: ['metering_alert: over_current'],
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
          packet_type: { value: 'boot_packet' },
          device_serial: { value: '5083000D' },
          firmware_version: { value: '1.1.1', raw: 65793 },
          device_unix_epoch: { value: '2020-01-16T15:23:31.000Z', raw: 1579188211 },
          device_config: { value: 'dali', raw: 0 },
          optional_features: {
            dig_input: { value: true }, ldr_input: { value: true }, metering: { value: false }, open_drain_output: { value: false },
          },
          dali_supply_state: { value: 'bus_high', raw: 126 },
          dali_power_source_external: { value: 'external', raw: true },
          dali_addressed_driver_count: { value: 1 },
          dali_unadressed_driver_found: { value: false },
          reset_reason: { value: ['soft_reset'], raw: 4 },
        },
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
          packet_type: { value: 'boot_packet' },
          device_serial: { value: '51123456' },
          firmware_version: { value: '1.0.22', raw: 65558 },
          device_unix_epoch: { value: 'invalid_timestamp', raw: 946684814 },
          device_config: { value: 'analog_nc', raw: 3 },
          optional_features: {
            dig_input: { value: false }, ldr_input: { value: true }, metering: { value: true }, open_drain_output: { value: false },
          },
          dali_supply_state: { value: 'bus_high', raw: 126 },
          dali_power_source_external: { value: 'internal', raw: false },
          dali_addressed_driver_count: { value: 0 },
          dali_unadressed_driver_found: { value: false },
          reset_reason: { value: [], raw: 0 },
        },
        warnings: ['invalid_timestamp'],
      },
    });
  });

  test('invalid_downlink_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '13320a',
      expected: { data: { packet_type: { value: 'invalid_downlink_packet' }, downlink_from_fport: { value: 50 }, error_reason: { value: 'unsupported_header', raw: 10 } }, warnings: ['downlink_unsupported_header'] },
    });
  });
});
