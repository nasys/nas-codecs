import {BinaryExtract, BitExtract} from './util/extract.js';
import {pad, bytesToHexStr, bitFalseTrue} from './util/misc.js';

function profileOverrideReason(reason) {
    switch(reason) {
    case 246:
        return "driver_not_found";
    case 247:
        return "calendar_active";
    case 248:
        return "init_active";
    case 249:
        return "profile_not_active";
    case 250:
        return "ldr_active";
    case 251:
        return "thr_active";
    case 252:
        return "dig_active";
    case 253:
        return "manual_active";
    case 254:
        return "value_differ";
    case 255:
        return "unknown";
    default:
        return "none";
    }
}

export function daliAddressParse(addr, ff_str, err) {
    if(addr == 0xFE) {
        return {"value": "broadcast", "raw": addr};
    }
    if(addr == 0xFF) {
        if (ff_str) {
            return {"value": ff_str, "raw": addr};
        }
        err.errors.push("invalid_dali_address");
        return {"value": "invalid", "raw": addr};
    }
    if(addr & 0x01) {
        err.errors.push("invalid_dali_address");
        return {"value": "invalid", "raw": addr};
    }
    if(addr & 0x80) {
        return {"value": "group "+((addr >> 1) & 0xF).toString(), "raw": addr};
    }
    else {
        return {"value": "single "+((addr >> 1) & 0x3F).toString(), "raw": addr};
    }
}

export function profileParserPartial(dataView, profile, err) {
    var id = dataView.getUint8();
    var ver = dataView.getUint8();
    var addr = dataView.getUint8();
    var active_days = dataView.getUint8();

    profile.profile_id = {"value": id == 255 ? "no_profile" : id, "raw": id};

    profile.profile_version = {"value": ver > 240 ? "n/a" : ver, "raw": ver}

    profile.profile_override = {"value": profileOverrideReason(ver), "raw": ver};

    profile.dali_address_short = daliAddressParse(addr, null, err);

    {
        var bits = new BitExtract(active_days);
        var days = [];
        if(bits.getBits(1)) {
            days.push("holiday");
        }
        if(bits.getBits(1)) {
            days.push("mon");
        }
        if(bits.getBits(1)) {
            days.push("tue");
        }
        if(bits.getBits(1)) {
            days.push("wed");
        }
        if(bits.getBits(1)) {
            days.push("thu");
        }
        if(bits.getBits(1)) {
            days.push("fri");
        }
        if(bits.getBits(1)) {
            days.push("sat");
        }
        if(bits.getBits(1)) {
            days.push("sun");
        }
        profile.days_active = {"value": days, "raw": active_days};
    }
}

export function decodeUnixEpoch(epoch) {
    var date = new Date(epoch * 1000);
    var epoch_formatted = date.toISOString();
    if (epoch < 946684800) { // before 2000-01-01
        epoch_formatted = "invalid_timestamp";
    }
    else if (epoch < 1420070400) { // between 2000-01-01 and 2015-01-01
        // ISO Period format. E.g. "P0003-06-04T12:30:05"
        epoch_formatted = "P"+pad(date.getUTCFullYear()-2000, 4)+"-"+pad(date.getUTCMonth(), 2)+"-"+pad(date.getUTCDate()-1, 2)+"T"+pad(date.getUTCHours(), 2)+":"+pad(date.getUTCMinutes(),2)+":"+pad(date.getUTCSeconds(), 2);
    }
    return {"value": epoch_formatted, "raw": epoch};
}

export function decodeLdrConfig(dataView, result) {
    result.packet_type = {value: "ldr_config_packet"};

    var high = dataView.getUint8();
    result.switch_threshold_high = {"value": high == 0xFF ? "disabled" : high, "raw": high};

    var low = dataView.getUint8();
    result.switch_threshold_low = {"value": low == 0xFF ? "disabled" : low, "raw": low};

    var behavior_bits = dataView.getUint8Bits();
    behavior_bits.getBits(2);
    result.switch_trigger_alert_enabled = bitFalseTrue(behavior_bits.getBits(1));
}

