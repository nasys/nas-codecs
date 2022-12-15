import { decodeRaw } from '../src/ul20xx_1_1_x_decoder.processed';
import { testPacket } from './utils/test_utils';

describe('Config packts', () => {
  test('fallback_dim', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '2532',
      expected: {
        data: {
          packet_type: { value: 'fallback_dim_config_packet' }, fallback_dimming_level: { value: 50, unit: '%' },
        },
      },
    });
  });

  test('fade_config_packet', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '220E',
      expected: {
        data: {
          packet_type: { value: 'fade_config_packet' },
          fade_duration: { value: 64, raw: 14, unit: 's' },
        },
      },
    });
  });

  test('holiday_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '23060101021205010611080E0C11',
      expected: {
        data: {
          packet_type: {
            value: 'holiday_config_packet',
          },
          holidays: [
            {
              value: '01/01',
              raw: 257,
            },
            {
              value: '02/18',
              raw: 530,
            },
            {
              value: '05/01',
              raw: 1281,
            },
            {
              value: '06/17',
              raw: 1553,
            },
            {
              value: '08/14',
              raw: 2062,
            },
            {
              value: '12/17',
              raw: 3089,
            },
          ],
        },
      },
    });
  });

  test('ldr_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '01A03004',
      expected: {
        data: {
          packet_type: {
            value: 'ldr_config_packet',
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

  test('dig_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '032C0102FE32',
      expected: {
        data: {
          packet_type: {
            value: 'dig_config_packet',
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
      data: '20 11 00 0D13 6805 05 00 FE 19 ',
      expected: {
        data: {
          packet_type: {
            value: 'calendar_config_packet',
          },
          latitude: {
            value: 48.77,
            unit: '°',
          },
          longitude: {
            value: 13.84,
            unit: '°',
          },
          sunrise_steps: [
            {
              zenith_angle: {
                value: '90.83',
                raw: 5,
                unit: '°',
              },
              dimming_level: {
                value: 0,
                raw: 0,
                unit: '%',
              },
            },
          ],
          sunset_steps: [
            {
              zenith_angle: {
                value: '89.67',
                raw: -2,
                unit: '°',
              },
              dimming_level: {
                value: 25,
                raw: 25,
                unit: '%',
              },
            },
          ],
        },
      },
    });
  });

  test('status_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '07100E0000',
      expected: { data: { packet_type: { value: 'status_config_packet' }, staus_interval: { value: 3600, unit: 's' } } },
    });
  });

  test('profile_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '21 00 02 FE 3E 00 06 14 21 FF ',
      expected: {
        data: {
          packet_type: {
            value: 'profile_config_packet',
          },
          profile_id: {
            value: 0,
            raw: 0,
          },
          address: {
            value: 'dali_broadcast',
            raw: 254,
          },
          days_active: {
            value: [
              'mon',
              'tue',
              'wed',
              'thu',
              'fri',
            ],
            raw: 62,
          },
          dimming_steps: [
            {
              step_time: {
                value: '01:00',
                raw: 60,
              },
              dimming_level: {
                value: 20,
                raw: 20,
                unit: '%',
              },
            },
            {
              step_time: {
                value: '05:30',
                raw: 330,
              },
              dimming_level: {
                value: 'inactive',
                raw: 255,
                unit: '',
              },
            },
          ],
        },
      },
    });
  });

  test('fallback_dim_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '25 64 ',
      expected: {
        data: {
          packet_type: {
            value: 'fallback_dim_config_packet',
          },
          fallback_dimming_level: {
            value: 100,
            unit: '%',
          },
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

  // TODO datasheetis header 14?
  test('holiday_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '23 03 01 01 05 01 0C 17',
      expected: {
        data: {
          packet_type: {
            value: 'holiday_config_packet',
          },
          holidays: [
            {
              value: '01/01',
              raw: 257,
            },
            {
              value: '05/01',
              raw: 1281,
            },
            {
              value: '12/23',
              raw: 3095,
            },
          ],
        },
      },
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

  test('location_config packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '2612AC5E6D230017C10EC396C3B662696B75205374722E20322D3136',
      expected: {
        data: {
          packet_type: {
            value: 'location_config_packet',
          },
          latitude: {
            value: 59.437022,
            unit: '°',
          },
          longitude: {
            value: 24.753536,
            unit: '°',
          },
          address: {
            value: 'Ööbiku Str. 2-16',
          },
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
      expected: { data: { packet_type: { value: 'clear_config_packet' }, reset_target: { value: 'ldr_config' } } },
    });
  });

  test('clear_config_packet (DIG) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF03',
      expected: { data: { packet_type: { value: 'clear_config_packet' }, reset_target: { value: 'dig_config' } } },
    });
  });

  test('clear_config_packet (holiday) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF23',
      expected: {
        data: {
          packet_type: {
            value: 'clear_config_packet',
          },
          reset_target: {
            value: 'holiday_config',
          },
        },
      },
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
