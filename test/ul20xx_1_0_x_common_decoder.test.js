import { decodeRaw, decodeUnixEpoch } from '../src/ul20xx_1_0_x_decoder.processed';
import { testPacket } from './utils/test_utils';

describe('decodeUnixTS tests', () => {
  var err = { errors: [], warnings: [] };
  test('grab entire byte from 0xAC', () => {
    expect(decodeUnixEpoch(0, err)).toEqual('invalid_timestamp');
    expect(decodeUnixEpoch(946684800 + 130, err)).toEqual('invalid_timestamp');
    expect(decodeUnixEpoch(1420070400 + 5, err)).toEqual('2015-01-01T00:00:05.000Z');
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
          "packet_type": "ldr_input_config_packet",
          "ldr_off_threshold_high": 160,
          "ldr_on_threshold_low": 48,
          "trigger_alert_enabled": true
        }
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
          "packet_type": "dig_input_config_packet",
          "light_on_duration__s": 300,
          "signal_edge_rising": true,
          "trigger_alert_enabled": false,
          "address": "dali_broadcast",
          "dimming_level__percent": 50
        }
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
          "packet_type": "calendar_config_packet",
          "sunrise_offset__min": -30,
          "sunset_offset__min": 30,
          "latitude__deg": 65.5,
          "longitude__deg": 24.83
        }
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
        }
      },
    });
  });

  test('profile_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '081603FE1E0000061E24503C1E6650',
      expected: {
        data: {
          "packet_type": "profile_config_packet",
          "profile_id": 22,
          "profile_version": 3,
          "address": "dali_broadcast",
          "days_active": [
            "mon",
            "tue",
            "wed",
            "thu"
          ],
          "dimming_steps": [
            {
              "step_time": "00:00",
              "dimming_level__percent": 0
            },
            {
              "step_time": "01:00",
              "dimming_level__percent": 30
            },
            {
              "step_time": "06:00",
              "dimming_level__percent": 80
            },
            {
              "step_time": "10:00",
              "dimming_level__percent": 30
            },
            {
              "step_time": "17:00",
              "dimming_level__percent": 80
            }
          ]
        }
      },
    });
  });

  test('time_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '09681A9C59',
      expected: {
        data: {
          "packet_type": "time_config_packet",
          "device_unix_epoch": "2017-08-22T11:50:00.000Z"
        }
      },
    });
  });

  test('default_dim_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0A0000',
      expected: {
        data: {
          "packet_type": "legacy_defaults_config_packet",
          "default_dim__percent": 0,
          "ldr_alert_enabled": false,
          "dig_alert_enabled": false,
          "dali_alert_enabled": false
        }
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
        }
      },
    });
  });

  test('holiday_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0C0101021205010611080E0C11',
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
        }
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
        }
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
        }
      },
    });
  });

  test('defaults_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '0E050005',
      expected: {
        data: {
          "packet_type": "defaults_config_packet",
          "default_dim__percent": 0,
          "fade_duration__s": 2.83
        }
      },
    });
  });

  test('meta_pos_config packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '130140176C2384F8B20E',
      expected: {
        data: {
          "packet_type": "location_config_packet",
          "latitude__deg": 59.42864,
          "longitude__deg": 24.6610052
        }
      },
    });
  });

  test('meta_pos_config packet extra', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '1303AC5E6D230017C10E12c396c3b662696b75205374722e20322d3136',
      expected: {
        data: {
          "packet_type": "location_config_packet",
          "latitude__deg": 59.437022,
          "longitude__deg": 24.753536,
          "address": "Ööbiku Str. 2-16"
        }
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
        }
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
        }
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
        }
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
        }
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
        }
      },
    });
  });

  test('clear_config_packet (profile) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF040A',
      expected: {
        data: {
          "packet_type": "clear_config_packet",
          "reset_target": "profile_config",
          "address": "dali_single_5"
        }
      },
    });
  });

  test('clear_config_packet (holiday) from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: 'FF06',
      expected: {
        data: {
          "packet_type": "clear_config_packet",
          "reset_target": "holiday_config"
        }
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
        }
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
        }
      },
    });
  });
});
