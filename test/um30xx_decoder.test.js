import { decodeRaw } from '../src/um30xx_decoder';
import { testPacket } from './utils/test_utils';

describe('UM3xxx tests', () => {
  test('usage_spec', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: '0282432324B29AD03C0117060000000374301C00',
      expected: {
        _app_connected_within_a_day: true, _mbus_data_records_truncated: false, _packet_type: 'usage_packet', _pulse_1_medium_type: 'L_water', _pulse_1_muliplier: 10, _pulse_2_medium_type: 'triggers', _pulse_2_muliplier: 1, _raw_payload: '0282432324B29AD03C0117060000000374301C00', active_alerts: ['pulse_2_trigger_alert'], mbus_data_records_unparsed: '0374301C00', mbus_last_status: 'connected', meter_actuality_duration__minutes: 105, meter_actuality_duration_formatted: '1.75 hours', pulse_1_accumulated__L_water: 10203040500, pulse_1_input_state: 'open', pulse_2_accumulated__triggers: 1559, pulse_2_input_state: 'closed',
      },
    });
  });

  test('status_spec', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 24,
      data: '82826BD1164A337C432326B29AD03C0138271501170600002090241262700374301C00',
      expected: {
        _app_connected_within_a_day: true, _battery_voltage__V: 3.59, _internal_temperature_max__C: 30, _internal_temperature_min__C: 2, _mbus_data_records_truncated: false, _packet_type: 'status_packet', _pulse_1_medium_type: 'L_water', _pulse_1_muliplier: 10, _pulse_2_medium_type: 'triggers', _pulse_2_muliplier: 1, _radio_downlink_snr__dB: 4, _radio_uplink_power__dBm: 14, _raw_payload: '82826BD1164A337C432326B29AD03C0138271501170600002090241262700374301C00', active_alerts: ['pulse_2_trigger_alert'], battery_remaining__years: 8.9, internal_temperature__C: 22, mbus_data_records_unparsed: '0374301C00', mbus_last_status: 'connected', mbus_serial: '70621224', mbus_status: '0x90', meter_actuality_duration__minutes: 105, meter_actuality_duration_formatted: '1.75 hours', pulse_1_accumulated__L_water: 10203040500, pulse_1_input_state: 'open', pulse_1_serial: '15273801', pulse_2_accumulated__triggers: 1559, pulse_2_input_state: 'closed', radio_downlink_rssi__dBm: -51,
      },
    });
  });

  test('usage_spec_ssi', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: '028200100105C74B873F9A99B941',
      expected: {
        _app_connected_within_a_day: true, _packet_type: 'usage_packet', _raw_payload: '028200100105C74B873F9A99B941', active_alerts: ['pulse_2_trigger_alert'], meter_actuality_duration__minutes: 0, meter_actuality_duration_formatted: '0 minutes', ssi_channel_1: 1.057, ssi_channel_2: 23.2, ssi_sensor: 'pressure_30bar_temperature',
      },
    });
  });

  test('general_config_spec', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '123117024F0A0001404B4C00CEFFFFFF785634120A00',
      expected: {
        _packet_type: 'general_configuration_packet', _raw_payload: '123117024F0A0001404B4C00CEFFFFFF785634120A00', pulse_1_accumulated_absolute: 50000000, pulse_1_accumulated_offset: -500, pulse_1_input_mode_and_unit: 'L_water', pulse_1_multiplier_denominator: 1, pulse_1_multiplier_numerator: 10, pulse_1_serial: '12345678', pulse_2_input_mode_and_unit: 'triggers_10_sec', radio_lorawan_profile: 'lorawan_1_h_dynamic',
      },
    });
  });

  test('general_config_short', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '1233170209000900',
      expected: {
        _packet_type: 'general_configuration_packet', _raw_payload: '1233170209000900', pulse_1_input_mode_and_unit: 'triggers_1_sec', pulse_2_input_mode_and_unit: 'triggers_1_sec', radio_lorawan_profile: 'lorawan_1_h_dynamic', radio_wmbus_profile: 'wmbus_driveby',
      },
    });
  });

  test('location_config_spec', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '211FAC5E6D230017C10EF412c396c3b662696b75205374722e20322d31361032365630303030303030303337313734053132414236',
      expected: {
        _packet_type: 'location_configuration_packet', _raw_payload: '211FAC5E6D230017C10EF412C396C3B662696B75205374722E20322D31361032365630303030303030303337313734053132414236', address: 'Ööbiku Str. 2-16', gps_position_latitude__deg: 59.437022, gps_position_longitude__deg: 24.753536, id_customer: '26V0000000037174', id_location: '12AB6', time_zone__h: -3,
      },
    });
  });

  test('mbus_config_spec', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '14120C138C20130CFD11',
      expected: { _packet_type: 'mbus_configuration_packet', _raw_payload: '14120C138C20130CFD11', mbus_data_record_headers_unparsed: '0C138C20130CFD11' },
    });
  });

  test('general_config_req', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '12',
      expected: { _packet_type: 'general_configuration_request', _raw_payload: '12' },
    });
  });

  test('mbus_config_req', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '14',
      expected: { _packet_type: 'mbus_configuration_request', _raw_payload: '14' },
    });
  });

  test('location_config_req', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '21',
      expected: { _packet_type: 'location_configuration_request', _raw_payload: '21' },
    });
  });

  test('local_time_req', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '03',
      expected: { _packet_type: 'local_time_request', _raw_payload: '03' },
    });
  });

  test('mbus_available_datarecord_req', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '81',
      expected: { _packet_type: 'mbus_available_data_records_request', _raw_payload: '81' },
    });
  });

  test('enter_dfu_command', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: 'FF',
      expected: { _packet_type: 'enter_dfu_command', _raw_payload: 'FF' },
    });
  });

  test('mbus_available_data_records', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '81 C1 78563412 A511 70 07 C1 90 0000 0C138C2013',
      expected: {
        _more_packets_following: false, _packet_number: 1, _packet_type: 'mbus_available_data_records', _raw_payload: '81C178563412A5117007C19000000C138C2013', mbus_data_record_headers_unparsed: '0C138C2013', mbus_header_access_number: 193, mbus_header_manufacturer: 'DME', mbus_header_medium: 'water', mbus_header_serial: '12345678', mbus_header_signature: '0000', mbus_header_status: '0x90', mbus_header_version: '0x70',
      },
    });
  });

  test('local_time_response', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '03 34546A5F',
      expected: {
        _packet_type: 'local_time_response', _raw_payload: '0334546A5F', device_local_time__s: 1600803892, device_local_time_formatted: '2020-09-22T19:44:52Z',
      },
    });
  });

  test('faulty_downlink', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '13 32 05',
      expected: {
        _packet_type: 'faulty_downlink_packet', _raw_payload: '133205', packet_error_reason: 'value_error', packet_fport: 50,
      },
    });
  });

  test('boot_packet', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '00 27001650 020312 80 90 06 371100',
      expected: {
        _packet_type: 'boot_packet', _raw_payload: '0027001650020312809006371100', configuration_restored: true, device_firmware_version: '2.3.18', device_serial: '50160027', device_uptime_accumulated__days: 183.63, hardware_configuration: 'pulse_lbus', packet_reason: 'from_shutdown', wakeup_reason_mcu: ['nfc_wakeup'],
      },
    });
  });

  test('shutdown_packet', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '01 33 82826BD1164A337C432326B29AD03C0138271501170600002090241262700374301C00',
      expected: {
        _app_connected_within_a_day: true, _battery_voltage__V: 3.59, _internal_temperature_max__C: 30, _internal_temperature_min__C: 2, _mbus_data_records_truncated: false, _packet_type: 'shutdown_packet', _pulse_1_medium_type: 'L_water', _pulse_1_muliplier: 10, _pulse_2_medium_type: 'triggers', _pulse_2_muliplier: 1, _radio_downlink_snr__dB: 4, _radio_uplink_power__dBm: 14, _raw_payload: '013382826BD1164A337C432326B29AD03C0138271501170600002090241262700374301C00', _shutdown_reason: 'app_shutdown', active_alerts: ['pulse_2_trigger_alert'], battery_remaining__years: 8.9, internal_temperature__C: 22, mbus_data_records_unparsed: '0374301C00', mbus_last_status: 'connected', mbus_serial: '70621224', mbus_status: '0x90', meter_actuality_duration__minutes: 105, meter_actuality_duration_formatted: '1.75 hours', pulse_1_accumulated__L_water: 10203040500, pulse_1_input_state: 'open', pulse_1_serial: '15273801', pulse_2_accumulated__triggers: 1559, pulse_2_input_state: 'closed', radio_downlink_rssi__dBm: -51,
      },
    });
  });
});
