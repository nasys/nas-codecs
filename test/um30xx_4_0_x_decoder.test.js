import { decodeRaw } from '../src/um30xx_decoder';
import { testPacket } from './utils/test_utils';

describe('UM3xxx tests', () => {
  test('usage_spec_mbus', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: '02824323 24B29AD03C 011706 0000 00 0374301C00',
      expected: {
        data: {
          app_connected_within_a_day: true,
          packet_type: 'usage_packet',
          active_alerts: {
            low_battery: false,
            pulse_1_trigger_alert: false,
            pulse_2_trigger_alert: true
          },
          meter_actuality_duration__minutes: 105,
          meter_actuality_duration_formatted: '1.75 hours',
          pulse_1: {
            medium_type: 'L_water',
            muliplier: 10,
            accumulated__L_water: 10203040500,
            input_state: 'open'
          },
          pulse_2: {
            accumulated__triggers: 1559,
            input_state: 'closed',
            medium_type: 'triggers',
            muliplier: 1
          },
          mbus: {
            data_records_raw: '0374301C00',
            last_bus_status: 'connected',
            records_truncated: false,
            data_records: {
              actuality_duration__seconds: 7216,
            }
          }
        },errors: [],
        warnings: [],
      },
    });
  });

  test('status_spec_mbus_4_0_27', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 24,
      data: '82826BD1164A337C432326B29AD03C0138271501170600002090241262700374301C00',
      expected: {
        data: {
          app_connected_within_a_day: true,
          battery_voltage__V: 3.59,
          internal_temperature_max__C: 30,
          internal_temperature_min__C: 2,
          packet_type: 'status_packet',
          radio_downlink_snr__dB: 4,
          radio_uplink_power__dBm: 14,
          active_alerts: {
            low_battery: false,
            pulse_1_trigger_alert: false,
            pulse_2_trigger_alert: true
          },
          battery_remaining__years: 8.9,
          internal_temperature__C: 22,
          radio_downlink_rssi__dBm: -51,
          meter_actuality_duration__minutes: 105,
          meter_actuality_duration_formatted: '1.75 hours',
          pulse_1: {
            accumulated__L_water: 10203040500,
            input_state: 'open',
            serial: '15273801',
            medium_type: 'L_water',
            muliplier: 10
          },
          pulse_2: {
            accumulated__triggers: 1559,
            input_state: 'closed',
            medium_type: 'triggers',
            muliplier: 1
          },
          mbus: {
            data_records_raw: '0374301C00',
            last_bus_status: 'connected',
            serial: '70621224',
            status: '0x90',
            records_truncated: false,
            data_records: {
              actuality_duration__seconds:7216,
            }
          }
        },errors: [],
        warnings: [],
      },
    });
  });

  test('status_spec_mbus_4_0_30', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 24,
      data: '82826BD1164A337C432326B29AD03C013827150117060000609024126270333802070374301C00',
      expected: {
        data: {
          app_connected_within_a_day: true,
          battery_voltage__V: 3.59,
          internal_temperature_max__C: 30,
          internal_temperature_min__C: 2,
          packet_type: 'status_packet',
          radio_downlink_snr__dB: 4,
          radio_uplink_power__dBm: 14,
          active_alerts: {
            low_battery: false,
            pulse_1_trigger_alert: false,
            pulse_2_trigger_alert: true
          },
          battery_remaining__years: 8.9,
          internal_temperature__C: 22,
          meter_actuality_duration__minutes: 105,
          meter_actuality_duration_formatted: '1.75 hours',
          radio_downlink_rssi__dBm: -51,
          pulse_1: {
            medium_type: 'L_water',
            muliplier: 10,
            accumulated__L_water: 10203040500,
            input_state: 'open',
            serial: '15273801'
          },
          pulse_2: {
            medium_type: 'triggers',
            muliplier: 1,
            accumulated__triggers: 1559,
            input_state: 'closed'
          },
          mbus: {
            data_records_raw: '0374301C00',
            last_bus_status: 'connected',
            serial: '70621224',
            manufacturer: "NAS",
            version: 2,
            medium: "water",
            status: '0x90',
            records_truncated: false,
            data_records: {
              actuality_duration__seconds:7216
            }
          }
        },errors: [],
        warnings: [],
      },
    });
  });

  test('usage_spec_ssi', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: '028200100105C74B873F9A99B941',
      expected: {
        data: {
          app_connected_within_a_day: true,
          packet_type: 'usage_packet',
          active_alerts: {
            low_battery: false,
            pulse_1_trigger_alert: false,
            pulse_2_trigger_alert: true
          },
          meter_actuality_duration__minutes: 0,
          meter_actuality_duration_formatted: '0 minutes',
          ssi: {
            channel_1: 1.057,
            channel_2: 23.2,
            sensor: 'pressure_30bar_temperature',
          }
        },errors: [],
        warnings: [],
      },
    });
  });

  test('general_config_spec', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '123117024F0A0001404B4C00CEFFFFFF785634120A00',
      expected: {
        data: {
          packet_type: 'general_configuration_packet',
          radio_lorawan_profile: 'lorawan_1_h_dynamic',
          pulse_1: {
            accumulated_absolute: 50000000,
            accumulated_offset: -500,
            input_mode_and_unit: 'L_water',
            multiplier_denominator: 1,
            multiplier_numerator: 10,
            serial: '12345678'
          },
          pulse_2: {
            input_mode_and_unit: 'triggers_10_sec'
          }
        },errors: [],
        warnings: [],
      },
    });
  });

  test('general_config_short', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '1233170209000900',
      expected: {
        data: {
          packet_type: 'general_configuration_packet',
          radio_lorawan_profile: 'lorawan_1_h_dynamic',
          radio_wmbus_profile: 'wmbus_driveby',
          pulse_1: {
            input_mode_and_unit: 'triggers_1_sec'
          },
          pulse_2: {
            input_mode_and_unit: 'triggers_1_sec'
          }
        },errors: [],
        warnings: [],
      },
    });
  });

  test('location_config_spec', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '211FAC5E6D230017C10EF412c396c3b662696b75205374722e20322d31361032365630303030303030303337313734053132414236',
      expected: {
        data: {
          packet_type: 'location_configuration_packet',
          address: 'Ööbiku Str. 2-16',
          gps_position_latitude__deg: 59.437022,
          gps_position_longitude__deg: 24.753536,
          id_customer: '26V0000000037174',
          id_location: '12AB6',
          time_zone__h: -3,
        },errors: [],
        warnings: [],
      },
    });
  });

  test('mbus_config_spec', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '14120C138C20130CFD11',
      expected: {
        data: {
          packet_type: 'mbus_configuration_packet',
          mbus_data_record_header_raw: '0C138C20130CFD11',
        },errors: [],
        warnings: [],
      },
    });
  });

  test('general_config_req', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '12',
      expected: {
        data: {
          packet_type: 'general_configuration_request' 
        },errors: [],
        warnings: [],
      },
    });
  });

  test('mbus_config_req', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '14',
      expected: {
        data: {
          packet_type: 'mbus_configuration_request'
        },errors: [],
        warnings: [],
      },
    });
  });

  test('location_config_req', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '21',
      expected: {
        data: {
          packet_type: 'location_configuration_request'
        },errors: [],
        warnings: [],
      },
    });
  });

  test('local_time_req', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '03',
      expected: {
        data: {
          packet_type: 'local_time_request'
        },errors: [],
        warnings: [],
      },
    });
  });

  test('mbus_available_datarecord_req', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '81',
      expected: {
        data: {
          packet_type: 'mbus_available_data_records_request'
        },errors: [],
        warnings: [],
      },
    });
  });

  test('enter_dfu_command', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: 'FF',
      expected: {
        data: {
          packet_type: 'enter_dfu_command'
        },errors: [],
        warnings: [],
      },
    });
  });

  test('mbus_available_data_records', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '81 C1 78563412 A511 70 07 C1 90 0000 0C138C2013',
      expected: {
        data: {
          packet_type: 'mbus_available_data_records',
          more_packets_following: false,
          packet_number: 1,
          mbus_data_record_header_raw: '0C138C2013',
          mbus_header: {
            access_number: 193,
            manufacturer: 'DME',
            medium: 'water',
            serial: '12345678',
            signature: '0000',
            status: '0x90',
            version: '0x70'
          }
        },errors: [],
        warnings: [],
      },
    });
  });

  test('local_time_response', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '03 34546A5F',
      expected: {
        data: {
          packet_type: 'local_time_response',
          device_local_time__s: 1600803892,
          device_local_time_formatted: '2020-09-22T19:44:52Z',
        },errors: [],
        warnings: [],
      },
    });
  });

  test('faulty_downlink', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '13 32 05',
      expected: {
        data: {
          packet_type: 'faulty_downlink_packet',
          packet_error_reason: 'value_error',
          packet_fport: 50,
        },errors: [],
        warnings: ['faulty_downlink_packet value_error'],
      },
    });
  });

  test('boot_packet', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '00 27001650 020312 80 90 06 371100',
      expected: {
        data: {
          packet_type: 'boot_packet',
          configuration_restored: true,
          device_firmware_version: '2.3.18',
          device_serial: '50160027',
          device_uptime_accumulated__days: 183.63,
          hardware_configuration: 'pulse_lbus',
          packet_reason: 'from_shutdown',
          wakeup_reason_mcu: ['nfc_wakeup'],
        },errors: [],
        warnings: [],
      },
    });
  });

  test('shutdown_packet', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '01 3382826BD1164A337C432326B29AD03C0138271501170600002090241262700374301C00',
      expected: {
        data: {
          app_connected_within_a_day: true,
          battery_voltage__V: 3.59,
          internal_temperature_max__C: 30,
          internal_temperature_min__C: 2,
          packet_type: 'shutdown_packet',
          radio_downlink_snr__dB: 4,
          radio_uplink_power__dBm: 14,
          shutdown_reason: 'app_shutdown',
          active_alerts: {
            low_battery: false,
            pulse_1_trigger_alert: false,
            pulse_2_trigger_alert: true
          },
          battery_remaining__years: 8.9,
          internal_temperature__C: 22,
          meter_actuality_duration__minutes: 105,
          meter_actuality_duration_formatted: '1.75 hours',
          radio_downlink_rssi__dBm: -51,
          pulse_1: {
            medium_type: 'L_water',
            muliplier: 10,
            accumulated__L_water: 10203040500,
            input_state: 'open',
            serial: '15273801',
          },
          pulse_2: {
            medium_type: 'triggers',
            muliplier: 1,
            accumulated__triggers: 1559,
            input_state: 'closed',
          },
          mbus: {
            data_records_raw: '0374301C00',
            last_bus_status: 'connected',
            serial: '70621224',
            status: '0x90',
            records_truncated: false,
            data_records: {
              actuality_duration__seconds: 7216,
            }
          }
        },errors: [],
        warnings: [],
      },
    });
  });
});
