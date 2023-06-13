import { decodeRaw, decodeUnixEpoch } from '../src/ul20xx_1_0_x_decoder.processed';
import { testPacket } from './utils/test_utils';

describe('decodeUnixTS tests', () => {
  var err = { errors: [], warnings: [] };
  test('grab entire byte from 0xAC', () => {
    expect(decodeUnixEpoch(0, err).value).toEqual('invalid_timestamp');
    expect(decodeUnixEpoch(946684800 + 130, err).value).toEqual('invalid_timestamp');
    expect(decodeUnixEpoch(1420070400 + 5, err).value).toEqual('2015-01-01T00:00:05.000Z');
  });
});

describe('Config packts', () => {
  test('ldr_input_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '01A03004',
      expected: {
        data: {
          packet_type: {
            value: 'ldr_input_config_packet',
          },
          ldr_off_threshold_high: {
            value: 160,
            raw: 160,
          },
          ldr_on_threshold_low: {
            value: 48,
            raw: 48,
          },
          trigger_alert_enabled: {
            value: true,
          },
        },
      },
    });
  });

  test('dig_input_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '032C0102FE32',
      expected: {
        data: {
          packet_type: {
            value: 'dig_input_config_packet',
          },
          light_on_duration: {
            value: 300,
            raw: 300,
            unit: 's',
          },
          signal_edge_rising: {
            value: true,
          },
          trigger_alert_enabled: {
            value: false,
          },
          address: {
            value: 'dali_broadcast',
            raw: 254,
          },
          dimming_level: {
            value: 50,
            raw: 50,
            unit: '%',
          },
        },
      },
    });
  });

  test('calendar_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '06E21E9619B309',
      expected: {
        data: {
          packet_type: { value: 'calendar_config_packet' }, sunrise_offset: { value: -30, unit: 'min', raw: -30 }, sunset_offset: { value: 30, unit: 'min', raw: 30 }, latitude: { value: 65.5, unit: '°' }, longitude: { value: 24.83, unit: '°' },
        },
      },
    });
  });

  test('status_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '07100E0000',
      expected: { data: { packet_type: { value: 'status_config_packet' }, status_interval: { value: 3600, unit: 's' } } },
    });
  });

  test('profile_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '081603FE1E0000061E24503C1E6650',
      expected: {
        data: {
          packet_type: { value: 'profile_config_packet' }, profile_id: { value: 22, raw: 22 }, profile_version: { value: 3, raw: 3 }, address: { value: 'dali_broadcast', raw: 254 }, days_active: { value: ['mon', 'tue', 'wed', 'thu'], raw: 30 }, dimming_steps: [{ step_time: { value: '00:00', raw: 0 }, dimming_level: { value: 0, raw: 0, unit: '%' } }, { step_time: { value: '01:00', raw: 60 }, dimming_level: { value: 30, raw: 30, unit: '%' } }, { step_time: { value: '06:00', raw: 360 }, dimming_level: { value: 80, raw: 80, unit: '%' } }, { step_time: { value: '10:00', raw: 600 }, dimming_level: { value: 30, raw: 30, unit: '%' } }, { step_time: { value: '17:00', raw: 1020 }, dimming_level: { value: 80, raw: 80, unit: '%' } }],
        },
      },
    });
  });

  test('time_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '09681A9C59',
      expected: { data: { packet_type: { value: 'time_config_packet' }, device_unix_epoch: { value: '2017-08-22T11:50:00.000Z', raw: 1503402600 } } },
    });
  });

  test('default_dim_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0A0000',
      expected: {
        data: {
          packet_type: { value: 'legacy_defaults_config_packet' }, default_dim: { value: 0, unit: '%' }, ldr_alert_enabled: { value: false }, dig_alert_enabled: { value: false }, dali_alert_enabled: { value: false },
        },
      },
    });
  });

  test('usage_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0B100E0000E6',
      expected: { data: { packet_type: { value: 'usage_config_packet' }, usage_interval: { value: 3600, unit: 's' }, mains_voltage: { value: 230, unit: 'V' } } },
    });
  });

  test('holiday_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0C0101021205010611080E0C11',
      expected: { data: { packet_type: { value: 'holiday_config_packet' }, holidays: [{ value: '01/01', raw: 257 }, { value: '02/18', raw: 530 }, { value: '05/01', raw: 1281 }, { value: '06/17', raw: 1553 }, { value: '08/14', raw: 2062 }, { value: '12/17', raw: 3089 }] } },
    });
  });

  test('boot_delay_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0D78',
      expected: { data: { packet_type: { value: 'boot_delay_config_packet' }, boot_delay_range: { value: 120, unit: 's' } } },
    });
  });

  test('boot_delay_config_packet 2', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0D2C01',
      expected: { data: { packet_type: { value: 'boot_delay_config_packet' }, boot_delay_range: { value: 300, unit: 's' } } },
    });
  });

  test('defaults_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0E050005',
      expected: { data: { packet_type: { value: 'defaults_config_packet' }, default_dim: { value: 0, unit: '%' }, fade_duration: { value: 2.83, unit: 's', raw: 5 } } },
    });
  });

  test('meta_pos_config packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '130140176C2384F8B20E',
      expected: { data: { packet_type: { value: 'location_config_packet' }, latitude: { value: 59.42864, unit: '°' }, longitude: { value: 24.6610052, unit: '°' } } },
    });
  });

  test('meta_pos_config packet extra', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '1303AC5E6D230017C10E12c396c3b662696b75205374722e20322d3136',
      expected: {
        data: {
          packet_type: { value: 'location_config_packet' }, latitude: { value: 59.437022, unit: '°' }, longitude: { value: 24.753536, unit: '°' }, address: { value: 'Ööbiku Str. 2-16' },
        },
      },
    });
  });

  test('metering_alert_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '160114004B00D700F50050',
      expected: {
        data: {
          packet_type: { value: 'metering_alert_config_packet' }, min_power: { value: 20, raw: 20, unit: 'W' }, max_power: { value: 75, raw: 75, unit: 'W' }, min_voltage: { value: 215, raw: 215, unit: 'V' }, max_voltage: { value: 245, raw: 245, unit: 'V' }, min_power_factor: { value: 0.8, raw: 80 },
        },
      },
    });
  });

  test('metering_alert_config_packet extra', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '16011400FFFFFFFFF500FF',
      expected: {
        data: {
          packet_type: { value: 'metering_alert_config_packet' }, min_power: { value: 20, raw: 20, unit: 'W' }, max_power: { value: 'alert_off', raw: 65535, unit: '' }, min_voltage: { value: 'alert_off', raw: 65535, unit: '' }, max_voltage: { value: 245, raw: 245, unit: 'V' }, min_power_factor: { value: 'alert_off', raw: 255 },
        },
      },
    });
  });

  test('multicast_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '52014433221182840c7056429b143d21974557f93a5382840c70c08494b931fe2fa6f8835c6a',
      expected: {
        data: {
          packet_type: { value: 'multicast_config_packet' }, multicast_device: { value: 1 }, devaddr: { value: '11223344' }, nwkskey: { value: '82840C7056429B143D21974557F93A53' }, appskey: { value: '82840C70C08494B931FE2FA6F8835C6A' },
        },
      },
    });
  });

  test('clear_config_packet (LDR) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF01',
      expected: { data: { packet_type: { value: 'clear_config_packet' }, reset_target: { value: 'ldr_input_config' } } },
    });
  });

  test('clear_config_packet (DIG) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF03',
      expected: { data: { packet_type: { value: 'clear_config_packet' }, reset_target: { value: 'dig_input_config' } } },
    });
  });

  test('clear_config_packet (profile) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF040A',
      expected: { data: { packet_type: { value: 'clear_config_packet' }, reset_target: { value: 'profile_config' }, address: { value: 'dali_single_5', raw: 10 } } },
    });
  });

  test('clear_config_packet (holiday) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF06',
      expected: { data: { packet_type: { value: 'clear_config_packet' }, reset_target: { value: 'holiday_config' } } },
    });
  });

  test('clear_config_packet (multicast) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF52FF',
      expected: { data: { packet_type: { value: 'clear_config_packet' }, reset_target: { value: 'multicast_config' }, multicast_device: { value: 'all_multicast_devices', raw: 255 } } },
    });
  });

  test('clear_config_packet (factory reset) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FFFF0D008350',
      expected: { data: { packet_type: { value: 'clear_config_packet' }, reset_target: { value: 'factory_reset' }, device_serial: { value: '5083000D' } } },
    });
  });
});
