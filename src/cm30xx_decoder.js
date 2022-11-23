import {BinaryExtract} from './util/extract.js';
import {pad, bytesToHexStr} from './util/misc.js';


// FORMATTER AND CONVERTER FUNCTIONS
function meterStatusFormat(status) {
    switch (status) {
        case 0:
            return "connected";
        case 1:
            return "no_response";
        case 2:
            return "protocol_error";
        case 3:
            return "meter_damaged";
        case 4:
            return "protocol_error";
        case 5:
            return "bus_shorted";
        default:
            return "invalid_status";
    }
}

export function meterMultiplierConvert(exp) {
    if (exp < 3 || exp > 7)
        return -1;
    return Math.pow(10, exp - 6);
}

function meterMediumFormat(medium) {
    switch (medium) {
        case 0:
            return "water";
        case 1:
            return "warm_water";
        case 2:
            return "gas";
        default:
            return "invalid_medium";
    }
}

function meterUnitFormat(unit) {
    switch (unit) {
        case 0:
            return "m3";
        case 1:
            return "gal";
        case 2:
            return "ft3";
        default:
            return "invalid_unit";
    }
}

function serialFormat(serial) {
    if (serial == 0xFFFFFFFF)
        return "not_available";
    var hex = serial.toString(16).toUpperCase();
    return pad(hex, 8);
}

function actualityDurationToMinutesFormat(actuality_raw) {
    if (actuality_raw < 60)
        return actuality_raw;
    if (actuality_raw < 156)
        return (actuality_raw - 60) * 15;
    if (actuality_raw < 200)
        return (actuality_raw - 156) * 24 * 60;
    if (actuality_raw < 253)
        return (actuality_raw - 200) * 7 * 24 * 60;
    if (actuality_raw == 253)
        return 365 * 24 * 60;
    return null;
}

function actualityDurationToFormatStr(actuality_raw) {
    var minutes = actualityDurationToMinutesFormat(actuality_raw);
    if (actuality_raw < 60)
        return minutes + " minutes";
    if (actuality_raw < 156)
        return (minutes / 60).toFixed(2) + " hours";
    if (actuality_raw < 200)
        return (minutes / (60 * 24)).toFixed(2) + " days";
    if (actuality_raw < 253)
        return (minutes / (60 * 24 * 7)).toFixed(2) + " weeks";
    if (actuality_raw == 253)
        return (minutes / (60 * 24 * 365)).toFixed(2) + " years";
    return null;
}

function multiplierToExponent(multiplier) { // replacing Math.log10(multiplier)
    switch (multiplier) {
        case 0.001:
            return -3;
        case 0.01:
            return -2;
        case 0.1:
            return -1;
        case 1.0:
            return 0;
        case 10.0:
            return 1;
        default:
            throw Error("invalid_multiplier");
    }
}

export function volumeFormatUnit(volume, multiplier) {
    var decimal_places = multiplierToExponent(multiplier);
    //    var vol_scaled = volume / (decimal_places < 0 ? 1000 : multiplier);
    var vol_scaled = decimal_places > 0 ? volume : volume / multiplier;
    var padded_str = pad(vol_scaled.toFixed(0), decimal_places > 0 ? 8 + decimal_places : 8);
    if (decimal_places < 0)
        padded_str = padded_str.substring(0, 8 + decimal_places) + "." + padded_str.substring(8 + decimal_places);
    return padded_str;
}

function activeAlertsFormat(alerts_obj) {
    var res = [];
    for (var key in alerts_obj) {
        if (alerts_obj.hasOwnProperty(key)) {
            if (alerts_obj[key] && (key != "any_alert_active_now")) {
                res.push(key);
            }
        }
    }
    return res;
}

