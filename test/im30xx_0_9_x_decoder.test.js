import { decodeRaw, meteringTimeFormat} from '../src/im30xx_decoder';
import { testPacket } from './utils/test_utils';

describe('IM30xx tests', () => {
  test('testMeteringTimeFormat', () => {
    var err = { errors: [], warnings: []};
    expect(meteringTimeFormat(0, err)).toEqual('00:00:00Z');
    expect(meteringTimeFormat(5, err)).toEqual('00:50:00Z');
    expect(meteringTimeFormat(6, err)).toEqual('01:00:00Z');
    expect(meteringTimeFormat(7, err)).toEqual('01:10:00Z');
    expect(meteringTimeFormat(143, err)).toEqual('23:50:00Z');
    expect(meteringTimeFormat(0xff, err)).toEqual('live');
  });

  test('Status DS', () => {
    testPacket({
      decoderFn: decodeRaw,
      fport: 24,
      data: 'ff36e20f5fff9d010c1003003b0c1d6500',
      expected: {
        data: {
          'kamstrup_date':'2020-07-16',
          'metering_time': 'live',
          'packet_type':'status_packet',
          'sensor_battery': 255,
          'sensor_rssi__dBm': -99,
          'kamstrup_serial_no': 6626572, 
          'utc_timestamp': '2020-07-16T05:14:30Z'
        },errors: [],
        warnings: [],
      },
    });
  });
  test('Usage DS', ()=>{
    testPacket({
      decoderFn: decodeRaw,
      fport: 25,
      data: '001f02e13ca2490d70b455471e00000000134bb600001538c700001bc2f59840',
      expected:{
        data: {
          'packet_type': 'usage_packet',
          'kamstrup_flow_v1_actual__L_per_h': 0,
          'kamstrup_heat_energy_e1__kWh': 1329052.13,
          'measuring_time': '05:10:00Z',
          'kamstrup_operating_hours':46667,
          'kamstrup_t1_t2_diff_temp__C': 4.78,
          'kamstrup_time': '05:10:00Z',
          'kamstrup_volume_v1__m3':54708.44
        },errors: [],
        warnings: [],
      },
    });
  });
  test('configuration packet',()=>{
    testPacket({
      decoderFn: decodeRaw,
      fport: 50,
      data: '03681A9C59',
      expected:{
        data:{
          'packet_type':'device_time_config',
          'device_clock': '2017-08-22T11:50:00Z'
        },errors: [],
        warnings: [],
      },
    });
  });
  test('update_mode_dfu', ()=>{
    testPacket({
      decoderFn: decodeRaw,
      fport: 51,
      data: 'FF',
      expected:{
        data:{'packet_type': 'activate_dfu_command'
      },errors: [],
      warnings: [],
      },
    });
  });
  test('command_mode', ()=>{
    testPacket({
      decoderFn: decodeRaw,
      fport: 60,
      data: '000D',
      expected:{
        data:{'packet_type':'request_register_values',
        'kamstrup_registers': ['volume_v1']
      },errors: [],
      warnings: [],
      },
    });
  });
  test('boot_debug_packet', ()=>{
    testPacket({
      decoderFn: decodeRaw,
      fport: 99,
      data: '0076001E4D00080152831D04009BF0FD01D50000181800001311060100DE64955A',
      expected:{
        data:{'packet_type':'boot_packet',
        'device_firmware_version': '0.8.1',
        'device_lorawan_class': 'class_A',
        'device_serial': '4D1E0076',
        'device_time_utc': '2018-02-27T14:02:06.000Z',
        'kamstrup_config_1': '3 3 419 419',
        'kamstrup_config_2': '213 00 24 24 00 00',
        'kamstrup_meter_id': 69043026,
        'kamstrup_leakage_limit_cold_ina_inb': 'off',
        'kamstrup_leakage_limits_v1_v2': 'off',
        'kamstrup_pulse_input_a': '10 m3/h',
        'kamstrup_pulse_input_b': '10 m3/h',
        'kamstrup_tariff': 'no_active_tariff',
        'kamstrup_type': 'heat_meter'
      },errors: [],
      warnings: [],
      },
    });
  });
});