export function decodeDigConfig(dataView, result, err) {
    result.packet_type = {value: "dig_config_packet"};

    var time = dataView.getUint16();
    result.switch_time = {"value": time == 0xFFFF ? "disabled" : time, "raw": time, "unit": "s"};

    var behavior_bits = dataView.getUint8Bits();
    behavior_bits.getBits(1);
    var edge = behavior_bits.getBits(1);
    result.switch_transition = {"value": edge ? "enabled": "disabled", "raw": edge};
    result.switch_trigger_alert_enabled = bitFalseTrue(behavior_bits.getBits(1));

    var addr = dataView.getUint8();
    result.dali_address_short = daliAddressParse(addr, null, err);

    var level = dataView.getUint8();
    result.dimming_level = {"value": level, "unit": "%"};
}

export function decodeStepTime(inByte, result) {
    var min_total = inByte * 10;
    var hour = Math.trunc(min_total / 60);
    var mn = min_total - hour * 60;
    result.step_time = {"value": pad(hour, 2) + ":" + pad(mn, 2), "raw": min_total};
}

export function decodeOdRelaySwStep(dataView) {
    var res = {};

    decodeStepTime(dataView.getUint8(), res);

    var state = dataView.getUint8() != 0;
    res.open_drain_out_state = bitFalseTrue(state);
    return res;
}

export function decodeCalendarConfig(dataView, result) {
    result.packet_type = {value: "calendar_config_packet"};

    var sunrise = dataView.getInt8();
    var sunset = dataView.getInt8();
    var lat = dataView.getInt16() / 100;
    var lon = dataView.getInt16() / 100;
    
    var clear = sunrise == -1 && sunset == -1;

    result.sunrise_offset = {"value": clear ? "disabled" : sunrise, "unit": "min", "raw": sunrise}
    result.sunset_offset = {"value": clear ? "disabled" : sunset, "unit": "min", "raw": sunset}

    result.latitude = {"value": lat, "unit": "°"};
    result.longitude = {"value": lon, "unit": "°"};
}

export function decodeStatusConfig(dataView, result) {
    result.packet_type = {value: "status_config_packet"};
    var interval = dataView.getUint32();
    result.staus_interval = {"value": interval, "unit": "s"};
}

export function decodeDimmingStep(dataView) {
    var time = dataView.getUint8();
    var lvl = dataView.getUint8();
    var res = {};
    decodeStepTime(time, res);

    res.dimming_level = {"value": lvl, "unit": "%"};
    return res;
}

export function decodeProfileConfig(dataView, result, err) {
    result.packet_type = {value: "profile_config_packet"};
    profileParserPartial(dataView, result, err);
    result.dimming_steps = [];
    while(dataView.availableLen()) {
        result.dimming_steps.push(decodeDimmingStep(dataView));
    }
}

export function decodeTimeConfig(dataView, result) {
    result.packet_type = {value: "time_config_packet"};

    var epoch = dataView.getUint32();
    result.device_unix_epoch = decodeUnixEpoch(epoch);
}

export function decodeLegacyDefaultsConfig(dataView, result) {
    result.packet_type = {value: "legacy_defaults_config_packet"};

    var dim = dataView.getUint8();
    result.default_dim = {"value": dim, "unit": "%"};
    
    var alerts = dataView.getUint8Bits();
    result.ldr_alert_enabled = bitFalseTrue(alerts.getBits(1))
    alerts.getBits(1);
    result.dig_alert_enabled = bitFalseTrue(alerts.getBits(1))
    result.dali_alert_enabled = bitFalseTrue(alerts.getBits(1))
}

export function decodeUsageConfig(dataView, result) {
    result.packet_type = {value: "usage_config_packet"};
    var interval = dataView.getUint32();
    var volt = dataView.getUint8();
    result.usage_interval = {"value": interval, "unit": "s"};
    result.mains_voltage = {"value": volt, "unit": "V"};
}