function lorawanProfileFormat(profile) {
    switch (profile) {
        case 0x00:
            return "lorawan_disabled";
        case 0x01:
            return "lorawan_24_h_privacy";
        case 0x02:
            return "lorawan_24_h";
        case 0x03:
            return "lorawan_12_h";
        case 0x07:
            return "lorawan_1_h_static";
        case 0x08:
            return "lorawan_15_min_static";
        case 0x17:
            return "lorawan_1_h_dynamic";
        case 0x18:
            return "lorawan_15_min_dynamic";
        default:
            return "invalid_lorawan_profile";
    }
}

function wmbusProfileFormat(profile) {
    switch (profile) {
        case 0x00:
            return "wmbus_disabled";
        case 0x01:
            return "wmbus_privacy";
        case 0x02:
            return "wmbus_driveby";
        case 0x03:
            return "wmbus_fixnet";
        default:
            return "invalid_wmbus_profile";
    }
}

function packetErrorReasonFormatter(reason) {
    switch (reason) {
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
        default:
            return "invalid_error_code";
    }
}

function hardwareConfigFormat(hw) {
    switch (hw) {
        case 0x00:
            return "Modularis";
        case 0x01:
            return "Cyble";
        case 0x02:
            return "Falcon_PR";
        case 0x03:
            return "Picoflux";
        case 0x04:
            return "Falcon_MJ";
        case 0x06:
            return "RCM_LMx";
        case 0x20:
            return "BK_G";
        default:
            return "invalid_hardware_config";
    }
}

function shutdownEeasonFormat(reason) {
    switch (reason) {
        case 0x10:
            return "calibration_timeout";
        case 0x31:
            return "magnet_shutdown";
        case 0x32:
            return "enter_dfu";
        case 0x33:
            return "app_shutdown";
        case 0x34:
            return "switch_to_wmbus";
        default:
            return "invalid_shutdown_reason";
    }
}

function bootPacketReason(reason) {
    switch (reason) {
        case 0:
            return "unknown_reset";
        case 1:
            return "from_shutdown";
        case 2:
            return "from_dfu";
        case 3:
            return "froced_reset";
        case 3:
            return "lorawan_rejoin";
        default:
            return "invalid_packet_reason";
    }
}

function wakeupReasonFormat(reasons_obj) {
    var res = [];
    for (var key in reasons_obj) {
        if (reasons_obj.hasOwnProperty(key) && reasons_obj[key]) {
            res.push(key);
        }
    }
    return res;
}

// USAGE PAYLOAD
function usageParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if (packet_type == 0x04)
        result._packet_type = "usage_packet";
    else {
        result._error = ["invalid_packet_type " + packet_type];
        return;
    }

    var active_alerts = {};
    var bits1 = dataView.getUint8Bits();
    active_alerts.backflow_pending = bits1.getBits(1);
    active_alerts.broken_pipe_pending = bits1.getBits(1);
    active_alerts.continuous_flow_pending = bits1.getBits(1);
    active_alerts.tamper_pending = bits1.getBits(1);
    active_alerts.temperature_pending = bits1.getBits(1);
    active_alerts.low_battery = bits1.getBits(1);
    active_alerts.no_usage = bits1.getBits(1);
    active_alerts.any_alert_active_now = bits1.getBits(1);
    result.active_alerts = activeAlertsFormat(active_alerts);

    result.meter_status = meterStatusFormat(dataView.getUint8());

    var bits2 = dataView.getUint8Bits();
    result._meter_multiplier = meterMultiplierConvert(bits2.getBits(3));
    if (result._meter_multiplier < 0) {
        result._error = ["invalid_multiplier"];
        return;
    }
    result._meter_medium = meterMediumFormat(bits2.getBits(2));
    result._meter_unit = meterUnitFormat(bits2.getBits(2));
    var privacy_mode_active = bits2.getBits(1);

    var actuality = dataView.getUint8();
    result.meter_actuality_duration__minutes = actualityDurationToMinutesFormat(actuality);
    result.meter_actuality_duration_formatted = actualityDurationToFormatStr(actuality);

    result['meter_accumulated_volume__' + result._meter_unit] = volumeFormatUnit(result._meter_multiplier * dataView.getUint32(), result._meter_multiplier);

    if (privacy_mode_active) {
        var bits3 = dataView.getUint8Bits();
        var day = bits3.getBits(5);
        var year_lower = bits3.getBits(3);
        var bits4 = dataView.getUint8Bits();
        var month = bits4.getBits(4);
        var year_upper = bits4.getBits(4);
        var year = 2000 + year_lower + 8 * year_upper;
        var date = new Date();
        date.setUTCFullYear(year);
        date.setUTCMonth(month);
        date.setUTCDate(day);
        result.meter_readout_date = date.toISOString().split(/[T ]/i, 1)[0];
    }

    var bits5 = dataView.getUint8Bits();
    result._app_connected_within_a_day = bits5.getBits(1);
    var device_status_sent = bits5.getBits(1);

    if (device_status_sent) {
        result.battery_remaining__years = parseFloat((dataView.getUint8() / 12.0).toFixed(1));
        result._battery_voltage__V = dataView.getUint8() / 100.0 + 1.5;

        result.internal_temperature__C = dataView.getInt8();
        var bits6 = dataView.getUint8Bits();
        result._internal_temperature_min__C = bits6.getBits(4) * -2 + result.internal_temperature__C;
        result._internal_temperature_max__C = bits6.getBits(4) * 2 + result.internal_temperature__C;

        result.radio_downlink_rssi__dBm = -1 * dataView.getUint8();
        var bits7 = dataView.getUint8Bits();
        result._radio_downlink_snr__dB = bits7.getBits(4) * 2 - 20;
        result._radio_uplink_power__dBm = bits7.getBits(4) * 2;

        result.meter_serial = serialFormat(dataView.getUint32());
    }
}

