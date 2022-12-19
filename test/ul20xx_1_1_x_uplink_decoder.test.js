// import { decodeRaw as decodeRawV10 } from '../src/ul20xx_1_0_x_decoder.processed';
import { decodeRaw } from '../src/ul20xx_1_1_x_decoder.processed';
import { testPacket } from './utils/test_utils';

describe('Status and usage', () => {
  test('status from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 23,
      data: '00 F37F205E 92 32 09 16 00  FE 50 19 00  12 50 19 00',
      expected: {
        data: {
          packet_type: {
            value: 'status_packet',
          },
          device_unix_epoch: {
            value: '2020-01-16T15:23:31.000Z',
            raw: 1579188211,
          },
          status: {
            dali_connection_error: {
              value: true,
            },
            metering_com_error: {
              value: false,
            },
            rtc_com_error: {
              value: false,
            },
            internal_relay_closed: {
              value: true,
            },
            ldr_input_on: {
              value: false,
            },
            dig_input_on: {
              value: true,
            },
            open_drain_output_on: {
              value: false,
            },
          },
          downlink_rssi: {
            value: -50,
            unit: 'dBm',
          },
          downlink_snr: {
            value: 9,
            unit: 'dB',
          },
          mcu_temperature: {
            value: 22,
            unit: '°C',
          },
          dimming_source: [
            {
              address: {
                value: 'dali_broadcast',
                raw: 254,
              },
              reason: 'calendar_dusk_step',
              dimming_level: {
                value: 25,
                raw: 25,
                unit: '%',
              },
              status: {
                driver_error: {
                  value: false,
                },
                lamp_failure: {
                  value: false,
                },
                lamp_on: {
                  value: false,
                },
                limit_error: {
                  value: false,
                },
                fade_running: {
                  value: false,
                },
                reset_state: {
                  value: false,
                },
                missing_short_address: {
                  value: false,
                },
                power_failure: {
                  value: false,
                },
              },
            },
            {
              address: {
                value: 'dali_single_9',
                raw: 18,
              },
              reason: 'calendar_dusk_step',
              dimming_level: {
                value: 25,
                raw: 25,
                unit: '%',
              },
              status: {
                driver_error: {
                  value: false,
                },
                lamp_failure: {
                  value: false,
                },
                lamp_on: {
                  value: false,
                },
                limit_error: {
                  value: false,
                },
                fade_running: {
                  value: false,
                },
                reset_state: {
                  value: false,
                },
                missing_short_address: {
                  value: false,
                },
                power_failure: {
                  value: false,
                },
              },
            },
          ],
        },
        warnings: [
          'dali_connection_error',
        ],
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
          packet_type: {
            value: 'usage_packet',
          },
          consumption: [
            {
              address: {
                value: 'internal_measurement',
                raw: 255,
              },
              lamp_on_time: {
                value: 19918800,
                unit: 's',
              },
            },
            {
              address: {
                value: 'dali_single_9',
                raw: 18,
              },
              active_energy: {
                value: 234567,
                unit: 'Wh',
              },
              active_power: {
                value: 42,
                unit: 'W',
              },
              load_side_energy: {
                value: 215801,
                unit: 'Wh',
              },
              load_side_power: {
                value: 39,
                unit: 'W',
              },
              power_factor: {
                value: 0.93,
              },
              mains_voltage: {
                value: 229,
                unit: 'V',
              },
              driver_operating_time: {
                value: 47805120,
                unit: 's',
              },
              lamp_on_time: {
                value: 19918800,
                unit: 's',
              },
            },
          ],
        },
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
            dig_input: {
              value: true,
            },
            ldr_input: {
              value: true,
            },
            open_drain_output: {
              value: false,
            },
            metering: {
              value: false,
            },
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
          packet_type: {
            value: 'boot_packet',
          },
          device_serial: {
            value: '51123456',
          },
          firmware_version: {
            value: '1.0.22',
            raw: 65558,
          },
          device_unix_epoch: {
            value: 'invalid_timestamp',
            raw: 946684814,
          },
          device_config: {
            value: 'analog_nc',
            raw: 3,
          },
          optional_features: {
            dig_input: {
              value: false,
            },
            ldr_input: {
              value: true,
            },
            open_drain_output: {
              value: false,
            },
            metering: {
              value: true,
            },
          },
          dali_supply_state: {
            value: 'bus_high',
            raw: 126,
          },
          dali_power_source_external: {
            value: 'internal',
            raw: false,
          },
          dali_addressed_driver_count: {
            value: 0,
          },
          dali_unadressed_driver_found: {
            value: false,
          },
          reset_reason: {
            value: [],
            raw: 0,
          },
        },
        warnings: [
          'invalid_timestamp',
        ],
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
