import { convertObjToFormatted, formatElementStrValueUnit } from '../src/util/ul20xx_format';

describe('toFormatted', () => {
  test('grab entire byte from 0xAC', () => {
    var input = {
      data: {
        packet_type: { value: 'status_packet' },
        device_unix_epoch: { value: '2020-01-14T14:49:03.000Z', raw: 1579013343 },
        status: {
          dali_error_external: { value: false },
          dali_connection_error: { value: false },
          ldr_input_on: { value: false },
          dig_input_on: { value: false },
          hardware_error: { value: false },
          internal_relay_closed: { value: false },
          open_drain_output_on: { value: false },
        },
        downlink_rssi: { value: -75, unit: 'dBm' },
        downlink_snr: { value: 4, unit: 'dB' },
        mcu_temperature: { value: 21, unit: '°C' },
        analog_interfaces: {
          voltage_alert_in_24h: { value: false },
          lamp_error_alert_in_24h: { value: false },
          power_alert_in_24h: { value: false },
          power_factor_alert_in_24h: { value: false },
        },
        ldr_value: { value: 174 },
        profiles: [{
          profile_id: { value: 5, raw: 5 },
          profile_version: { value: 5, raw: 5 },
          address: { value: 'dali_single_5', raw: 10 },
          days_active: { value: ['holiday', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], raw: 255 },
          dimming_level: {
            value: 50, unit: '%', min: 0, max: 100,
          },
        }, {
          profile_id: { value: 3, raw: 3 },
          profile_version: { value: 3, raw: 3 },
          address: { value: 'dali_single_3', raw: 6 },
          days_active: { value: ['holiday', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], raw: 255 },
          dimming_level: {
            value: 0, unit: '%', min: 0, max: 100,
          },
        }],
      },
    };
    var expedted = {
      data: {
        packet_type: 'status_packet',
        device_unix_epoch: '2020-01-14T14:49:03.000Z',
        status: {
          dali_error_external: 'false',
          dali_connection_error: 'false',
          ldr_input_on: 'false',
          dig_input_on: 'false',
          hardware_error: 'false',
          internal_relay_closed: 'false',
          open_drain_output_on: 'false',
        },
        downlink_rssi: '-75 dBm',
        downlink_snr: '4 dB',
        mcu_temperature: '21 °C',
        analog_interfaces: {
          voltage_alert_in_24h: 'false',
          lamp_error_alert_in_24h: 'false',
          power_alert_in_24h: 'false',
          power_factor_alert_in_24h: 'false',
        },
        ldr_value: '174',
        profiles: [
          {
            address: 'dali_single_5',
            days_active: 'holiday,mon,tue,wed,thu,fri,sat,sun',
            dimming_level: '50 %',
            profile_id: '5',
            profile_version: '5',
          },
          {
            address: 'dali_single_3',
            days_active: 'holiday,mon,tue,wed,thu,fri,sat,sun',
            dimming_level: '0 %',
            profile_id: '3',
            profile_version: '3',
          },
        ],
      },
    };
    expect(convertObjToFormatted(input, formatElementStrValueUnit)).toEqual(expedted);
  });
});
