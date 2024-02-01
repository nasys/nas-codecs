import { rawEncode } from '../src/ul20xx_1_1_x_encoder.js';
import { decodeRaw } from '../src/ul20xx_1_1_x_decoder_no_uplink.processed';
import { hexToBytes } from './utils/test_utils';


function test_decode_encode(bytes, fport)
{
  var decoded = decodeRaw(fport, bytes);
  expect(decoded.errors.length).toEqual(0);
  expect(decoded.warnings.length).toEqual(0);

  var res = rawEncode(decoded);
  expect(res.fPort).toEqual(fport);
  expect(res.bytes).toEqual(bytes);
  expect(res.errors.length).toEqual(0);
  expect(res.warnings.length).toEqual(0);
}

describe('UL20xx packet encoder', () => {
  test('ldr_input_config_packet gives invalid key flag', () => {
    let data = {
      "data": {
        "packet_type": "deprecated_ldr_input_config_packet",
        "ldr_off_threshold_high": "80",
        "ldr_on_modified": "40",
        "trigger_alert_enabled": "false"
      }
    };
    var res = rawEncode(data);
    expect(res.warnings).toEqual(["ldr_on_threshold_low_key_not_found"]);    
  });

  test('50_deprecated_ldr_input_config_packet modified', () => {
    var bytes = hexToBytes("0150FF04");
    var fport = 50;
    test_decode_encode(bytes, fport);
  });

  test('50_deprecated_ldr_input_config_packet DS', () => {
    var bytes = hexToBytes("01502804");
    var fport = 50;
    test_decode_encode(bytes, fport);
  });

  test('50_deprecated_dig_input_config_packet DS', () => {
    var bytes = hexToBytes("03 1E00 00 FE 64");
    var fport = 50;
    test_decode_encode(bytes, fport);
  });

  test('50_status_config_packet DS', () =>{
    var bytes = hexToBytes("0758020000");
    var fport = 50;
    test_decode_encode(bytes, fport);
  })

  test('50_metering_alert_config_packet DS', () =>{
    var bytes = hexToBytes('16 01 0500 FFFF BE00 FFFF FF');
    var fport = 50;
    test_decode_encode(bytes, fport);
  })

  test('50_time_config_packet DS', () =>{
    var bytes = hexToBytes("09 F37F205E");
    var fport = 50;
    test_decode_encode(bytes, fport);
  })
  
  test('50_time_config_packet DS timereq', () =>{
  var bytes = hexToBytes("0900000000");
  var fport = 50;
  test_decode_encode(bytes, fport);
  })

  test('50_calendar_config_packet DS', () =>{
    var bytes = hexToBytes("2011000D1368050500FE19");
    var fport = 50;
    test_decode_encode(bytes, fport);
  })

  test('50_profile_config_packet DS', () =>{
    var bytes = hexToBytes("21 00 02 FE 3E 00 06 14 21 FF");
    var fport = 50;
    test_decode_encode(bytes, fport)
  })
  
  test('50_fade_config_packet DS', () =>{
    var bytes = hexToBytes("220A");
    var fport = 50;
    test_decode_encode(bytes, fport)
  })

  test('50_fade_config_packet modified', () => {
    var bytes = hexToBytes("2201");
    var fport = 50;
    test_decode_encode(bytes, fport)
  });

  test('50_holiday_config_packet DS', () =>{
    var bytes = hexToBytes('2303010105010C17');
    var fport = 50;
    test_decode_encode(bytes, fport);
  });

  test('50_location_config_packet DS', () =>{
    var bytes = hexToBytes('2612AC5E6D230017C10EC396C3B662696B75205374722E20322D3136');
    var fport = 50;
    test_decode_encode(bytes, fport)
  });
  test('50_lumalink_config_packet DS', () =>{
    var bytes = hexToBytes('2703');
    var fport = 50;
    test_decode_encode(bytes, fport);
  });
  test('50_light_sesnor_config_packet DS', () => {
    var bytes = hexToBytes('29020E3CFE0000C4413C CCCCF642FF');
    var fport = 50;
    test_decode_encode(bytes, fport);
  });
  test('50_multicast_config_packet DS', () =>{
    var bytes = hexToBytes('52 00 44332211 82840C7056429B143D21974557F93A53 82840C70C08494B931FE2FA6F8835C6A');
    var fport = 50;
    test_decode_encode(bytes, fport);
  });
  test('50_clear_config_packet DS', () =>{
    var bytes = hexToBytes('FF FF 0D008350');
    var fport = 50;
    test_decode_encode(bytes, fport);
  });
  test('50_chained_config_packet DS', () =>{
    var bytes = hexToBytes('FE 01 50 28 00 0D 5802');
    var fport = 50;
    test_decode_encode(bytes, fport)
  });
  test('49_simple_config_req DS', () =>{
    var bytes = hexToBytes('5200');
    var fport = 49;
    test_decode_encode(bytes, fport);
  });
  test('51_dfu_request DS', () =>{
    var bytes = hexToBytes('FE');
    var fport = 51;
    test_decode_encode(bytes, fport);
  });
  test('60_manual_dimming', () =>{
    var bytes= hexToBytes('0104320864');
    var fport = 60;
    test_decode_encode(bytes, fport);
  });
  test('60_manual_dimming_timed', () =>{
    var bytes = hexToBytes('09FE6405');
    var fport = 60;
    test_decode_encode(bytes, fport);
  });
  test('60_manual_status_usage_request', () =>{
    var bytes = hexToBytes('05 02');
    var fport = 60;
    test_decode_encode(bytes, fport);
  });
  test('60_custom_dali_request', () =>{
    var bytes = hexToBytes('04 A300FF2DFF2D');
    var fport = 60;
    test_decode_encode(bytes, fport);
  });
  test('60_driver_memory_read', ()=>{
    var bytes = hexToBytes('07 04 00 03 06');
    var fport = 60;
    test_decode_encode(bytes, fport);
  });
  test('60_driver_memory_write', ()=>{
    var bytes = hexToBytes('08 04 00 03');
    var fport = 60;
    test_decode_encode(bytes, fport);
  })
});
