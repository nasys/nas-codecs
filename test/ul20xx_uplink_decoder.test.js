import {decodeRaw} from '../src/ul20xx_decoder.js';
import {testPacket} from "./utils/test_utils.js";

describe("Status and usage", () => {

    test("status from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 24,
            data: 'DFD41D5E004B041502AE05050AFF32030306FF00',
            expected: {"data":{"packet_type":{"value":"status_packet"},"device_unix_epoch":{"value":"2020-01-14T14:49:03.000Z","raw":1579013343},"status_field":{"dali_error_external":{"value":false},"dali_error_connection":{"value":false},"ldr_state":{"value":false},"dig_state":{"value":false},"hardware_error":{"value":false},"firmware_error":{"value":false},"internal_relay_state":{"value":false}},"downlink_rssi":{"value":-75,"unit":"dBm"},"downlink_snr":{"value":4,"unit":"dB"},"mcu_temperature":{"value":21,"unit":"°C"},"analog_interfaces":{"open_drain_out_state":{"value":false},"voltage_alert_in_24h":{"value":false},"lamp_error_alert_in_24h":{"value":false},"power_alert_in_24h":{"value":false},"power_factor_alert_in_24h":{"value":false}},"ldr_value":{"value":174},"profiles":[{"profile_id":{"value":5,"raw":5},"profile_version":{"value":5,"raw":5},"profile_override":{"value":"none","raw":5},"dali_address_short":{"value":"single 5","raw":10},"days_active":{"value":["holiday","mon","tue","wed","thu","fri","sat","sun"],"raw":255},"dimming_level":{"value":50,"unit":"%","min":0,"max":100}},{"profile_id":{"value":3,"raw":3},"profile_version":{"value":3,"raw":3},"profile_override":{"value":"none","raw":3},"dali_address_short":{"value":"single 3","raw":6},"days_active":{"value":["holiday","mon","tue","wed","thu","fri","sat","sun"],"raw":255},"dimming_level":{"value":0,"unit":"%","min":0,"max":100}}]},"errors":[],"warnings":[]},
        });
    });

    test("status 2", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 24,
            data: '8044465e054d07ff02db02fafeff00',
            expected: {"data":{"packet_type":{"value":"status_packet"},"device_unix_epoch":{"value":"2020-02-14T06:56:00.000Z","raw":1581663360},"status_field":{"dali_error_external":{"value":true},"dali_error_connection":{"value":false},"ldr_state":{"value":true},"dig_state":{"value":false},"hardware_error":{"value":false},"firmware_error":{"value":false},"internal_relay_state":{"value":false}},"downlink_rssi":{"value":-77,"unit":"dBm"},"downlink_snr":{"value":7,"unit":"dB"},"mcu_temperature":{"value":-1,"unit":"°C"},"analog_interfaces":{"open_drain_out_state":{"value":false},"voltage_alert_in_24h":{"value":false},"lamp_error_alert_in_24h":{"value":false},"power_alert_in_24h":{"value":false},"power_factor_alert_in_24h":{"value":false}},"ldr_value":{"value":219},"profiles":[{"profile_id":{"value":2,"raw":2},"profile_version":{"value":"n/a","raw":250},"profile_override":{"value":"ldr_active","raw":250},"dali_address_short":{"value":"broadcast","raw":254},"days_active":{"value":["holiday","mon","tue","wed","thu","fri","sat","sun"],"raw":255},"dimming_level":{"value":0,"unit":"%","min":0,"max":100}}]},"errors":["dali external error reported by status packet"],"warnings":[]},
        });
    });

    test("usage from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 25,
            data: '04030000000000000603151400000000',
            expected: {"data":{"packet_type":{"value":"usage_packet"},"reports":[{"dali_address_short":{"value":"single 2","raw":4},"active_energy_total":{"value":0,"unit":"Wh"},"active_energy_instant":{"value":0,"unit":"W"}},{"dali_address_short":{"value":"single 3","raw":6},"active_energy_total":{"value":5141,"unit":"Wh"},"active_energy_instant":{"value":0,"unit":"W"}}]},"errors":[],"warnings":[]},
        });
    });

    test("usage 2", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 25,
            data: 'ff03ed0000000000',
            expected: {"data":{"packet_type":{"value":"usage_packet"},"reports":[{"dali_address_short":{"value":"internal_measurement","raw":255},"active_energy_total":{"value":237,"unit":"Wh"},"active_energy_instant":{"value":0,"unit":"W"}}]},"errors":[],"warnings":[]},
        });
    });

    test("usage d4i", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 25,
            data: 'ff800000000002cf000000000000000000000000a81f000011000000',
            expected: {"data":{"packet_type":{"value":"usage_packet"},"reports":[{"dali_address_short":{"value":"internal_measurement","raw":255},"lamp_on_time":{"value":0,"unit":"h"}},{"dali_address_short":{"value":"single 1","raw":2},"active_energy_total":{"value":0,"unit":"Wh"},"active_energy_instant":{"value":0,"unit":"W"},"load_side_energy_total":{"value":0,"unit":"Wh"},"load_side_energy_instant":{"value":0,"unit":"W"},"driver_operating_time":{"value":8104,"unit":"s"},"lamp_on_time":{"value":17,"unit":"s"}}]},"errors":[],"warnings":[]},
        });
    });
});

