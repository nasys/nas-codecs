import { decodeRaw, volumeFormatUnit, meterMultiplierConvert } from '../src/cm30xx_decoder';
import { testPacket } from './utils/test_utils';

describe('CM30xx tests', () => {
  test('testVolumeFormatUnit', () => {
    var multiplier = 0.001;
    expect(volumeFormatUnit(15 * multiplier, multiplier)).toEqual('00000.015');
    expect(volumeFormatUnit(97531534 * multiplier, multiplier)).toEqual('97531.534');
    multiplier = 0.01;
    expect(volumeFormatUnit(15 * multiplier, multiplier)).toEqual('000000.15');
    expect(volumeFormatUnit(97531534 * multiplier, multiplier)).toEqual('975315.34');
    multiplier = 0.1;
    expect(volumeFormatUnit(15 * multiplier, multiplier)).toEqual('0000001.5');
    expect(volumeFormatUnit(97531534 * multiplier, multiplier)).toEqual('9753153.4');
    multiplier = 1.0;
    expect(volumeFormatUnit(15 * multiplier, multiplier)).toEqual('00000015');
    expect(volumeFormatUnit(97531534 * multiplier, multiplier)).toEqual('97531534');
    multiplier = 10.0;
    expect(volumeFormatUnit(10 * multiplier, multiplier)).toEqual('000000100');
    expect(volumeFormatUnit(15 * multiplier, multiplier)).toEqual('000000150');
    expect(volumeFormatUnit(97531534 * multiplier, multiplier)).toEqual('975315340');
  });

  test('testMeterMultiplierConvert', () => {
    expect(meterMultiplierConvert(3)).toEqual(0.001);
    expect(meterMultiplierConvert(4)).toEqual(0.01);
    expect(meterMultiplierConvert(5)).toEqual(0.1);
    expect(meterMultiplierConvert(6)).toEqual(1.0);
    expect(meterMultiplierConvert(7)).toEqual(10.0);
    expect(meterMultiplierConvert(2)).toEqual(-1);
    expect(meterMultiplierConvert(8)).toEqual(-1);
  });

  test('usage DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: '0411008C038f020500752b03b37f1200245f51945400',
      expected: {
        data: {
          app_connected_within_a_day: true,
          battery_voltage__V: 2.77,
          internal_temperature_max__C: 18,
          internal_temperature_min__C: 18,
          meter_medium: 'warm_water',
          meter_multiplier: 0.01,
          meter_unit: 'm3',
          packet_type: 'usage_packet',
          radio_downlink_snr__dB: 10,
          radio_uplink_power__dBm: 10,
          active_alerts: {
            backflow_pending: true,
            broken_pipe_pending: false,
            continuous_flow_pending: false,
            low_battery: false,
            no_usage: false,
            tamper_pending: false,
            temperature_pending: true
          },
          battery_remaining__years: 14.9,
          internal_temperature__C: 18,
          meter_accumulated_volume__m3: '003283.35',
          meter_actuality_duration__minutes: 3,
          meter_actuality_duration_formatted: '3 minutes',
          meter_readout_date: '2019-12-21',
          meter_serial: '00549451',
          meter_status: 'connected',
          radio_downlink_rssi__dBm: -36,
        },errors: [],
        warnings: [],
      },
    });
  });

  test('usage DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: '04000014015400000001',
      expected: {
        data: {
          packet_type: 'usage_packet',
          active_alerts: {
            backflow_pending: false,
            broken_pipe_pending: false,
            continuous_flow_pending: false,
            low_battery: false,
            no_usage: false,
            tamper_pending: false,
            temperature_pending: false
          },
          meter_status: 'connected',
          meter_multiplier: 0.01,
          meter_medium: 'gas',
          meter_unit: 'm3',
          meter_actuality_duration__minutes: 1,
          meter_actuality_duration_formatted: '1 minutes',
          meter_accumulated_volume__m3: '000000.84',
          app_connected_within_a_day: true,
        },errors: [],
        warnings: [],
      },
    });
  });

  test('general_conf DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '20DF1717024498393804DEBB2A130000000019001400641900000107000380',
      expected: {
        data: {
          packet_type: 'general_configuration_packet',
          alert_backflow_threshold: 0.02,
          alert_broken_pipe_threshold__m3_per_h: 6.5,
          alert_continuous_flow_enabled: true,
          alert_no_usage_interval__days: 7,
          alert_temperature_threshold_high__C: 'disabled',
          alert_temperature_threshold_low__C: 3,
          meter_accumulated_volume__m3: 321567.71,
          meter_medium: 'water',
          meter_multiplier: 0.01,
          meter_nominal_flow__m3_per_h: 2.5,
          meter_serial: '38399844',
          meter_unit: 'm3',
          privacy_mode_active: false,
          radio_lorawan_profile: 'lorawan_1_h_dynamic',
          radio_wmbus_profile: 'wmbus_driveby',
        },errors: [],
        warnings: [],
      },
    });
  });

  test('general_conf long', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '200000ff',
      expected: {
        data: {
          packet_type: 'general_configuration_packet',
        },
        errors: ['packet_too_long'],
        warnings: [],
      },
    });
  });

  test('general_conf unit ft3', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '20DF17170244983938D5DEBB2A130000000019001400641900000107000380',
      expected: {
        data: {
          packet_type: 'general_configuration_packet',
          alert_backflow_threshold: 0.02,
          alert_broken_pipe_threshold__ft3_per_h: 6.5,
          alert_continuous_flow_enabled: true,
          alert_no_usage_interval__days: 7,
          alert_temperature_threshold_high__C: 'disabled',
          alert_temperature_threshold_low__C: 3,
          meter_accumulated_volume__ft3: 321567.71,
          meter_medium: 'gas',
          meter_multiplier: 0.1,
          meter_nominal_flow__ft3_per_h: 2.5,
          meter_serial: '38399844',
          meter_unit: 'ft3',
          privacy_mode_active: true,
          radio_lorawan_profile: 'lorawan_1_h_dynamic',
          radio_wmbus_profile: 'wmbus_driveby',
        },errors: [],
        warnings: [],
      },
    });
  });

  test('general_conf missing unit', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '20D717170244983938DEBB2A130000000019001400641900000107000380',
      expected: {
        data: {
          packet_type: 'general_configuration_packet',
          alert_backflow_threshold: 0.02,
          alert_broken_pipe_threshold: 6.5,
          alert_continuous_flow_enabled: true,
          alert_no_usage_interval__days: 7,
          alert_temperature_threshold_high__C: 'disabled',
          alert_temperature_threshold_low__C: 3,
          meter_accumulated_volume: 321567.71,
          meter_nominal_flow: 2.5,
          meter_serial: '38399844',
          radio_lorawan_profile: 'lorawan_1_h_dynamic',
          radio_wmbus_profile: 'wmbus_driveby',
        },errors: [],
        warnings: [],
      },
    });
  });

  test('general_conf invalid', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '20 DF17 50 06 4498393804 DEBB2A134A000000 19001400641900000107000380',
      expected: {
        data: {
          packet_type: 'general_configuration_packet',
          alert_backflow_threshold: 0.02,
          alert_broken_pipe_threshold__m3_per_h: 6.5,
          alert_continuous_flow_enabled: true,
          alert_no_usage_interval__days: 7,
          alert_temperature_threshold_high__C: 'disabled',
          alert_temperature_threshold_low__C: 3,
          meter_accumulated_volume__m3: 318149147.614,
          meter_medium: 'water',
          meter_multiplier: 0.01,
          meter_nominal_flow__m3_per_h: 2.5,
          meter_serial: '38399844',
          meter_unit: 'm3',
          privacy_mode_active: false,
          radio_lorawan_profile: 'invalid_lorawan_profile',
          radio_wmbus_profile: 'invalid_wmbus_profile',
        },
        errors: ['invalid_lorawan_profile', 'invalid_wmbus_profile'],
        warnings: [],
      },
    });
  });

  test('location_conf DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '21 1F AC5E6D230017C10EF412c396c3b662696b75205374722e20322d31361032365630303030303030303337313734053132414236',
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

  test('boot packet', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '00 2B001650 020312 80 90 FF 0000 371100',
      expected: {
        data: {
          packet_type: 'boot_packet',
          configuration_restored: true,
          device_firmware_version: '2.3.18',
          device_serial: '5016002B',
          device_uptime_accumulated__days: 183.63,
          hardware_configuration: 'invalid_hardware_config',
          packet_reason: 'from_shutdown',
          wakeup_reason_mcu: ['nfc_wakeup'],
        },
        errors: ['invalid_hardware_config'],
        warnings: [],
      },
    });
  });

  test('shutdown packet DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '01 3304 C1 00 D7 43 3F254E05752B036BD1164A337C44983938',
      expected: {
        data: {
          app_connected_within_a_day: true,
          meter_medium: 'gas',
          meter_multiplier: 10,
          meter_unit: 'ft3',
          packet_type: 'shutdown_packet',
          shutdown_reason: 'app_shutdown', 
          active_alerts: {
            backflow_pending: true,
            broken_pipe_pending: false,
            continuous_flow_pending: false,
            low_battery: false,
            no_usage: true,
            tamper_pending: false,
            temperature_pending: false
          },
          battery_remaining__years: 8.9,
          battery_voltage__V: 3.59,
          internal_temperature__C: 22,
          internal_temperature_max__C: 30,
          internal_temperature_min__C: 2,
          meter_readout_date: '2019-12-21',
          meter_serial: '38399844',
          radio_downlink_rssi__dBm: -51,
          radio_downlink_snr__dB: 4,
          radio_uplink_power__dBm: 14,
          meter_accumulated_volume__ft3: '890074230',
          meter_actuality_duration__minutes: 105,
          meter_actuality_duration_formatted: '1.75 hours',
          meter_status: 'connected',
        },errors: [],
        warnings: [],
      },
    });
  });

  test('faulty downlink packet', () => {
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

  test('general_conf modularis', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '20ff170702ffffffff037eba000000000000ac2600001900 00 0000000000 01 0000 8080',
      expected: {
        data: {
          packet_type: 'general_configuration_packet',
          alert_backflow_threshold: 'disabled',
          alert_broken_pipe_threshold__m3_per_h: 'disabled',
          alert_continuous_flow_enabled: true,
          alert_no_usage_interval__days: 'disabled',
          alert_temperature_threshold_high__C: 'disabled',
          alert_temperature_threshold_low__C: 'disabled',
          meter_accumulated_volume__m3: 47.742,
          meter_accumulated_volume_offset__m3: 9.9,
          meter_medium: 'water',
          meter_multiplier: 0.001,
          meter_nominal_flow__m3_per_h: 2.5,
          meter_serial: 'not_available',
          meter_unit: 'm3',
          privacy_mode_active: false,
          radio_lorawan_profile: 'lorawan_1_h_static',
          radio_wmbus_profile: 'wmbus_driveby',
        },errors: [],
        warnings: [],
      },
    });
  });
});