// CONFIGURATION PAYLOADS
function generalConfigurationParser(dataView, result) {
    result._packet_type = "general_configuration_packet";

    var configured_parameters = {};
    var bits1 = dataView.getUint8Bits();
    configured_parameters.radio_lorawan_profile_sent = bits1.getBits(1);
    configured_parameters.radio_wmbus_profile_sent = bits1.getBits(1);
    configured_parameters.meter_serial_sent = bits1.getBits(1);
    configured_parameters.meter_multiplier_sent = bits1.getBits(1);
    configured_parameters.meter_volume_sent = bits1.getBits(1);
    configured_parameters.meter_volume_offset_sent = bits1.getBits(1);
    configured_parameters.meter_nominal_flow_sent = bits1.getBits(1);
    configured_parameters.alert_backflow_sent = bits1.getBits(1);
    var bits2 = dataView.getUint8Bits();
    configured_parameters.alert_broken_pipe_sent = bits2.getBits(1);
    configured_parameters.alert_continuous_flow_sent = bits2.getBits(1);
    configured_parameters.alert_no_usage_sent = bits2.getBits(1);
    configured_parameters.alert_tamper_sent = bits2.getBits(1);
    configured_parameters.alert_temperature_sent = bits2.getBits(1);

    if (configured_parameters.radio_lorawan_profile_sent)
        result.radio_lorawan_profile = lorawanProfileFormat(dataView.getUint8());
    if (configured_parameters.radio_wmbus_profile_sent)
        result.radio_wmbus_profile = wmbusProfileFormat(dataView.getUint8());
    if (configured_parameters.meter_serial_sent)
        result.meter_serial = serialFormat(dataView.getUint32());
    result.meter_unit = "";
    if (configured_parameters.meter_multiplier_sent) {
        var bits2 = dataView.getUint8Bits();
        result.meter_multiplier = meterMultiplierConvert(bits2.getBits(3));
        result.meter_medium = meterMediumFormat(bits2.getBits(2));
        result.meter_unit = meterUnitFormat(bits2.getBits(2));
        result.privacy_mode_active = bits2.getBits(1);
    }
    var unit_post = result.meter_unit != "" ? "__" + result.meter_unit : "";
    if (configured_parameters.meter_volume_sent)
        result['meter_accumulated_volume' + unit_post] = dataView.getUint64() / 1000.0;
    if (configured_parameters.meter_volume_offset_sent)
        result['meter_accumulated_volume_offset' + unit_post] = dataView.getInt32() / 1000.0;
    if (configured_parameters.meter_nominal_flow_sent)
        result['meter_nominal_flow' + unit_post] = dataView.getUint16() / 10.0;
    if (configured_parameters.alert_backflow_sent) {
        var val = dataView.getUint16();
        result['alert_backflow_threshold' + unit_post] = val == 0 ? "disabled" : val / 1000.0;
    }
    if (configured_parameters.alert_broken_pipe_sent) {
        var val = dataView.getUint32();
        result['alert_broken_pipe_threshold' + unit_post] = val == 0 ? "disabled" : val / 1000.0;
    }
    if (configured_parameters.alert_continuous_flow_sent)
        result.alert_continuous_flow_enabled = Boolean(dataView.getUint8());
    if (configured_parameters.alert_no_usage_sent) {
        var val = dataView.getUint16();
        result.alert_no_usage_interval__days = val == 0 ? "disabled" : val;
    }
    if (configured_parameters.alert_tamper_sent)
        result.alert_tamper_enabled = Boolean(dataView.getUint8());
    if (configured_parameters.alert_temperature_sent) {
        var low = dataView.getInt8();
        result.alert_temperature_threshold_low__C = low == -128 ? "disabled" : low;
        var high = dataView.getInt8();
        result.alert_temperature_threshold_high__C = high == -128 ? "disabled" : high;
    }
}

