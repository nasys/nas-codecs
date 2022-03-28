import {BinaryExtract} from './util/extract.js';
import {decodeFport50, decodeFport60} from './lcu_common_decoder.js';

function decodeFport49(buffer, result, err) {
    var dataView = new BinaryExtract(buffer);
    var header = dataView.getUint8();
    switch(header) {
        case 0x01:
            result.packet_type = {value: "ldr_config_request"};
            return;
        case 0x02:
            result.packet_type = {value: "thr_config_request"};
            return;
        case 0x03:
            result.packet_type = {value: "dig_config_request"};
            return;
        case 0x05:
            result.packet_type = {value: "open_drain_out_config_request"};
            return;
        case 0x06:
            result.packet_type = {value: "calendar_config_request"};
            return;
        case 0x07:
            result.packet_type = {value: "status_config_request"};
            return;
        case 0x08:
            result.packet_type = {value: "profile_config_request"};
            var id = dataView.getUint8();
            result.profile_id = {"value": id == 0xFF ? "all_used_profiles" : id, "raw": id};
            return;
        case 0x0A:
            result.packet_type = {value: "default_dim_config_request"};
            return;
        case 0x0B:
            result.packet_type = {value: "usage_config_request"};
            return;
        case 0x0C:
            result.packet_type = {value: "holiday_config_request"};
            return;
        case 0x0D:
            result.packet_type = {value: "boot_delay_config_request"};
            return;
        case 0x0E:
            result.packet_type = {value: "defaults_config_request"};
            return;
        case 0x13:
            result.packet_type = {value: "meta_pos_config_request"};
            return;
        case 0x15:
            result.packet_type = {value: "led_config_request"};
            return;
        case 0x16:
            result.packet_type = {value: "metering_alert_confic_request"};
            return;
        case 0x52:
            result.packet_type = {value: "multicast_config_request"};
            result.multicast_device = {"value": dataView.getUint8()};
            return;
        default:
            err.errors.push("invalid_header");
    }
}

function decodeFport51(buffer, result, err) {
    var dataView = new BinaryExtract(buffer);
    var header = dataView.getUint8();
    switch(header) {
        case 0xFF:
            result.packet_type = {value: "activate_dfu_command"};
            return;
        default:
            err.errors.push("invalid_command");
            return result;
        }
}

function decodeDownlinkByFport(fport, bytes, result, err, isUplink) {
    if(bytes.length == 0)
        err.errors.push("empty_payload");
    else if(fport == 49)
        decodeFport49(bytes, result, err);
    else if(fport == 50)
        decodeFport50(bytes, result, err);
    else if(fport == 51)
        decodeFport51(bytes, result, err);
    else if(fport == 60)
        decodeFport60(bytes, result, err, isUplink);
    else
        err.errors.push("invalid_fport");
}

export function decodeRawDownlink(fport, bytes) {
    var isUplink = false;
    var res = {};
    var err = {errors: [], warnings: []};
    try {
        decodeDownlinkByFport(fport, bytes, res, err, isUplink);
    } catch(error) {
        console.log(error.stack);
        err.errors.push(error.message);
    }
    return {data: res, errors: err.errors, warnings: err.warnings};
}
