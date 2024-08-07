import { decodeRaw } from '../src/ul20xx_1_1_x_decoder.processed';
import { testPacket } from './utils/test_utils';

describe('Config requests', function () {
  test('status_config_packet from DS', () => {
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

  describe('calendar_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '20',
      expected: {
        data: {
          "packet_type": "calendar_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('profile_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '21FF',
      expected: {
        data: {
          "packet_type": "profile_config_request",
          "profile_id": "all_profiles"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('fade_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '22',
      expected: {
        data: {
          "packet_type": "fade_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('holiday_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '23',
      expected: {
        data: {
          "packet_type": "holiday_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('dali_monitor_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '24',
      expected: {
        data: {
          "packet_type": "dali_monitor_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('fallback_dim_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '25',
      expected: {
        data: {
          "packet_type": "fallback_dim_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('location_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '26',
      expected: {
        data: {
          "packet_type": "location_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('interface_type_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '2B01',
      expected: {
        data: {
          "packet_type": "interface_type_config_packet",
          "interface_type": "analog_0_10v",
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('calendar_config_packet from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '20 11 08 0D13 6805 05 00 FE 19',
      expected: {
        data: {
          "packet_type": "calendar_config_packet",
          "calendar_prefers_meta_pos": false,
          "calendar_clamps_profiles": false,
          "calendar_clamps_dig": false,
          "ignore_gnss": true,
          "latitude__deg": 48.77,
          "longitude__deg": 13.84,
          "sunrise_steps": [
            {
              "dimming_level__percent": 0,
              "zenith_angle__deg": "90.83",
            },
          ],
            "sunset_steps": [
            {
              "dimming_level__percent": 25,
              "zenith_angle__deg": "89.67",
            },
          ],
        }, errors: [],
        warnings: [],
      },
    });
  });

  describe('lumalink_config_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 49,
      data: '27',
      expected: {
        data: {
          "packet_type": "lumalink_config_request"
        }, errors: [],
        warnings: [],
      },
    });
  });
});

describe('Commands', function () {
  describe('dim_map_report_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '0508',
      expected: {
        data: {
          "packet_type": "status_usage_request",
          "usage_requested": false,
          "status_requested": false,
          "dim_map_report_requested": false,
          "request_gnss_notification": true,
        }, errors: [],
        warnings: [],
      },
    });
  });
});

describe('Alert notifications', function () {
  describe('dim_map_report_request from DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 61,
      data: '8600B3046942B3EFB341EE68B466',
      expected: {
        data: {
          "packet_type": "location_notification",
          "location_status": "good_fix",
          "latitude__deg": "58.254589",
          "longitude__deg": "22.492041",
          "last_fix_utc_time": "2024-08-08T06:42:54.000Z"
        }, errors: [],
        warnings: [],
      },
    });
  });
});
