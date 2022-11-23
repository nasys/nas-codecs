import {convertObjToFormatted, formatElementStrValueUnit} from '../src/util/ul20xx_format.js';

describe("toFormatted", () => {
    test("grab entire byte from 0xAC", () => {
        var input = {"data":{"packet_type":{"value":"status_packet"},"device_unix_epoch":{"value":"2020-01-14T14:49:03.000Z","raw":1579013343},"status_field":{"dali_error_external":{"value":false},"dali_error_connection":{"value":false},"ldr_state":{"value":false},"dig_state":{"value":false},"hardware_error":{"value":false},"firmware_error":{"value":false},"internal_relay_state":{"value":false}},"downlink_rssi":{"value":-75,"unit":"dBm"},"downlink_snr":{"value":4,"unit":"dB"},"mcu_temperature":{"value":21,"unit":"°C"},"analog_interfaces":{"open_drain_out_state":{"value":false},"voltage_alert_in_24h":{"value":false},"lamp_error_alert_in_24h":{"value":false},"power_alert_in_24h":{"value":false},"power_factor_alert_in_24h":{"value":false}},"ldr_value":{"value":174},"profiles":[{"profile_id":{"value":5,"raw":5},"profile_version":{"value":5,"raw":5},"profile_override":{"value":"none","raw":5},"dali_address_short":{"value":"single 5","raw":10},"days_active":{"value":["holiday","mon","tue","wed","thu","fri","sat","sun"],"raw":255},"dimming_level":{"value":50,"unit":"%","min":0,"max":100}},{"profile_id":{"value":3,"raw":3},"profile_version":{"value":3,"raw":3},"profile_override":{"value":"none","raw":3},"dali_address_short":{"value":"single 3","raw":6},"days_active":{"value":["holiday","mon","tue","wed","thu","fri","sat","sun"],"raw":255},"dimming_level":{"value":0,"unit":"%","min":0,"max":100}}]},"errors":[],"warnings":[]};
        var expedted =       {
            data: {
              packet_type: 'status_packet',
              device_unix_epoch: '2020-01-14T14:49:03.000Z',
              status_field: {
                dali_error_external: 'false',
                dali_error_connection: 'false',
                ldr_state: 'false',
                dig_state: 'false',
                hardware_error: 'false',
                firmware_error: 'false',
                internal_relay_state: 'false'
              },
              downlink_rssi: '-75 dBm',
              downlink_snr: '4 dB',
              mcu_temperature: '21 °C',
              analog_interfaces: {
                open_drain_out_state: 'false',
                voltage_alert_in_24h: 'false',
                lamp_error_alert_in_24h: 'false',
                power_alert_in_24h: 'false',
                power_factor_alert_in_24h: 'false'
              },
              ldr_value: '174',
              profiles: [ 
                {
                  "dali_address_short": "single 5",
                  "days_active": "holiday,mon,tue,wed,thu,fri,sat,sun",
                  "dimming_level": "50 %",
                  "profile_id": "5",
                  "profile_override": "none",
                  "profile_version": "5"
                },
                {
                  "dali_address_short": "single 3",
                  "days_active": "holiday,mon,tue,wed,thu,fri,sat,sun",
                  "dimming_level": "0 %",
                  "profile_id": "3",
                  "profile_override": "none",
                  "profile_version": "3"                    
                }
              ]
            },
            errors: [],
            warnings: [],            
          };
        expect(convertObjToFormatted(input, formatElementStrValueUnit)).toEqual(expedted);
    });
});