function locationConfigurationParser(dataView, result) {
    result._packet_type = "location_configuration_packet";

    var configured_parameters = {};
    var bits1 = dataView.getUint8Bits();
    configured_parameters.gps_position_sent = bits1.getBits(1);
    configured_parameters.time_zone_sent = bits1.getBits(1);
    configured_parameters.address_sent = bits1.getBits(1);
    configured_parameters.id_customer_sent = bits1.getBits(1);
    configured_parameters.id_location_sent = bits1.getBits(1);

    if (configured_parameters.gps_position_sent) {
        result.gps_position_latitude__deg = dataView.getInt32() / 10000000.0;
        result.gps_position_longitude__deg = dataView.getInt32() / 10000000.0;
    }
    if (configured_parameters.time_zone_sent) {
        result.time_zone__h = dataView.getInt8() / 4.0;
    }
    if (configured_parameters.address_sent) {
        var address_len = dataView.getUint8();
        result.address = dataView.getTextUtf8(address_len);
    }
    if (configured_parameters.id_customer_sent) {
        var id_customer_len = dataView.getUint8();
        result.id_customer = dataView.getTextUtf8(id_customer_len);
    }
    if (configured_parameters.id_location_sent) {
        var id_location_len = dataView.getUint8();
        result.id_location = dataView.getTextUtf8(id_location_len);
    }
}

function configurationParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if (packet_type == 0x20)
        generalConfigurationParser(dataView, result);
    else if (packet_type == 0x21)
        locationConfigurationParser(dataView, result);
    else {
        result._error = ["invalid_configuration_type " + packet_type];
    }
}

// CONFIGURATION REQUESTS AND COMMANDS
function configurationRequestsParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if (packet_type == 0x20)
        result._packet_type = "general_configuration_request";
    else if (packet_type == 0x21)
        result._packet_type = "location_configuration_request";
    else {
        result._error = ["invalid_request_type " + packet_type];
    }
}

function commandParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if (packet_type == 0x03) {
        if (buffer.length == 1) {
            result._packet_type = "local_time_request";
            return;
        }
        result._packet_type = "local_time_response";
        result.device_local_time__s = dataView.getUint32();

        var date = new Date(result.device_local_time__s * 1000);
        result.device_local_time_formatted = date.toISOString().replace(/.\d+Z$/g, "Z");
        var start_of_2020 = 1577836800;
        if (result.device_local_time__s < start_of_2020)
            result.device_local_time_formatted = "invalid";
    }
    else if (packet_type == 0xFF)
        result._packet_type = "enter_dfu_command";
    else {
        result._error = ["invalid_command_type " + packet_type];
    }
}

