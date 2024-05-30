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
      data: '0504',
      expected: {
        data: {
          "packet_type": "status_usage_request",
          "usage_requested": false,
          "status_requested": false,
          "dim_map_report_requested": true
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
      data: '8501',
      expected: {
        data: {
          "packet_type": "light_sensor_notification",
          "active_dim_step": 1,
        }, errors: [],
        warnings: [],
      },
    });
  });
});