describe("Commands", () => {
    test("manual_dimming_command", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 60,
            data: '01fe64',
            expected: {"data":{"packet_type":{"value":"manual_dimming_command"},"manual_commands":[{"dali_address_short":{"value":"broadcast","raw":254},"dimming_level":{"value":100,"unit":"%","raw":100}}]},"errors":[],"warnings":[]},
        });
    });

    test("dali_status_request response from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 60,
            data: '00020406020C02',
            expected: {"data":{"packet_type":{"value":"dali_status_request"},"dali_statuses":[{"dali_address_short":{"value":"single 1","raw":2},"control_gear_failure":{"value":false},"lamp_failure":{"value":false},"lamp_on":{"value":true},"limit_error":{"value":false},"fade_running":{"value":false},"reset_state":{"value":false},"short_address":{"value":false},"power_cycle_seen":{"value":false}},{"dali_address_short":{"value":"single 3","raw":6},"control_gear_failure":{"value":false},"lamp_failure":{"value":true},"lamp_on":{"value":false},"limit_error":{"value":false},"fade_running":{"value":false},"reset_state":{"value":false},"short_address":{"value":false},"power_cycle_seen":{"value":false}},{"dali_address_short":{"value":"single 6","raw":12},"control_gear_failure":{"value":false},"lamp_failure":{"value":true},"lamp_on":{"value":false},"limit_error":{"value":false},"fade_running":{"value":false},"reset_state":{"value":false},"short_address":{"value":false},"power_cycle_seen":{"value":false}}]},"errors":["Dali address: single 3 errors: lamp failure","Dali address: single 6 errors: lamp failure"],"warnings":[]},
        });
    });

    test("manual_dimming_command response from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 60,
            data: '01FE64',
            expected: {"data":{"packet_type":{"value":"manual_dimming_command"},"manual_commands":[{"dali_address_short":{"value":"broadcast","raw":254},"dimming_level":{"value":100,"unit":"%","raw":100}}]},"errors":[],"warnings":[]},
        });
    });

    test("custom_dali_request response from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 60,
            data: '0348A1FE48A2A848A3FE48A4FE48A507',
            expected: {"data":{"packet_type":{"value":"custom_dali_request"},"custom_dali_data":{"value":"48A1FE48A2A848A3FE48A4FE48A507"}},"errors":[],"warnings":[]},
        });
    });

    test("custom_dali_command response from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 60,
            data: '04027F0321032B',
            expected: {"data":{"packet_type":{"value":"custom_dali_command"},"dali_command":{"value":"027F0321032B"}},"errors":[],"warnings":[]},
        });
    });

    test("interface_request response from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 60,
            data: '060100024503FF0400',
            expected: {"data":{"packet_type":{"value":"interface_request"},"dig":{"value":"off","raw":0},"ldr":{"value":69,"raw":69},"main_relay_state":{"value":false},"open_drain_out_state":{"value":false}},"errors":[],"warnings":[]},
        });
    });

    test("driver_memory_write response", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 60,
            data: '080400030607edface82e5',
            expected: {"data":{"packet_type":{"value":"driver_memory_write"},"dali_address_short":{"value":"single 2","raw":4},"memory_bank":{"value":0},"memory_address":{"value":3},"memory_value":{"value":"0607EDFACE82E5"}},"errors":[],"warnings":[]},
        });
    });

    test("driver_memory_write response failed", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 60,
            data: '08',
            expected: {"data":{"packet_type":{"value":"driver_memory_write"}},"errors":["driver_memory_write_failed"],"warnings":[]},
        });
    });
});