// SYSTEM MESSAGES
function sysMessagesParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if (packet_type == 0x13) {
        result._packet_type = "faulty_downlink_packet";
        result.packet_fport = dataView.getUint8();
        result.packet_error_reason = packetErrorReasonFormatter(dataView.getUint8());
    }
    else if (packet_type == 0x00) {
        result._packet_type = "boot_packet";
        result.device_serial = serialFormat(dataView.getUint32());

        result.device_firmware_version = dataView.getUint8().toString() + "." + dataView.getUint8() + "." + dataView.getUint8();

        var bits1 = dataView.getUint8Bits();
        var reason = {};
        reason.reason_0 = bits1.getBits(1);
        reason.watchdog_reset = bits1.getBits(1);
        reason.soft_reset = bits1.getBits(1);
        reason.reason_3 = bits1.getBits(1);
        reason.magnet_wakeup = bits1.getBits(1);
        reason.reason_5 = bits1.getBits(1);
        reason.reason_6 = bits1.getBits(1);
        reason.nfc_wakeup = bits1.getBits(1);
        result.wakeup_reason_mcu = wakeupReasonFormat(reason);

        var bits2 = dataView.getUint8Bits();
        bits2.getBits(4);
        result.packet_reason = bootPacketReason(bits2.getBits(3));
        result.configuration_restored = bits2.getBits(1);

        result.hardware_configuration = hardwareConfigFormat(dataView.getUint8());
        dataView.getUint8();
        dataView.getUint8();
        result.device_uptime_accumulated__days = parseFloat((dataView.getUint24() / 24.0).toFixed(2));
    }
    else if (packet_type == 0x01) {
        var shutdown_reason = shutdownEeasonFormat(dataView.getUint8());
        var buffer_usage = buffer.slice(2);
        usageParser(buffer_usage, result);
        result._packet_type = "shutdown_packet";
        result._shutdown_reason = shutdown_reason;
    }
    else {
        result._error = ["invalid_command_type " + packet_type];
    }
}

function checkFport(fport, expectedFport, result) {
    if (fport != expectedFport)
        result._error = ["wrong fport or header"];
}

function decodeByPacketHeader(fport, bytes, result) {
    if (bytes.length == 0)
        result._error = ["empty_payload"];
    else if (bytes[0] == 0x04) {
        usageParser(bytes, result);
        checkFport(fport, 25, result);
    }
    else if (bytes[0] == 0x20 || bytes[0] == 0x21) {
        if (bytes.length == 1) {
            configurationRequestsParser(bytes, result);
            checkFport(fport, 49, result);
        }
        else {
            configurationParser(bytes, result);
            checkFport(fport, 50, result);
        }
    }
    else if (bytes[0] == 0x03 || bytes[0] == 0xFF) {
        commandParser(bytes, result);
        checkFport(fport, 60, result);
    }
    else if (bytes[0] == 0x00 || bytes[0] == 0x01 || bytes[0] == 0x13) {
        sysMessagesParser(bytes, result);
        checkFport(fport, 99, result);
    }
    else {
        result._error = ["invalid_header"];
    }
    return result;
}


export function decodeRaw(fport, bytes) {
    var res = {};
    try {
        decodeByPacketHeader(fport, bytes, res);
    } catch (err) {
        res._error = [err.message];
    }
    res._raw_payload = bytesToHexStr(bytes);
    // brings values containing 'invalid_' out to _errors list.
    for (var key in res) {
        if (typeof res[key] == "string" && res[key].indexOf("invalid_") > -1) {
            if (!('_error' in res))
                res._error = [];
            res._error.push(res[key]);
        }
    }
    return res;
}
