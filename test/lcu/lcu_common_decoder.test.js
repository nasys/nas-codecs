import {decodeRawDownlink} from '../../src/lcu_downlink_decoder.js';
import {decodeRawUplink} from '../../src/lcu_uplink_decoder.js';
import {decodeUnixEpoch} from '../../src/lcu_common_decoder.js';
import {testOnePacket} from "../test_utils.js";

function testOnBoth(data) {
    data.decoderFn = decodeRawDownlink;
    testOnePacket(data);
    data.decoderFn = decodeRawUplink;
    testOnePacket(data);
}

describe("decodeUnixTS tests", () => {
    test("grab entire byte from 0xAC", () => {
        expect(decodeUnixEpoch(0)['value']).toEqual('invalid_timestamp');
        expect(decodeUnixEpoch(946684800 + 130)['value']).toEqual('P0000-00-00T00:02:10');
        expect(decodeUnixEpoch(1420070400 + 5)['value']).toEqual('2015-01-01T00:00:05.000Z');
    });
});


describe("Config packts", () => {
    test("ldr_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '01A03004',
            expected: {"data":{"packet_type":{"value":"ldr_config_packet"},"switch_threshold_high":{"value":160,"raw":160},"switch_threshold_low":{"value":48,"raw":48},"switch_trigger_alert_enabled":{"value":true}},"errors":[],"warnings":[]}
        });
    });

    test("dig_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '032C0102FE32',
            expected: {"data":{"packet_type":{"value":"dig_config_packet"},"switch_time":{"value":300,"raw":300,"unit":"s"},"switch_transition":{"value":"enabled","raw":true},"switch_trigger_alert_enabled":{"value":false},"dali_address_short":{"value":"broadcast","raw":254},"dimming_level":{"value":50,"unit":"%"}},"errors":[],"warnings":[]}
        });
    });

    test("calendar_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '06E21E9619B309',
            expected: {"data":{"packet_type":{"value":"calendar_config_packet"},"sunrise_offset":{"value":-30,"unit":"min","raw":-30},"sunset_offset":{"value":30,"unit":"min","raw":30},"latitude":{"value":65.5,"unit":"°"},"longitude":{"value":24.83,"unit":"°"}},"errors":[],"warnings":[]}
        });
    });

    test("status_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '07100E0000',
            expected: {"data":{"packet_type":{"value":"status_config_packet"},"staus_interval":{"value":3600,"unit":"s"}},"errors":[],"warnings":[]}
        });
    });

    test("profile_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '081603FE1E0000061E24503C1E6650',
            expected: {"data":{"packet_type":{"value":"profile_config_packet"},"profile_id":{"value":22,"raw":22},"profile_version":{"value":3,"raw":3},"profile_override":{"value":"none","raw":3},"dali_address_short":{"value":"broadcast","raw":254},"days_active":{"value":["mon","tue","wed","thu"],"raw":30},"dimming_steps":[{"step_time":{"value":"00:00","raw":0},"dimming_level":{"value":0,"unit":"%"}},{"step_time":{"value":"01:00","raw":60},"dimming_level":{"value":30,"unit":"%"}},{"step_time":{"value":"06:00","raw":360},"dimming_level":{"value":80,"unit":"%"}},{"step_time":{"value":"10:00","raw":600},"dimming_level":{"value":30,"unit":"%"}},{"step_time":{"value":"17:00","raw":1020},"dimming_level":{"value":80,"unit":"%"}}]},"errors":[],"warnings":[]}
        });
    });

    test("time_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '09681A9C59',
            expected: {"data":{"packet_type":{"value":"time_config_packet"},"device_unix_epoch":{"value":"2017-08-22T11:50:00.000Z","raw":1503402600}},"errors":[],"warnings":[]}
        });
    });

    test("default_dim_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '0A0000',
            expected: {"data":{"packet_type":{"value":"legacy_defaults_config_packet"},"default_dim":{"value":0,"unit":"%"},"ldr_alert_enabled":{"value":false},"dig_alert_enabled":{"value":false},"dali_alert_enabled":{"value":false}},"errors":[],"warnings":[]}
        });
    });

    test("usage_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '0B100E0000E6',
            expected: {"data":{"packet_type":{"value":"usage_config_packet"},"usage_interval":{"value":3600,"unit":"s"},"mains_voltage":{"value":230,"unit":"V"}},"errors":[],"warnings":[]}
        });
    });

