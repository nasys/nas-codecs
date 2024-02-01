import { decodeRaw } from '../src/ul20xx_1_0_x_decoder.processed';
import { testPacket } from './utils/test_utils';

describe('Config requests', () => {
  test('ldr_input_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '01',
      expected: {
        data: {
          "packet_type": "deprecated_ldr_input_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('dig_input_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '03',
      expected: {
        data: {
          "packet_type": "deprecated_dig_input_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('calendar_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '06',
      expected: {
        data: {
          "packet_type": "calendar_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('status_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '07',
      expected: {
        data: {
          "packet_type": "status_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('profile_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '0806',
      expected: {
        data: {
          packet_type: 'profile_config_request',
          profile_id: 6
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('profile_config_request list of profile ids', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '08FF',
      expected: {
        data: {
          packet_type: 'profile_config_request',
          profile_id: 'all_profiles'
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('default_dim_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '0A',
      expected: {
        data: {
          "packet_type": "default_dim_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('usage_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '0B',
      expected: {
        data: {
          "packet_type": "usage_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('holiday_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '0C',
      expected: {
        data: {
          "packet_type": "holiday_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('boot_delay_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '0D',
      expected: {
        data: {
          "packet_type": "boot_delay_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('defaults_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '0E',
      expected: {
        data: {
          "packet_type": "defaults_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('location_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '13',
      expected: {
        data: {
          "packet_type": "location_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('metering_alert_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '16',
      expected: {
        data: { 
          packet_type: 'metering_alert_confic_request' 
        }, errors: [],
        warnings: [],
        },
    });
  });

  describe('multicast_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '5202',
      expected: {
        data: {
          "packet_type": "multicast_config_request",
          "multicast_device": 2
        }, errors: [],
        warnings: [],
      },
    });
  });
});

describe('Commands', () => {
  test('activate_ota_command from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 51,
      data: 'FF',
      expected: {
        data: {
          "packet_type": "activate_dfu_command"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('dali_status_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '00FE',
      expected: {
        data: {
          "packet_type": "dali_status_request",
          "address": "all_drivers"
        }, errors: [],
        warnings: [],
      },
    });
  });


  describe('manual_dimming_command from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '01fe64',
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

  describe('custom_dali_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '0348A148A248A348A448A5',
      expected: {
        data: {
          "packet_type": "custom_dali_request",
          "query_data_raw": "48A148A248A348A448A5"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('custom_dali_command from DS', () => {
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
      },
    });
  });

  describe('status_usage_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '0501',
      expected: {
        data: {
          "packet_type": "status_usage_request",
          "usage_requested": true,
          "status_requested": false
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('interface_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '06FF',
      expected: {
        data: {
          "packet_type": "interface_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('driver_memory_read from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '0704000306',
      expected: {
        data: {
          "packet_type": "driver_memory_read",
          "address": "dali_single_2",
          "memory_bank": 0,
          "memory_address": 3,
          "read_size__bytes": 6
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('driver_memory_write', () => {
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

  describe('open_drain_out_control from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '0C01',
      expected: {
        data: {
          "packet_type": "open_drain_output_control",
          "open_drain_output_on": true
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('manual_timed_dimming from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '09fe640f',
      expected: {
        data: {
          "packet_type": "manual_timed_dimming",
          "destination": [
            {
              "address": "dali_broadcast",
              "dimming_level__percent": 100,
              "duration__minutes": 15
            }
          ]
        }, errors: [],
        warnings: [],
      },
    });
  });
});
