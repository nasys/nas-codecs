import {BinaryExtract, BitExtract} from './util/extract.js';
import {pad, bitFalseTrue} from './util/misc.js';
import {daliAddressParse, profileParserPartial, decodeUnixEpoch, decodeFport50, decodeFport60, decodeDaliStatus} from './lcu_common_decoder.js';

function profileParser(dataView, err) {
    var profile = {};
    profileParserPartial(dataView, profile, err);

    var level = dataView.getUint8();    
    profile.dimming_level = {"value": level, "unit": "%", "min": 0, "max": 100};
    return profile;
}

function statusParser(buffer, result, err) {
    // does not support legacy mode status packet!
    var dataView = new BinaryExtract(buffer);

    result.packet_type = {value: "status_packet"};

    var epoch = dataView.getUint32();
    result.device_unix_epoch = decodeUnixEpoch(epoch);

    {
        var status_field = {};
        var bits = dataView.getUint8Bits();

        var dali_err_ext = bits.getBits(1);
        status_field.dali_error_external = bitFalseTrue(dali_err_ext);
        if(dali_err_ext) err.errors.push("dali external error reported by status packet");
        
        var dali_err_conn = bits.getBits(1);
        status_field.dali_error_connection = bitFalseTrue(dali_err_conn);
        if(dali_err_conn) err.errors.push("dali connection error reported by status packet");

        status_field.ldr_state = bitFalseTrue(bits.getBits(1));
        bits.getBits(1);
        status_field.dig_state = bitFalseTrue(bits.getBits(1));
        status_field.hardware_error = bitFalseTrue(bits.getBits(1));
        status_field.firmware_error = bitFalseTrue(bits.getBits(1));
        status_field.internal_relay_state = bitFalseTrue(bits.getBits(1));
        result.status_field = status_field
    }

    result.downlink_rssi = {"value": -1 * dataView.getUint8(), "unit": "dBm"};

    result.downlink_snr = {"value": dataView.getInt8(), "unit": "dB"};

    result.mcu_temperature = {"value": dataView.getInt8(), "unit": "°C"};

    var thr_sent = false;
    var ldr_sent = false;
    {
        var analog_interfaces = {};
        var bits2 = dataView.getUint8Bits();
        thr_sent = bits2.getBits(1);
        ldr_sent = bits2.getBits(1);
        analog_interfaces.open_drain_out_state = bitFalseTrue(bits2.getBits(1));
        bits2.getBits(1);
        analog_interfaces.voltage_alert_in_24h = bitFalseTrue(bits2.getBits(1));
        analog_interfaces.lamp_error_alert_in_24h = bitFalseTrue(bits2.getBits(1));
        analog_interfaces.power_alert_in_24h = bitFalseTrue(bits2.getBits(1));
        analog_interfaces.power_factor_alert_in_24h = bitFalseTrue(bits2.getBits(1));
        result.analog_interfaces = analog_interfaces
    }
    if(thr_sent) {
        result.thr_value = {"value": dataView.getUint8()};
    }
    if(ldr_sent) {
        result.ldr_value = {"value": dataView.getUint8()};
    }

    result.profiles = [];
    while(dataView.availableLen()) {
        result.profiles.push(profileParser(dataView, err));
    }
}

function usageConsumptionParse(dataView, err) {
    var result = {};
    var addr = dataView.getUint8();
    result.dali_address_short = daliAddressParse(addr, "internal_measurement", err);

    {
        var bits = dataView.getUint8Bits();
        if(bits.getBits(1)) {
            result.active_energy_total = {"value": dataView.getUint32(), "unit": "Wh"};
        }
        if(bits.getBits(1)) {
            result.active_energy_instant = {"value": dataView.getUint16(), "unit": "W"};
        }
        if(bits.getBits(1)) {
            result.load_side_energy_total = {"value": dataView.getUint32(), "unit": "Wh"};
        }
        if(bits.getBits(1)) {
            result.load_side_energy_instant = {"value": dataView.getUint16(), "unit": "W"};
        }
        if(bits.getBits(1)) {
            result.power_factor_instant = {"value": dataView.getUint8() / 100};
        }
        if(bits.getBits(1)) {
            result.mains_voltage = {"value": dataView.getUint8(), "unit": "V"};
        }
        if(bits.getBits(1)) {
            result.driver_operating_time = {"value": dataView.getUint32(), "unit": "s"};
        }
        if(bits.getBits(1)) {
            result.lamp_on_time = {"value": dataView.getUint32(), "unit": addr == 0xFF ? "h" : "s"};
        }
    }
    return result;
}