describe("Alerts, notifications", () => {
    test("dig_alert from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 61,
            data: '80200600',
            expected: {"data":{"packet_type":{"value":"dig_alert"},"dig_alert_counter":{"value":6}},"errors":[],"warnings":[]},
        });
    });

    test("ldr_alert from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 61,
            data: '81200079',
            expected: {"data":{"packet_type":{"value":"ldr_alert"},"ldr_state":{"value":false},"ldr_value":{"value":121}},"errors":[],"warnings":[]},
        });
    });

    test("dali_driver_alert from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 61,
            data: '83200202',
            expected: {"data":{"packet_type":{"value":"dali_driver_alert"},"drivers":[{"dali_address_short":{"value":"single 1","raw":2},"control_gear_failure":{"value":false},"lamp_failure":{"value":true},"lamp_on":{"value":false},"limit_error":{"value":false},"fade_running":{"value":false},"reset_state":{"value":false},"short_address":{"value":false},"power_cycle_seen":{"value":false}}]},"errors":["Dali address: single 1 errors: lamp failure"],"warnings":[]},
        });
    });

    test("metering_alert from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 61,
            data: '84025900e50056',
            expected: {"data":{"packet_type":{"value":"metering_alert"},"lamp_error_alert":{"value":false},"over_current_alert":{"value":true},"under_voltage_alert":{"value":false},"over_voltage_alert":{"value":false},"low_power_factor_alert":{"value":false},"power":{"value":89,"unit":"W"},"voltage":{"value":229,"unit":"V"},"power_factor":{"value":0.86}},"errors":[],"warnings":["Metering alerts: over_current"]},
        });
    });
});

describe("Boot, etc sys packets", () => {

    test("boot_packet from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 99,
            data: '000D008350010101F37F205E000CFE0104',
            expected: {"data":{"packet_type":{"value":"boot_packet"},"device_serial":{"value":"5083000D"},"firmware_version":{"value":"1.1.1","raw":65793},"device_unix_epoch":{"value":"2020-01-16T15:23:31.000Z","raw":1579188211},"device_config":{"value":"dali","raw":0},"optional_features":{"value":["dig","ldr"],"raw":12},"dali_supply_state":{"value":"bus_high","raw":126},"dali_power_source":{"value":"external","raw":true},"dali_addressed_driver_count":{"value":1},"dali_unadressed_driver_found":{"value":false},"reset_reason":{"value":["soft_reset"],"raw":4}},"errors":[],"warnings":[]},
        });
    });

    test("boot_packet external", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 99,
            data: '00563412510100168e436d3803687e0000',
            expected: {"data":{"packet_type":{"value":"boot_packet"},"device_serial":{"value":"51123456"},"firmware_version":{"value":"1.0.22","raw":65558},"device_unix_epoch":{"value":"P0000-00-00T00:00:14","raw":946684814},"device_config":{"value":"analog_nc","raw":3},"optional_features":{"value":["ldr","metering"],"raw":104},"dali_supply_state":{"value":"bus_high","raw":126},"dali_power_source":{"value":"internal","raw":false},"dali_addressed_driver_count":{"value":0},"dali_unadressed_driver_found":{"value":false},"reset_reason":{"value":[],"raw":0}},"errors":[],"warnings":[]},
        });
    });

    test("invalid_downlink_packet from DS", () => {
        testPacket({
            decoderFn: decodeRaw,
            fport: 99,
            data: '13320a',
            expected: {"data":{"packet_type":{"value":"invalid_downlink_packet"},"packet_from_fport":{"value":50},"parse_error_code":{"value":"unsupported_header","raw":10}},"errors":["Config failed: unsupported_header"],"warnings":[]},
        });
    });
});