export function decodeHolidayConfig(dataView, result) {
    result.packet_type = {value: "holiday_config_packet"};
    result.holidays = [];
    while(dataView.availableLen()) {
        var month = dataView.getUint8();
        var day = dataView.getUint8();
        result.holidays.push({"value": pad(month, 2) + "-" + pad(day, 2), "raw": month << 8 | day});
    }
}

export function decodeBootDelayConfig(dataView, result) {
    result.packet_type = {value: "boot_delay_config_packet"};
    var legacy = dataView.availableLen() == 1;
    var range = legacy ? dataView.getUint8() : dataView.getUint16();
    result.boot_delay_range = {"value": range, "unit": "s"};
}

export function decodeFade(fade) {
    var lookup = [0.5, 0.71, 1.0, 1.41, 2.0, 2.83, 4.0, 5.66, 8.0, 11.31, 16.0, 22.63, 32.0, 45.25, 64.0, 90.51]
    var val = fade > 16 ? "invalid_fade" : lookup[fade];
    if (fade == 255) val = "ignore";
    return {"value": val, "unit": "s", "raw": fade};
}

export function decodeDefaultsConfig(dataView, result) {
    result.packet_type = {value: "defaults_config_packet"};
    var bits = dataView.getUint8Bits();
    var dim = bits.getBits(1);
    var max_dim = bits.getBits(1);
    var fade = bits.getBits(1);
    var sunset_mode = bits.getBits(1);
    var legacy_mode = bits.getBits(1);
    if(dim) {
        var d = dataView.getUint8();
        result.default_dim = {"value": d, "unit": "%"};
    }
    if(max_dim) {
        var md = dataView.getUint8();
        result.max_dim = {"value": md == 0xff ? "default" : md, "unit": "%", "raw": md};
    }
    if(fade) {
        var f = dataView.getUint8();
        result.fade_duration = decodeFade(f);
    }
    if(sunset_mode) {
        var s = dataView.getUint8Bits().getBits(1);
        result.switch_point_sunset = {"value": s ? "sunset" : "twilight", raw: s};
    }
    if(legacy_mode) {
        var l = dataView.getUint8Bits().getBits(1);
        result.legacy_mode_enabled = bitFalseTrue(l);
    }
}

export function decodeLocationConfig(dataView, result) {
    result.packet_type = {value: "location_config_packet"};

    var bits1 = dataView.getUint8Bits();
    var position_sent = bits1.getBits(1);
    var address_sent = bits1.getBits(1);

    if(position_sent) {
        result.position_latitude = {"value": dataView.getInt32() / 10000000.0, "unit": "°"};
        result.position_longitude = {"value": dataView.getInt32() / 10000000.0, "unit": "°"};
    }
    if(address_sent) {
        var address_len = dataView.getUint8();
        result.address = {"value": dataView.getTextUtf8(address_len)};
    }
}

export function decodeLedConfig(dataView, result) {
    result.packet_type = {value: "led_config_packet"};
    var l = dataView.getUint8Bits().getBits(1);
    result.status_led_enabled = bitFalseTrue(l);
}

export function alertParamConfig(value, na_value, unit) {
    var val = value == na_value ? "alert_off" : value;
    var res = {"value": val, "raw": value};
    if (unit) res["unit"] = value == na_value ? "" : unit;
    return res;
}

export function decodeMeteringAlertConfig(dataView, result, err) {
    result.packet_type = {value: "metering_alert_config_packet"};
    var header = dataView.getUint8();
    if(header != 0x01) {
        err.errors.push("invalid_header");
        return;
    }
    var min_power = dataView.getUint16();
    var max_power = dataView.getUint16();
    var min_voltage = dataView.getUint16();
    var max_voltage = dataView.getUint16();
    var min_pf = dataView.getUint8();

    result.min_power = alertParamConfig(min_power, 0xFFFF, "W");
    result.max_power = alertParamConfig(max_power, 0xFFFF, "W");
    result.min_voltage = alertParamConfig(min_voltage, 0xFFFF, "V");
    result.max_voltage = alertParamConfig(max_voltage, 0xFFFF, "V");
    result.min_power_factor = {"value": min_pf == 0xFF ? "alert_off" : min_pf / 100.0, "raw": min_pf};
}