function usageParser(buffer, result, err) {
    var dataView = new BinaryExtract(buffer);
    err;

    result.packet_type = {value: "usage_packet"};

    result.reports = [];
    while(dataView.availableLen()) {
        result.reports.push(usageConsumptionParse(dataView, err));
    }
}


function deviceConfigParser(config, err) {
    switch(config) {
        case 0:
            return "dali";
        case 1:
            return "dali_nc";
        case 2:
            return "dali_no";
        case 3:
            return "analog_nc";
        case 4:
            return "analog_no";
        case 5:
            return "dali_analog_nc";
        case 6:
            return "dali_analog_no";
        case 7:
            return "dali_analog_nc_no";
        default:
            err.errors.push("invalid_device_config");
            return "invalid_config";
        }    
}

function optionalFeaturesParser(byte) {
    var res = [];
    var bits = new BitExtract(byte);
    bits.getBits(1);
    if(bits.getBits(1)) {
        res.push("thr");
    }
    if(bits.getBits(1)) {
        res.push("dig")
    }
    if(bits.getBits(1)) {
        res.push("ldr")
    }
    if(bits.getBits(1)) {
        res.push("open_drain_out")
    }
    if(bits.getBits(1)) {
        res.push("metering")
    }
    bits.getBits(1);
    if(bits.getBits(1)) {
        res.push("custom_request")
    }
    return res;
}

function daliInfoParse(data, err) {
    var supply = data;
    if(supply < 0x70) {
        return {"value": supply, "raw": supply, "unit": "V"};
    }
    switch(data) {
        case 0x7E:
            return {"value": "bus_high", "raw": supply};
        case 0x7f:
            err.warings.push("dali supply state: error")
            return {"value": "dali_error", "raw": supply};
        default:
            return {"value": "invalid_value", "raw": supply};
    }
}

function resetReasonParse(byte) {
    var res = [];
    var bits = new BitExtract(byte);
    if(bits.getBits(1)) {
        res.push("reset_0");
    }
    if(bits.getBits(1)) {
        res.push("watchdog_reset");
    }
    if(bits.getBits(1)) {
        res.push("soft_reset");
    }
    if(bits.getBits(1)) {
        res.push("reset_3");
    }
    if(bits.getBits(1)) {
        res.push("reset_4");
    }
    if(bits.getBits(1)) {
        res.push("reset_5");
    }
    if(bits.getBits(1)) {
        res.push("reset_6");
    }
    if(bits.getBits(1)) {
        res.push("reset_7");
    }
    return res;
}

function bootParser(dataView, result, err) {
    result.packet_type = {value: "boot_packet"};

    var hex = dataView.getUint32().toString(16).toUpperCase();
    result.device_serial = {"value": pad(hex, 8)}

    var maj = dataView.getUint8();
    var min = dataView.getUint8();
    var patch = dataView.getUint8();
    result.firmware_version = {"value": maj + "." + min + "." + patch, "raw": (maj << 16) | (min << 8) | patch };

    var epoch = dataView.getUint32();
    result.device_unix_epoch = decodeUnixEpoch(epoch);

    var config = dataView.getUint8();
    result.device_config = {"value": deviceConfigParser(config, err), "raw": config};

    var opt = dataView.getUint8();
    result.optional_features = {"value": optionalFeaturesParser(opt), "raw": opt};

    var daliBits = dataView.getUint8Bits();
    result.dali_supply_state = daliInfoParse(daliBits.getBits(7), err);
    var bus_power = daliBits.getBits(1);
    result.dali_power_source = {"value": bus_power ? "external": "internal", "raw": bus_power}

    var driver = dataView.getUint8Bits();
    result.dali_addressed_driver_count = {"value": driver.getBits(7)};
    var unadressed = driver.getBits(1);
    result.dali_unadressed_driver_found = bitFalseTrue(unadressed);
    
    if(dataView.availableLen()) {
        var resetReas = dataView.getUint8();
        result.reset_reason = {"value": resetReasonParse(resetReas), "raw": resetReas};
    }
}

function errorCodeParser(reason) {
    switch(reason) {
    case 0x00:
        return "n/a";
    case 0x01:
        return "n/a";
    case 0x02:
        return "unknown_fport";
    case 0x03:
        return "packet_size_short";
    case 0x04:
        return "packet_size_long";
    case 0x05:
        return "value_error";
    case 0x06:
        return "protocol_parse_error";
    case 0x07:
        return "reserved_flag_set";
    case 0x08:
        return "invalid_flag_combination";
    case 0x09:
        return "unavailable_feature_request";
    case 0x0A:
        return "unsupported_header";                                                                
    case 0x0B:
        return "unreachable_hw_request";
    case 0x0C:
        return "address_not_available";                                                                
    case 0x0D:
        return "internal_error";
    case 0x0E:
        return "packet_size_error";
    case 128:
        return "no_room";
    case 129:
        return "id_seq_error";
    case 130:
        return "destination_eror";
    case 131:
        return "days_error";
    case 132:
        return "step_count_error";
    case 133:
        return "step_value_error";
    case 134:
        return "step_unsorted";
    case 135:
        return "days_overlap";
    default:
        return "invalid_error_code";
    }
}