// TODO datasheetis header 14?
    test("holiday_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '0C0101021205010611080E0C11',
            expected: {"data":{"packet_type":{"value":"holiday_config_packet"},"holidays":[{"value":"01-01","raw":257},{"value":"02-18","raw":530},{"value":"05-01","raw":1281},{"value":"06-17","raw":1553},{"value":"08-14","raw":2062},{"value":"12-17","raw":3089}]},"errors":[],"warnings":[]}
        });
    });

    test("boot_delay_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '0D78',
            expected: {"data":{"packet_type":{"value":"boot_delay_config_packet"},"boot_delay_range":{"value":120,"unit":"s"}},"errors":[],"warnings":[]}
        });
    });

    test("boot_delay_config_packet 2", () => {
        testOnBoth({
            fport: 50,
            data: '0D2C01',
            expected: {"data":{"packet_type":{"value":"boot_delay_config_packet"},"boot_delay_range":{"value":300,"unit":"s"}},"errors":[],"warnings":[]}
        });
    });

    test("defaults_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '0E050005',
            expected: {"data":{"packet_type":{"value":"defaults_config_packet"},"default_dim":{"value":0,"unit":"%"},"fade_duration":{"value":2.83,"unit":"s","raw":5}},"errors":[],"warnings":[]}
        });
    });

    test("meta_pos_config packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '130140176C2384F8B20E',
            expected: {"data":{"packet_type":{"value":"location_config_packet"},"position_latitude":{"value":59.42864,"unit":"°"},"position_longitude":{"value":24.6610052,"unit":"°"}},"errors":[],"warnings":[]}
        });
    });

    test("meta_pos_config packet extra", () => {
        testOnBoth({
            fport: 50,
            data: '1303AC5E6D230017C10E12c396c3b662696b75205374722e20322d3136',
            expected: {"data":{"packet_type":{"value":"location_config_packet"},"position_latitude":{"value":59.437022,"unit":"°"},"position_longitude":{"value":24.753536,"unit":"°"},"address":{"value":"Ööbiku Str. 2-16"}},"errors":[],"warnings":[]}
        });
    });

    test("metering_alert_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '160114004B00D700F50050',
            expected: {"data":{"packet_type":{"value":"metering_alert_config_packet"},"min_power":{"value":20,"raw":20,"unit":"W"},"max_power":{"value":75,"raw":75,"unit":"W"},"min_voltage":{"value":215,"raw":215,"unit":"V"},"max_voltage":{"value":245,"raw":245,"unit":"V"},"min_power_factor":{"value":0.8,"raw":80}},"errors":[],"warnings":[]}
        });
    });

    test("metering_alert_config_packet extra", () => {
        testOnBoth({
            fport: 50,
            data: '16011400FFFFFFFFF500FF',
            expected: {"data":{"packet_type":{"value":"metering_alert_config_packet"},"min_power":{"value":20,"raw":20,"unit":"W"},"max_power":{"value":"alert_off","raw":65535,"unit":""},"min_voltage":{"value":"alert_off","raw":65535,"unit":""},"max_voltage":{"value":245,"raw":245,"unit":"V"},"min_power_factor":{"value":"alert_off","raw":255}},"errors":[],"warnings":[]}
        });
    });

    test("multicast_config_packet from DS", () => {
        testOnBoth({
            fport: 50,
            data: '52014433221182840c7056429b143d21974557f93a5382840c70c08494b931fe2fa6f8835c6a',
            expected: {"data":{"packet_type":{"value":"multicast_config_packet"},"multicast_device":{"value":1},"device_address":{"value":"11223344"},"network_security_key":{"value":"82840C7056429B143D21974557F93A53"},"application_security_key":{"value":"82840C70C08494B931FE2FA6F8835C6A"}},"errors":[],"warnings":[]}
        });
    });

    test("clear_config_packet (LDR) from DS", () => {
        testOnBoth({
            fport: 50,
            data: 'FF01',
            expected: {"data":{"packet_type":{"value":"clear_config_packet"},"reset_target":"ldr_config"},"errors":[],"warnings":[]}
        });
    });

    test("clear_config_packet (DIG) from DS", () => {
        testOnBoth({
            fport: 50,
            data: 'FF03',
            expected: {"data":{"packet_type":{"value":"clear_config_packet"},"reset_target":"dig_config"},"errors":[],"warnings":[]}
        });
    });

    test("clear_config_packet (profile) from DS", () => {
        testOnBoth({
            fport: 50,
            data: 'FF040A',
            expected: {"data":{"packet_type":{"value":"clear_config_packet"},"reset_target":"profile_config","dali_address_short":{"value":"single 5","raw":10}},"errors":[],"warnings":[]}
        });
    });

    test("clear_config_packet (holiday) from DS", () => {
        testOnBoth({
            fport: 50,
            data: 'FF06',
            expected: {"data":{"packet_type":{"value":"clear_config_packet"},"reset_target":"holiday_config"},"errors":[],"warnings":[]}
        });
    });

    test("clear_config_packet (multicast) from DS", () => {
        testOnBoth({
            fport: 50,
            data: 'FF52FF',
            expected: {"data":{"packet_type":{"value":"clear_config_packet"},"reset_target":"multicast_config","multicast_device":{"value":"all_multicast_devices","raw":255}},"errors":[],"warnings":[]}
        });
    });

    test("clear_config_packet (factory reset) from DS", () => {
        testOnBoth({
            fport: 50,
            data: 'FFFF0D008350',
            expected: {"data":{"packet_type":{"value":"clear_config_packet"},"reset_target":"factory_reset","device_serial":{"value":"0D008350"}},"errors":[],"warnings":[]}
        });
    });
});