export function decodeMulticastConfig(dataView, result, err) {
    result.packet_type = {value: "multicast_config_packet"};
    var dev = dataView.getUint8();
    if(dev == 0 || dev > 4) {
        err.errors.push("invalid_multicast_device");
        return;
    }
    result.multicast_device = {"value": dev};
    var devaddr = dataView.getRaw(4).reverse();
    result.device_address = {"value": bytesToHexStr(devaddr)};

    var nwkskey = dataView.getRaw(16);
    result.network_security_key = {"value": bytesToHexStr(nwkskey)};

    var appskey = dataView.getRaw(16);
    result.application_security_key = {"value": bytesToHexStr(appskey)};
}

export function decodeClearConfig(dataView, result, err) {
    result.packet_type = {value: "clear_config_packet"};
    var typ = dataView.getUint8();
    switch(typ) {
        case 0x01:
            result.reset_target = "ldr_config";
            return;
        case 0x03:
            result.reset_target = "dig_config";
            return;
        case 0x04:
            result.reset_target = "profile_config";
            var addr = dataView.getUint8();
            result.dali_address_short = daliAddressParse(addr, "all_profiles", err);
            if (dataView.availableLen()) {
                var id = dataView.getUint8();
                result.profile_id = {"value": id == 0xFF ? "all_used_profiles" : id, "raw": id};
            }
            return;
        case 0x06:
            result.reset_target = "holiday_config";
            return;
        case 0x52:
            result.reset_target = "multicast_config";
            var device = dataView.getUint8();
            result.multicast_device = {"value": device == 0xff ? "all_multicast_devices" : device, "raw": device};
            return;
        case 0xFF:
            result.reset_target = "factory_reset";
            var ser = dataView.getRaw(4);
            result.device_serial = {"value": bytesToHexStr(ser)}
    }
}

export function decodeFport50(buffer, result, err) {
    var dataView = new BinaryExtract(buffer);
    var header = dataView.getUint8();
    switch(header) {
        case 0x01:
            decodeLdrConfig(dataView, result);
            return;
        case 0x03:
            decodeDigConfig(dataView, result, err);
            return;
        case 0x05:
            result.packet_type = {value: "open_drain_out_config_packet"};
            result.switching_steps = [];
            while(dataView.availableLen()) {
                result.switching_steps.push(decodeOdRelaySwStep(dataView));
            }
            return;
        case 0x06:
            decodeCalendarConfig(dataView, result);
            return;
        case 0x07:
            decodeStatusConfig(dataView, result);
            return;
        case 0x08:
            decodeProfileConfig(dataView, result, err);
            return;
        case 0x09:
            decodeTimeConfig(dataView, result);
            return;
        case 0x0A:
            decodeLegacyDefaultsConfig(dataView, result);
            return;
        case 0x0B:
            decodeUsageConfig(dataView, result);
            return;
        case 0x0C:
            decodeHolidayConfig(dataView, result);
            return;
        case 0x0D:
            decodeBootDelayConfig(dataView, result);
            return;
        case 0x0E:
            decodeDefaultsConfig(dataView, result);
            return;
        case 0x13:
            decodeLocationConfig(dataView, result);
            return;
        case 0x15:
            decodeLedConfig(dataView, result);
            return;
        case 0x16:
            decodeMeteringAlertConfig(dataView, result, err);
            return;
        case 0x52:
            decodeMulticastConfig(dataView, result, err);
            return;
        case 0xFF:
            decodeClearConfig(dataView, result, err);
            return;
        default:
            err.errors.push("invalid_header");
    }
}