function configFailedParser(dataView, result, err) {
    result.packet_type = {value: "invalid_downlink_packet"};
    result.packet_from_fport = {"value": dataView.getUint8()};
    var errCode = dataView.getUint8();
    var error = errorCodeParser(errCode);
    result.parse_error_code = {"value": error, "raw": errCode};
    err.errors.push("Config failed: " + error);
}

function decodeFport99(buffer, result, err) {
    var dataView = new BinaryExtract(buffer);
    var header = dataView.getUint8();
    switch(header) {
        case 0x00:
            bootParser(dataView, result, err);
            return;
        case 0x13:
            configFailedParser(dataView, result, err);
            return;
        default:
            err.errors.push("invalid_header");
    }
}

function decodeFport61(buffer, result, err) {
    var dataView = new BinaryExtract(buffer);
    var header = dataView.getUint8();
    var raw_byte2 = dataView.getUint8();
    var len = raw_byte2 >> 4
    switch(header) {
        case 0x80:
            result.packet_type = {value: "dig_alert"};
            if(len != 2) {
                err.errors.push("invalid_packet_length")
                return;
            }
            var cnt = dataView.getUint16();
            result.dig_alert_counter = {"value": cnt};
            return;
        case 0x81:
            result.packet_type = {value: "ldr_alert"};
            if(len != 2) {
                err.errors.push("invalid_packet_length")
                return;
            }
            var state = dataView.getUint8Bits().getBits(1);
            var val = dataView.getUint8();
            result.ldr_state = bitFalseTrue(state);
            result.ldr_value = {"value": val};
            return;
        case 0x83:
            result.packet_type = {value: "dali_driver_alert"};
            result.drivers = [];
            while(dataView.availableLen()) {
                result.drivers.push(decodeDaliStatus(dataView, err));
            }
            return;
        case 0x84:
            result.packet_type = {value: "metering_alert"};            
            var cond = new BitExtract(raw_byte2);

            var lamp_error = cond.getBits(1);
            var over_current = cond.getBits(1);
            var under_voltage = cond.getBits(1);
            var over_voltage = cond.getBits(1);
            var low_power_factor = cond.getBits(1);

            result.lamp_error_alert = bitFalseTrue(lamp_error);
            result.over_current_alert = bitFalseTrue(over_current);
            result.under_voltage_alert = bitFalseTrue(under_voltage);
            result.over_voltage_alert = bitFalseTrue(over_voltage);
            result.low_power_factor_alert = bitFalseTrue(low_power_factor);

            var conditions = [];
            if(lamp_error) conditions.push("lamp_error");
            if(over_current) conditions.push("over_current");
            if(under_voltage) conditions.push("under_voltage");
            if(over_voltage) conditions.push("over_voltage");
            if(low_power_factor) conditions.push("low_power_factor");
            if(conditions.length) {
                err.warnings.push("Metering alerts: "+ conditions.join(", "));
            }

            var pw = dataView.getUint16();
            result.power = {"value": pw, "unit": "W"};

            var volt = dataView.getUint16();
            result.voltage = {"value": volt, "unit": "V"};

            var pf = dataView.getUint8() / 100;
            result.power_factor = {"value": pf};
            return;
        default:
            err.errors.push("invalid_header")
            return;
    }
}

function decodeUplinkByFport(fport, bytes, result, err, isUplink) {
    if(bytes.length == 0)
        err.errors.push("empty_payload");
    else if(fport == 24)
        statusParser(bytes, result, err);
    else if(fport == 25)
        usageParser(bytes, result, err);
    else if(fport == 50)
        decodeFport50(bytes, result, err);
    else if(fport == 60)
        decodeFport60(bytes, result, err, isUplink);
    else if(fport == 61)
        decodeFport61(bytes, result, err);
    else if(fport == 99)
        decodeFport99(bytes, result, err);
    else
        err.errors.push("invalid_fport");
}

export function decodeRawUplink(fport, bytes) {
    var isUplink = true;
    var res = {};
    var err = {errors: [], warnings: []};
    try {
        decodeUplinkByFport(fport, bytes, res, err, isUplink);
    } catch(error) {
        console.log(error.stack);
        err.errors.push(error.message);
    }
    return {data: res, errors: err.errors, warnings: err.warnings};
}
