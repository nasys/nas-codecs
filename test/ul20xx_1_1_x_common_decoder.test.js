import { decodeRaw, formatLightLx } from '../src/ul20xx_1_1_x_decoder.processed';
import { testPacket } from './utils/test_utils';


describe('calcLightLx', () => {
  test('formatLightLx', () => {
    expect(formatLightLx(0.003)).toEqual("0.003");
    expect(formatLightLx(0.221)).toEqual("0.221");
    expect(formatLightLx(1.003)).toEqual("1.003");
    expect(formatLightLx(20.003)).toEqual("20.00");
    expect(formatLightLx(200.003)).toEqual("200.0");
    expect(formatLightLx(2000.003)).toEqual("2000");
    expect(formatLightLx(120000.003)).toEqual("120000");
  });
});

describe('Config packts', () => {
  test('fallback_dim', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '2532',
      expected: {
        data: {
          "packet_type": "fallback_dim_config_packet",
          "fallback_dimming_level__percent": 50
        },errors: [],
        warnings: [],
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
          "packet_type": "fade_config_packet",
          "fade_duration__s": 64
        },errors: [],
        warnings: [],
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
          "packet_type": "holiday_config_packet",
          "holidays": [
            "01/01",
            "02/18",
            "05/01",
            "06/17",
            "08/14",
            "12/17"
          ]
        },errors: [],
        warnings: [],
      },
    });
  });

  test('old ldr_input_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '01A03004',
      expected: {
        data: {
          "packet_type": "deprecated_ldr_input_config_packet",
          "ldr_off_threshold_high": 160,
          "ldr_on_threshold_low": 48,
          "trigger_alert_enabled": true
        },errors: [],
        warnings: [],
      },
    });
  });

  test('new light_sensor_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '29 02 0E 3C FE 0000C441 3C CDCCF642 FF',
      expected: {
        data: {
          "packet_type": "light_sensor_config_packet",
          "notification_on_every_step": false,
          "light_sensor_clamps_profile": true,
          "light_sensor_clamps_dig": true,
          "interpolate_steps": true,
          "measurement_duration__s": 60,
          "address": "dali_broadcast",
          "dim_steps": [
            {
              "light_level__lx": "24.50",
              "dimming_level__percent": 60
            },
            {
              "light_level__lx": "123.4",
              "dimming_level__percent": "inactive"
            }
          ]
        },errors: [],
        warnings: [],
      },
    });
  });

  test('old dig_input_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '032C0102FE32',
      expected: {
        data: {
          "packet_type": "deprecated_dig_input_config_packet",
          "light_on_duration__s": 300,
          "signal_edge_rising": true,
          "trigger_alert_enabled": false,
          "address": "dali_broadcast",
          "dimming_level__percent": 50
        }, errors: [],
          warnings: [],
      },
    });
  });

  test('new dig_input_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '28 00 03 FE 64 FF 0000 7800',
      expected: {
        data: {
          "packet_type": "dig_input_config_packet",
          "dig_mode_button": true,
          "polarity_high_or_rising": true,
          "notification_on_activation": false,
          "notification_on_inactivation": false,
          "address": "dali_broadcast",
          "active_dimming_level__percent": 100,
          "inactive_dimming_level__percent": "inactive",
          "on_delay__s": 0,
          "off_delay__s": 120
        },errors: [],
        warnings: [],
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
          "packet_type": "calendar_config_packet",
          "calendar_prefers_meta_pos": false,
          "calendar_clamps_profiles": false,
          "calendar_clamps_dig": false,
          "latitude__deg": 48.77,
          "longitude__deg": 13.84,
          "sunrise_steps": [
            {
              "zenith_angle__deg": "90.83",
              "dimming_level__percent": 0
            }
          ],
          "sunset_steps": [
            {
              "zenith_angle__deg": "89.67",
              "dimming_level__percent": 25
            }
          ]
        },errors: [],
        warnings: [],
      },
    });
  });

  test('status_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '07100E0000',
      expected: {
        data: {
          "packet_type": "status_config_packet",
          "status_interval__s": 3600
        },errors: [],
        warnings: [],
      },
    });
  });

  test('profile_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '21 00 02 FE 3E 00 06 14 21 FF ',
      expected: {
        data: {
          "packet_type": "profile_config_packet",
          "profile_id": 0,
          "address": "dali_broadcast",
          "days_active": [
            "mon",
            "tue",
            "wed",
            "thu",
            "fri"
          ],
          "dimming_steps": [
            {
              "step_time": "01:00",
              "dimming_level__percent": 20
            },
            {
              "step_time": "05:30",
              "dimming_level__percent": "inactive"
            }
          ]
        },errors: [],
        warnings: [],
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
          "packet_type": "fallback_dim_config_packet",
          "fallback_dimming_level__percent": 100
        },errors: [],
        warnings: [],
      },
    });
  });

  test('usage_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0B100E0000E6',
      expected: {
        data: {
          "packet_type": "usage_config_packet",
          "usage_interval__s": 3600,
          "mains_voltage__V": 230
        },errors: [],
        warnings: [],
      },
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
          "packet_type": "holiday_config_packet",
          "holidays": [
            "01/01",
            "05/01",
            "12/23"
          ]
        },errors: [],
        warnings: [],
      },
    });
  });

  test('boot_delay_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0D78',
      expected: {
        data: {
          "packet_type": "boot_delay_config_packet",
          "boot_delay_range__s": 120
        },errors: [],
        warnings: [],
      },
    });
  });

  test('boot_delay_config_packet 2', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0D2C01',
      expected: {
        data: {
          "packet_type": "boot_delay_config_packet",
          "boot_delay_range__s": 300
        },errors: [],
        warnings: [],
      },
    });
  });

  test('location_config packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '2612AC5E6D230017C10EC396C3B662696B75205374722E20322D3136',
      expected: {
        data: {
          "packet_type": "location_config_packet",
          "latitude__deg": 59.437022,
          "longitude__deg": 24.753536,
          "address": "Ööbiku Str. 2-16"
        },errors: [],
        warnings: [],
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
          "packet_type": "metering_alert_config_packet",
          "min_power__W": 20,
          "max_power__W": 75,
          "min_voltage__V": 215,
          "max_voltage__V": 245,
          "min_power_factor": 0.8
        },errors: [],
        warnings: [],
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
          "packet_type": "metering_alert_config_packet",
          "min_power__W": 20,
          "max_power__W": "alert_off",
          "min_voltage__V": "alert_off",
          "max_voltage__V": 245,
          "min_power_factor": "alert_off"
        },errors: [],
        warnings: [],
      },
    });
  });

  test('lumalink_config_packet', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '2701',
      expected: {
        data: {
          "packet_type": "lumalink_config_packet",
          "access_mode": "first_commission"
        },errors: [],
        warnings: [],
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
          "packet_type": "multicast_config_packet",
          "multicast_device": 1,
          "devaddr": "11223344",
          "nwkskey": "82840C7056429B143D21974557F93A53",
          "appskey": "82840C70C08494B931FE2FA6F8835C6A"
        },errors: [],
        warnings: [],
      },
    });
  });

  test('clear_config_packet (LDR) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF01',
      expected: {
        data: {
          "packet_type": "clear_config_packet",
          "reset_target": "ldr_input_config"
        },errors: [],
        warnings: [],
      },
    });
  });

  test('clear_config_packet (DIG) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF03',
      expected: {
        data: {
          "packet_type": "clear_config_packet",
          "reset_target": "dig_input_config"
        },errors: [],
        warnings: [],
      },
    });
  });

  test('clear_config_packet (holiday) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF23',
      expected: {
        data: {
          "packet_type": "clear_config_packet",
          "reset_target": "holiday_config"
        },errors: [],
        warnings: [],
      },
    });
  });

  test('clear_config_packet (multicast) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF52FF',
      expected: {
        data: {
          "packet_type": "clear_config_packet",
          "reset_target": "multicast_config",
          "multicast_device": "all_multicast_devices"
        },errors: [],
        warnings: [],
      },
    });
  });

  test('clear_config_packet (factory reset) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FFFF0D008350',
      expected: {
        data: {
          "packet_type": "clear_config_packet",
          "reset_target": "factory_reset",
          "device_serial": "5083000D"
        },errors: [],
        warnings: [],
      },
    });
  });
});