export function decodeDaliStatus(dataView, err) {
    var result = {};
    var addr = dataView.getUint8();
    result.dali_address_short = daliAddressParse(addr, null, err);

    var stat = dataView.getUint8Bits();
    var control_gear_failure = stat.getBits(1);
    result.control_gear_failure = bitFalseTrue(control_gear_failure);
    var lamp_failure = stat.getBits(1);
    result.lamp_failure = bitFalseTrue(lamp_failure);
    result.lamp_on = bitFalseTrue(stat.getBits(1));
    var limit_error = stat.getBits(1);
    result.limit_error = bitFalseTrue(limit_error);
    result.fade_running = bitFalseTrue(stat.getBits(1));
    result.reset_state = bitFalseTrue(stat.getBits(1));
    result.short_address = bitFalseTrue(stat.getBits(1));
    result.power_cycle_seen = bitFalseTrue(stat.getBits(1));

    var alerts = [];
    if(control_gear_failure) alerts.push("control gear failure");
    if(lamp_failure) alerts.push("lamp failure");
    if(limit_error) alerts.push("limit error");
    if(alerts.length) {
        err.errors.push("Dali address: "+result.dali_address_short.value+" errors: "+alerts.join(", "))
    }
    return result;
}

function decodeDaliStatusReq(dataView, result, err, isUplink) {
    result.packet_type = {value: "dali_status_request"};
    if(isUplink) {
        result.dali_statuses = [];
        while(dataView.availableLen()) {
            result.dali_statuses.push(decodeDaliStatus(dataView, err));
        }        
    }
    else {
        var addr = dataView.getUint8();
        if(addr == 0xFE) {
            result.dali_address_short = {"value": "all_drivers", "raw": addr};
        }
        else {
            result.dali_address_short = daliAddressParse(addr, null, err);
        }    
    }
}

export function decodeDimming(dataView, err) {
    var result = {};
    var addr = dataView.getUint8();
    result.dali_address_short = daliAddressParse(addr, null, err);

    var level = dataView.getUint8();
    result.dimming_level = {"value": level == 0xFF ? "resume" : level, "unit": "%", "raw": level};
    return result;
}

export function decodeDimmingCommand(dataView, result, err) {
    result.packet_type = {value: "manual_dimming_command"};
    result.manual_commands = [];
    while(dataView.availableLen()) {
        result.manual_commands.push(decodeDimming(dataView, err));
    }
}

export function decodeCustomDali(dataView, err, isUplink) {
    var result = {};
    var addr = dataView.getUint8();
    result.dali_address_short = daliAddressParse(addr, null, err);

    var query = dataView.getUint8();
    result.dali_query = {"value": query};

    if(isUplink) {
        var ans = dataView.getUint8();
        result.dali_answer = {"value": ans};    
    }
    return result;
}

export function decodeCustomDaliReq(dataView, result, err, isUplink) {
    result.packet_type = {value: "custom_dali_request"};
    result.queries = [];
    while(dataView.availableLen()) {
        result.queries.push(decodeCustomDali(dataView, err, isUplink));
    }
}

export function decodeCustomDaliCommand(dataView, result) {
    result.packet_type = {value: "custom_dali_command"};

    var data = dataView.getRaw(dataView.availableLen());
    result.dali_command = {"value": bytesToHexStr(data)};
}

export function decodeStatusRequest(dataView, result) {
    result.packet_type = {value: "status_or_usage_request"};

    var bits = dataView.getUint8Bits();
    result.usage_requested = bitFalseTrue(bits.getBits(1));
    result.status_requested = bitFalseTrue(bits.getBits(1));
}

function decodeDigVal(val) {
    if(val == 0x00) return "off";
    if(val == 0x01) return "on";
    if(val == 0xFF) return "n/a";
    return "invalid_value";
}

export function decodeInterfacesRequest(dataView, result, err, isUplink) {
    if(dataView.availableLen() == 1) {
        result.packet_type = {value: "interface_request"};
        return;
    }
    err;
    if(isUplink) {
        result.packet_type = {value: "interface_request"};
        var dig = dataView.getUint8();
        var dig_val = dataView.getUint8();
        var ldr = dataView.getUint8();
        var ldr_val = dataView.getUint8();
        var thr = dataView.getUint8();
        dataView.getUint8();
        var relay = dataView.getUint8();
        var relay_bits = dataView.getUint8Bits();
        if(dig != 0x01 || ldr != 0x02 || thr != 0x03 || relay != 0x04) {
            err.errors.push("invalid_interface");
            return;
        }
        
        result.dig = {"value": decodeDigVal(dig_val), "raw": dig_val};
        result.ldr = {"value": ldr_val == 0xFF ? "n/a" : ldr_val, "raw": ldr_val};
        // thr deprecated
        result.main_relay_state = bitFalseTrue(relay_bits.getBits(1));
        result.open_drain_out_state = bitFalseTrue(relay_bits.getBits(1));    
    }
}

export function decodeDriverMemory(dataView, result, err) {
    var addr = dataView.getUint8();
    result.dali_address_short = daliAddressParse(addr, null, err);
    
    var bank = dataView.getUint8();
    result.memory_bank = {"value": bank};

    var mem_addr = dataView.getUint8();
    result.memory_address = {"value": mem_addr};

    var size = dataView.getUint8();
    result.read_size = {"value": size, "unit": "bytes"};
    return size;
}

export function decodeReadDriverMemory(dataView, result, err, isUplink) {
    result.packet_type = {value: "driver_memory_read"};
    if(isUplink && dataView.availableLen() == 0) {
        err.errors.push("driver_memory_read_failed");
        return;
    }

    var size = decodeDriverMemory(dataView, result, err);

    if(dataView.availableLen()) {
        var data = dataView.getRaw(size);
        result.memory_value = {"value": bytesToHexStr(data)}
    }
}

export function decodeWriteDriverMemory(dataView, result, err, isUplink) {
    result.packet_type = {value: "driver_memory_write"};
    if(isUplink && dataView.availableLen() == 0) {
        err.errors.push("driver_memory_write_failed");
        return;
    }
    var size = decodeDriverMemory(dataView, result);
    var data = dataView.getRaw(size);
    result.memory_value = {"value": bytesToHexStr(data)}
}

export function decodeTimedDimming(dataView, err) {
    var result = {};
    var addr = dataView.getUint8();
    result.dali_address_short = daliAddressParse(addr, null, err);

    var lvl = dataView.getUint8();
    result.dimming_level = {"value": lvl, "unit": "%"};

    var dur = dataView.getUint8();
    result.duration = {"value": dur, "unit": "min"};
    return result    
}

export function decodeTimedDimmingCommand(dataView, result, err) {
    result.packet_type = {value: "timed_dimming_command"};
    result.timed_commands = [];
    while(dataView.availableLen()) {
        result.timed_commands.push(decodeTimedDimming(dataView, err));
    }
}

export function decodeOpenDrainSwitching(dataView, result) {
    result.packet_type = {value: "open_drain_out_control"};
    var sw = dataView.getUint8Bits().getBits(1);
    result.open_drain_out_state = bitFalseTrue(sw);
}



export function decodeFport60(buffer, result, err, isUplink) {
    var dataView = new BinaryExtract(buffer);
    var header = dataView.getUint8();
    switch(header) {
        case 0x00:
            decodeDaliStatusReq(dataView, result, err, isUplink);
            return;
        case 0x01:
            decodeDimmingCommand(dataView, result, err);
            return;
        case 0x03:
            decodeCustomDaliReq(dataView, result, err, isUplink);
            return;
        case 0x04:
            decodeCustomDaliCommand(dataView, result);
            return;
        case 0x05:
            decodeStatusRequest(dataView, result);
            return;
        case 0x06:
            decodeInterfacesRequest(dataView, result, err, isUplink);
            return;
        case 0x07:
            decodeReadDriverMemory(dataView, result, err, isUplink);
            return;
        case 0x08:
            decodeWriteDriverMemory(dataView, result, err, isUplink);
            return;
        case 0x09:
            decodeTimedDimmingCommand(dataView, result, err);
            return;
        case 0x0C:
            decodeOpenDrainSwitching(dataView, result);
            return;
        default:
            err.errors.push("invalid_command");
        }
}
