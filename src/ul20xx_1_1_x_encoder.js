import { BinaryPack, BitPack } from './util/pack';

function strLookup(val, lookup, err)
{
    if (typeof val !== 'string')
    {
        return val;        
    }
    for (var key in lookup)
    {
        if (key.toLowerCase() === val.toLowerCase())
        {
            return lookup[key];
        }
    }
    if (isNaN(parseFloat(val)))
    {
        err.warnings.push("invalid_value " + val)
    }
    return val;
}

function addressEncode(addr_in, err) {
    var addr_int = parseInt(addr_in.replace(/\D/g,''));
    // if (!isNaN(addr_int)) {
    //     return addr_int;} 
    if (addr_in === 'analog_0_10v') {
      return 0x01;
    } if (addr_in === 'dali_broadcast') {
        return 0xFE;
    } if (addr_in === 'all_devices') {
        return 0xFF;
    } if (addr_in.toLowerCase().indexOf('dali_group_') !== -1) {
        return ((addr_int * 2) + 128);
    } if (addr_in.toLowerCase().indexOf('dali_single_') !== -1) {
        return (addr_int * 2);
    } if (addr_in.toLowerCase().indexOf('invalid') !== -1) {
        err.warnings.push("invaid_address "+addr_in);
        return 'invaid_address'
    }
}

export function dimLevelEncode(level, err)
{
    if (level === "disabled") {
        return 0xff;
    }
    var l_int = parseInt(level);
    if (isNaN(l_int))
    {
        err.warnings.push("invalid_dim_value " + level)
        return 0xFF;
    }
    if (l_int < 0 || l_int > 100) {
        err.warnings.push("out_of_range_dim_value " + level)
    }
    return l_int
}

function convert_unix(time){
    return new Date(time).getTime() / 1000;
}

function encode_deprecated_ldr_input_config(data, pack, err) {
    pack.addUint8(0x01);
    pack.addUint8(strLookup(data.ldr_off_threshold_high, {"disabled": 0xFF}, err), "ldr_off_threshold_high");
    pack.addUint8(strLookup(data.ldr_on_threshold_low, {"disabled": 0xFF}, err), "ldr_on_threshold_low");
    var bits1 = new BitPack(err);
    bits1.addBits(0, 2, "");
    bits1.addBit(data.trigger_alert_enabled, "trigger_alert_enabled");
    pack.addUint8(bits1.data_byte);
}

function zen_angle(raw){
    return Math.round((raw - 90) * 6);
}

function encode_deprecated_dig_input_config(data, pack, err){
    pack.addUint8(0x03);
    pack.addUint16(strLookup(data.light_on_duration__s, {'dig_input_disabled': 0xFFFF}, err), 'light_on_duration__s');
    var bits1 = new BitPack(data);
    bits1.addBit(0, '');
    bits1.addBit(data.signal_edge_rising, 'signal_edge_rising');
    bits1.addBit(data.trigger_alert_enabled, 'trigger_alert_enabled');
    pack.addUint8(bits1.data_byte)
    pack.addUint8(addressEncode(data.address, err));
    pack.addUint8(dimLevelEncode(data.dimming_level__percent, err), 'dimming_level__percent');
}

function status_config(data, pack, err){
    pack.addUint8(0x07);
    var interval = parseInt(data.status_interval__s);
    if (interval < 60){
        err.warnings.push('status_interval_60s_minimum');
        pack.addUint32(60);
    } else if (interval > 86400){
        err.warnings.push('status_interval_86400s_maximum');
        pack.addUint8(86400)
    } else {
        pack.addUint32(interval, 'status_interval__s');
    }
}

function usage_config(data, pack, err){
    pack.addUint8(0x0B);
    var usage = strLookup(data.usage_interval__s, {'disabled': 0}, err);
    pack.addUint32(usage, 'usage_interval__s');
    if (data.mains_voltage__v){
        pack.addUint8(data.mains_voltage__v, mains_voltage__v)
    } else{
        pack.addUint8(0xFF);
    }
}

function time_config(data, pack, err){
    pack.addUint8(0x09);
    var time = strLookup(data.device_unix_epoch, {'force_lorawan_devicetimereq': 0}, err);
    pack.addUint32(convert_unix(time), 'device_unix_epoch');
}

function boot_delay_config(data, pack, err){
    pack.addUint8(0x0D);
    pack.addUint16(data.boot_delay_range__s)
}

function onboard_led_config(data, pack, err){
    pack.addUint8(0x15);
    var bits = new BitPack(err);
    bits.addBit(data.status_led_enabled, 'status_led_enabled');
    pack.addUint8(bits.data_byte);
}

function metering_alert_config(data, pack, err){
    pack.addUint8(0x16);
    pack.addUint8(0x01);
    pack.addUint16(strLookup(data.min_power__W, {'alert_off': 0xFFFF}, err), 'min_power__W');
    pack.addUint16(strLookup(data.max_power__W, {'alert_off': 0xFFFF}, err), 'max_power__W');
    pack.addUint16(strLookup(data.min_voltage__V, {'alert_off': 0xFFFF}, err), 'min_voltage__V');
    pack.addUint16(strLookup(data.max_voltage__V, {'alert_off': 0xFFFF}, err), 'max_voltage__V');
    pack.addUint8(strLookup(data.min_power_factor, {'alert_off': 0xFF}, err), 'min_power_factor');
}

function encode_calendar_config(data, pack, err){
    pack.addUint8(0x20);

    var bits1 = new BitPack(err);
    bits1.addBits(data.sunrise_steps.length, 4, 'sunrise_step_length');
    bits1.addBits(data.sunset_steps.length, 4, 'sunset_step_length');
    pack.addUint8(bits1.data_byte);

    var bits2 = new BitPack(err);
    bits2.addBit(data.calendar_prefers_meta_pos, 'calendar_prefers_meta_pos');
    bits2.addBit(data.calendar_clamps_profiles, 'calendar_clamps_profiles');
    bits2.addBit(data.calendar_clamps_dig, 'calendar_clamps_dig')
    pack.addUint8(bits2.data_byte);

    pack.addInt16(data.latitude__deg * 100, "latitude__deg");
    pack.addInt16(data.longitude__deg * 100, "longitude__deg");

    for (var step of data.sunrise_steps) {
        pack.addInt8(zen_angle(step.zenith_angle__deg), "zenith_angle__deg");
        pack.addUint8(strLookup(step.dimming_level__percent, {'disabled': 0xFF}, err), "dimming_level__percent");
    }
    for (var step of data.sunset_steps) {
        pack.addInt8(zen_angle(step.zenith_angle__deg), "zenith_angle__deg");
        pack.addUint8(strLookup(step.dimming_level__percent, {'disabled': 0xFF}, err), "dimming_level__percent");
    }
}

function day_shifts(day, err)
{
    switch (day)
    {
        case "holiday":
            return 0;
        case "mon":
            return 1;
        case "tue":
            return 2;
        case "wed":
            return 3;
        case "thu":
            return 4;
        case "fri":
            return 5;
        case "sat":
            return 6;
        case "sun":
            return 7;
        default:
            err.warnings.push("invalid_day " + day);
            return -1;
    }
}

function convertH2M(timeInHour){
    var timeParts = timeInHour.split(':');
    return parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
}

function encode_profile_config(data, pack, err){
    pack.addUint8(0x21);

    pack.addUint8(data.profile_id, 'profile_id');
    pack.addUint8((data.dimming_steps.length < 10) ? data.dimming_steps.length : 'invalid', 'dimming_steps'); // !TODO
    pack.addUint8(addressEncode(data.address, err));

    var days = 0;
    for (var day of data.days_active)
        days |= 1 << day_shifts(day, err);
    pack.addUint8(days);
    pack.addUint8(0x00);

    for (var i = 0; i < data.dimming_steps.length; i++){
        pack.addUint8(convertH2M(data.dimming_steps[i].step_time) / 10, 'step_time_');
        pack.addUint8(strLookup(data.dimming_steps[i].dimming_level__percent, {'inactive': 0xFF}, err), 'dimming_level__percent_');
    }
}

function encode_fade(fade, err){
    if(fade === 'ignore'){
        return 0xFF;
    }else if(fade < 0.45 || fade > 90.53){
        err.warnings.push("invalid_value");
        return;
    }else {
        return Math.round(Math.log(fade) / Math.log(Math.sqrt (2))) + 2;
    }
}

function encode_fade_config(data, pack, err){
    pack.addUint8(0x22);
    pack.addUint8(encode_fade(data.fade_duration__s, err))
}

function convertMonth(data){
    var Month_Day = data.split('/');

    return {month: Month_Day[0],
            day: Month_Day[1]}
}

function encode_holiday_config(data, pack, err){
    pack.addUint8(0x23);
    pack.addUint8(data.holidays.length <10 ? data.holidays.length: 'invalid', 'holiday_length');

    for (var i = 0; i < data.holidays.length; i++){
        var Month_Day = convertMonth(data.holidays[i])
        pack.addUint8(Month_Day.month, 'month');
        pack.addUint8(Month_Day.day, 'day');
    }
}

function encode_dali_monitor_config(data, pack, err){
    pack.addUint8(0x24);
    var bits1 = new BitPack(err);
    bits1.addBit(data.send_dali_alert, 'send_dali_alert');
    bits1.addBit(data.correct_dali_dimming_level, 'correct_dali_dimming_level');
    bits1.addBit(data.periodic_bus_scan_enabled, 'periodic_bus_scan_enabled');
    pack.addUint8(bits1.data_byte);
    pack.addUint16(strLookup(data.monitoring_interval__s, {'disabled': 0xFF}, err), 'monitoring_interval__s');
}

function fallback_dim_config(data, pack, err){
    pack.addUint8(0x25);
    pack.addUint8(data.fallback_dimming_level__percent, 'fallback_dimming_level__percent');
}

function utf8ToArr(val){
    var utf8 = [];

    for (var i = 0; i < val.length; i++) {
        var charCode = val.charCodeAt(i);

        if (charCode < 0x80) {
            utf8.push(charCode);
        } else if (charCode < 0x800) {
            utf8.push((charCode >> 6) | 0xC0, (charCode & 0x3F) | 0x80);
        } else if (charCode < 0x10000) {
            utf8.push((charCode >> 12) | 0xE0, ((charCode >> 6) & 0x3F) | 0x80, (charCode & 0x3F) | 0x80);
        } else if (charCode < 0x200000) {
            utf8.push((charCode >> 18) | 0xF0, ((charCode >> 12) & 0x3F) | 0x80, ((charCode >> 6) & 0x3F) | 0x80, (charCode & 0x3F) | 0x80);
        }
    }
    return utf8;
}

function location_config(data, pack, err){
    pack.addUint8(0x26);
    var enc_address = utf8ToArr(data.address);
    pack.addUint8(enc_address.length, 'address_length');
    pack.addUint32(strLookup(data.latitude__deg * 10000000, {'not_configured': 0x7FFFFFFF}, err), 'latitude__deg');
    pack.addUint32(strLookup(data.longitude__deg * 10000000, {'not_configured': 0x7FFFFFFF}, err), 'longitude__deg');
    for (var i = 0; i < enc_address.length; i++){
        pack.addUint8(enc_address[i]);
    }
}

function lumalink_decode(access_mode, err){
    switch(access_mode){
        case 'never_advertise':
            return 0x00;
        case 'first_commission':
            return 0x01;
        case 'every_boot':
            return 0x02;
        case 'always':
            return 0x03;
        default:
            err.warnings.push('invalid_lumalink_configuration');
            return -1;
    }
}

function lumalink_config(data, pack, err){
    pack.addUint8(0x27);
    pack.addUint8(lumalink_decode(data.access_mode, err));
}

function dig_input_config(data, pack, err){
    pack.addUint8(0x28);
    pack.addUint8(strLookup(data.dig_index, {'enable_dig': 0x00, 'disable_dig': 0xFF}), 'dig_index');

    var bits1 = new BitPack(err);
    bits1.addBit(data.dig_mode_button, 'dig_mode_button');
    bits1.addBit(data.polarity_high_or_rising, 'polarity_high_or_rising');
    bits1.addBit(data.alert_on_activation, 'alert_on_activation');
    bits1.addBit(data.alert_on_inactivation, 'alert_on_inactivation');
    pack.addUint8(bits1.data_byte);

    pack.addUint8(addressEncode(data.address, err), 'address');
    pack.addUint8(strLookup(data.active_dimming_level__percent, {'inactive': 0xFF}, err), 'active_dimming_level__percent');
    pack.addUint8(strLookup(data.inactive_dimming_level__percent, {'inactive': 0xFF}, err), 'inactive_dimming_level__percent');

    pack.addUint16(data.on_delay__s, 'on_delay__s');
    pack.addUint16(data.on_delay__s, 'on_delay__s');
}

function light_sensor_config(data, pack, err){
    pack.addUint8(0x29);
    pack.addUint8(strLookup(data.dim_steps.length, {'disabled': 0xFF}, err), 'step_count');

    var bits1 = new BitPack(err);
    bits1.addBit(data.notification_on_every_step, 'notification_on_every_step');
    bits1.addBit(data.light_sensor_clamps_profile, 'light_sensor_clamps_profile');
    bits1.addBit(data.light_sensor_clamps_dig, 'light_sensor_clamps_dig');
    bits1.addBit(data.interpolate_steps, 'interpolate_steps');
    pack.addUint8(bits1.data_byte);

    pack.addUint8(data.measurement_duration__s, 'measurement_duration__s');
    pack.addUint8(addressEncode(data.address, err), 'address');
    if (data.dim_steps != 'disabled'){
        for (var i=0; i < data.dim_steps.length; i++){
            pack.addFloat(data.dim_steps[i].light_level__lx, 'light_level__lx');
            pack.addUint8(strLookup(data.dim_steps[i].dimming_level__percent, {'inactive': 0xFF}, err), 'dimming_level__percent');
        }
    }
}

function dim_notify_config(data, pack, err){
    pack.addUint8(0x2A);
    pack.addUint8(strLookup(data.random_delay__s / 5, {'disabled': 0xFF}, err), 'random_delay__s');
    pack.addUint8((data.packet_limit__s / 60), 'packet_limit__s');
}

function interface_type_config(data, pack, err){
    pack.addUint8(0x2B);
    var lookup = {"dali":0, "analog_0_10v": 1, "not_overriden": 255};
    pack.addUint8(lookup[data["interface_type"]], 'interface_type');
}

function multicast_config(data, pack, err){
    pack.addUint8(0x52);
    pack.addUint8(data.multicast_device, 'multicast_device');
    
    if (data.devaddr.length != 8) {
        err.warnings.push("invalid_devaddr_length");
    }
    pack.addUint32(parseInt(data.devaddr, 16), 'devaddr');

    if (data.nwkskey.length != 32) {
        err.warnings.push('invalid_nwkskey_length');
    }
    pack.addUint8Arr(data.nwkskey, 'nwkskey');

    if (data.appskey.length != 32) {
        err.warnings.push('invalid_appskey_length');
    }
    pack.addUint8Arr(data.appskey, 'appskey');
}

function encodeProfile(profile, err){
    switch(profile){
        case 'profile_0':
            return 0x00;
        case 'profile_1':
            return 0x01;
        case 'profile_2':
            return 0x02;
        case 'profile_3':
            return 0x03;
        case 'profile_4':
            return 0x04;
        case 'profile_5':
            return 0x05;
        case 'profile_6':
            return 0x06;
        case 'profile_7':
            return 0x07;
        case 'all_profiles':
            return 0xFF;
        default:
            err.warnings.push('unkown_profile');
            return 0xFF;  
    }
}

function encodeMulticast(multicast, err){
    switch(multicast){
        case 'multicast_device_0':
            return 0x00;
        case 'multicast_device_1':
            return 0x01;
        case 'multicast_device_2':
            return 0x02;
        case 'multicast_device_3':
            return 0x03;
        case 'all_multicast_devices':
            return 0xFF;
        default:
            err.warnings.push('invalid_multicast_device');
            return 0xFF;
    }
}

function clear_config(data, pack, err){
    pack.addUint8(0xFF);
    switch(data.reset_target){
        case 'ldr_input_config':
            pack.addUint8(0x01);
            break;
        case 'dig_input_config':
            pack.addUint8(0x03);
            break;
        case 'profile_config':
            pack.addUint8(0x21);
            pack.addUint8(encodeProfile(data.address, err), 'profile_id');
            break;
        case 'holiday_config':
            pack.addUint8(0x23);
            break;
        case 'multicast_config':
            pack.addUint8(0x52);
            pack.addUint8(encodeMulticast(data.multicast_device, err), 'multicast_device')
            break;
        case 'factory_reset':
            pack.addUint8(0xFF);
            pack.addUint32(parseInt(data.device_serial, 16), 'device_serial');
            break;
        default:
            err.warnings.push('invalid_target');
            break;
    }
}

function encode_conf_requests(data, pack, err){
    switch(data.packet_type){
        case 'ldr_input_config_request':
            pack.addUint8(0x01);
            break;
        case 'dig_input_config_request':
            pack.addUint8(0x03);
            break;
        case 'status_config_request':
            pack.addUint8(0x07);
            break;
        case 'time_config_request':
            pack.addUint8(0x09);
            break;
        case 'usage_config_request':
            pack.addUint8(0x0B);
            break;
        case 'boot_delay_config_request':
            pack.addUint8(0x0D);
            break;
        case 'onboard_led_config_request':
            pack.addUint8(0x15);
            break;
        case 'metering_alert_config_request':
            pack.addUint8(0x16);
            break;
        case 'calendar_config_request':
            pack.addUint8(0x20);
            break;
        case 'profile_config_request':
            pack.addUint8(0x21);
            pack.addUint8(encodeProfile(data.profile_id, err), 'profile_id');
            break;
        case 'fade_config_request':
            pack.addUint8(0x22);
            break;
        case 'holiday_config_request':
            pack.addUint8(0x23);
            break;
        case 'dali_monitor_config_request':
            pack.addUint8(0x24);
            break;
        case 'fallback_dim_config_request':
            pack.addUint8(0x25);
            break;
        case 'location_config_request':
            pack.addUint8(0x26);
            break;
        case 'lumalink_config_request':
            pack.addUint8(0x27);
            break;
        case 'dig_input_config_request':
            pack.addUint8(0x28);
            break;
        case 'light_sensor_config_request':
            pack.addUint8(0x29);
            break;
        case 'dim_notify_config_request':
            pack.addUint8(0x2A);
            break;
        case 'multicast_config_request':
            pack.addUint8(0x52);
            pack.addUint8(data.multicast_device, 'multicast_device');
            break;
        default:
            err.warnings.push('invalid_request_packet');
            break;   
    }
}

function pack_address_dim_level(dest, pack, err) {
    pack.addUint8(addressEncode(dest.address));
    var dim = strLookup(dest.dimming_level__percent, {'resume': 0xFF}, err);
    pack.addUint8(dim, 'dimming_level__percent');
}

function manual_dimming(data, pack, err){
    pack.addUint8(0x01);
    for (var i = 0;i < data.destination.length; i++){
        pack_address_dim_level(data.destination[i], pack, err);
    }
}

function manual_timed_dimming(data, pack ,err){
    pack.addUint8(0x09);
    for (var i = 0; i<data.destination.length; i++){
        pack_address_dim_level(data.destination[i], pack, err);
        pack.addUint8(data.destination[i].duration__minutes, 'duration__minutes');
    }
}

function status_usage_request(data, pack, err){
    pack.addUint8(0x05);
    if (data.dim_map_report_requested) {
        for (var i = 0; i<data.drivers.length; i++){
            pack.addUint8(0x04);
            pack.addUint8(addressEncode(data.drivers[i].address, err), 'dali_driver');
            pack.addUint8(data.drivers[i].dali_min_level, 'dali_min_level');
            pack.addUint8(data.drivers[i].dali_max_level, 'dali_max_level');
            var curve = strLookup(data.drivers[i].dimming_curve, {'logarithmic': 0x00, 'linear':0x01}, err);
            pack.addUint8(curve, 'dimming_curve');
        }
    } else {
        var bits1 = new BitPack(err);
        bits1.addBit(data.usage_requested, 'usage_requested');
        bits1.addBit(data.status_requested, 'status_requested');
        pack.addUint8(bits1.data_byte);
    }
}

function open_drain_ouptut_control(data, pack, err){
    pack.addUint8(0x0C);
    var bits1 = new BitPack(err);
    bits1.addBit(data.open_drain_output_on, 'open_drain_output_on');
    pack.addUint8(bits1.data_byte);
}

function custom_dali_request(data, pack, err){
    pack.addUint8(0x03);
    pack.addUint8Arr(data.query_data_raw);
}

function custom_dali_command(data, pack, err){
    pack.addUint8(0x04);
    pack.addUint8Arr(data.dali_command);
}

function driver_memory_read(data, pack, err){
    pack.addUint8(0x07);
    pack.addUint8(addressEncode(data.address, err), 'address');
    pack.addUint8(data.memory_bank, 'memory_bank');
    pack.addUint8(data.memory_address, 'memory_address');
    pack.addUint8(data.read_size__bytes, 'read_size__bytes');
}

function driver_memory_write(data, pack, err){
    pack.addUint8(0x08);
    pack.addUint8(addressEncode(data.address, err), 'address');
    pack.addUint8(data.memory_bank, 'memory_bank');
    pack.addUint8(data.memory_address, 'memory_address');
}

function address_dali_driver(data, pack, err){
    pack.addUint8(0x0A);
    pack.addUint8(addressEncode(data.address, err), 'address');
}

function encode_packet(data, pack, err) {
    var fport = 50;
    if (data.packet_type === 'deprecated_ldr_input_config_packet') {
        encode_deprecated_ldr_input_config(data, pack, err);
    } else if (data.packet_type === 'deprecated_dig_input_config_packet') {
        encode_deprecated_dig_input_config(data, pack, err);
    } else if (data.packet_type === 'status_config_packet') {
        status_config(data, pack, err);
    } else if (data.packet_type === 'time_config_packet'){
        time_config(data, pack, err);
    } else if (data.packet_type === 'usage_config_packet'){
        usage_config(data, pack, err);
    } else if (data.packet_type === 'boot_delay_config_packet'){
        boot_delay_config(data, pack, err);
    } else if (data.packet_type === 'onboard_led_config_packet'){
        onboard_led_config(data, pack, err);
    } else if (data.packet_type === 'metering_alert_config_packet'){
        metering_alert_config(data, pack, err);
    } else if (data.packet_type === 'calendar_config_packet'){
        encode_calendar_config(data, pack, err);
    } else if (data.packet_type === 'profile_config_packet'){
        encode_profile_config(data, pack, err);
    } else if (data.packet_type === 'fade_config_packet'){
        encode_fade_config(data, pack, err);
    } else if (data.packet_type === 'holiday_config_packet'){
        encode_holiday_config(data, pack, err);
    } else if (data.packet_type === 'dali_monitor_config_packet'){
        encode_dali_monitor_config(data, pack, err);
    } else if (data.packet_type === 'fallback_dim_config_packet'){
        fallback_dim_config(data, pack, err);
    } else if (data.packet_type === 'location_config_packet'){
        location_config(data, pack, err);
    } else if (data.packet_type === 'lumalink_config_packet'){
        lumalink_config(data, pack, err);
    } else if (data.packet_type === 'dig_input_config_packet'){
        dig_input_config(data, pack, err);
    } else if (data.packet_type === 'light_sensor_config_packet'){
        light_sensor_config(data, pack, err);
    } else if (data.packet_type === 'dim_notify_config_packet'){
        dim_notify_config(data, pack, err);
    } else if (data.packet_type === 'interface_type_config_packet'){
        interface_type_config(data, pack, err);
    } else if (data.packet_type === 'multicast_config_packet'){
        multicast_config(data, pack, err);
    } else if (data.packet_type === 'clear_config_packet'){
        clear_config(data, pack, err);
    } else if (data.packet_type === 'chained_config_packet'){
        pack.addUint8(0xFE);
        for (var i = 0;i < data.payloads.length; i++){
            var fp = encode_packet(data.payloads[i], pack, err, fport);
            if (fp == 0) {
                err.warnings.push("invalid_chained_payload " + data.payloads[i].packet_type)
            }
            if (fp != 50) {
                err.warnings.push("non_config_packet_in_chain " + data.payloads[i].packet_type)
            }
        }
    } else if (data.packet_type === 'activate_dfu_command'){
        pack.addUint8(0xFF);
        fport = 51;
    } else if (data.packet_type === 'restart_controller_command'){
        pack.addUint8(0xFE);
        fport = 51;
    } else if (data.packet_type === 'manual_dimming'){
        manual_dimming(data, pack, err);
        fport = 60;
    } else if (data.packet_type === 'manual_timed_dimming'){
        manual_timed_dimming(data, pack, err);
        fport = 60;
    } else if (data.packet_type === 'status_usage_request'){
        status_usage_request(data, pack, err);
        fport = 60;
    } else if (data.packet_type === 'open_drain_output_control'){
        open_drain_ouptut_control(data, pack, err);
        fport = 60;
    } else if (data.packet_type === 'custom_dali_request'){
        custom_dali_request(data, pack, err);
        fport = 60;
    } else if (data.packet_type === 'custom_dali_command'){
        custom_dali_command(data, pack, err);
        fport = 60;
    } else if (data.packet_type === 'driver_memory_read'){
        driver_memory_read(data, pack, err);
        fport = 60;
    } else if (data.packet_type === 'driver_memory_write'){
        driver_memory_write(data, pack, err);
        fport = 60;
    } else if (data.packet_type === 'address_dali_driver'){
        address_dali_driver(data, pack, err);
        fport = 60;
    } else if (data.packet_type === 'dali_identify'){
        pack.addUint8(0x0B);
        fport = 60;
    }
    else if (data.packet_type.indexOf('_request') !== -1){
        encode_conf_requests(data, pack, err);
        fport = 49;
    }
    else {
        err.warnings.push("invalid_packet_type "+ data.packet_type);
        fport = 0;
    }
    return fport;
}

export function rawEncode(data){
    var err = {errors:[], warnings:[]};
    var pack = new BinaryPack(err);
    var fport = 0;
    var jdata = data.data;
    if ("data" in jdata) {
        jdata = jdata.data;
    }

    try{
        var fport = encode_packet(jdata, pack, err);
    } catch (error) {
        err.errors.push("encoder_error " + error.message);
    }
        
    return {bytes: pack.buffer, fPort: fport, warnings: err.warnings, errors: err.errors};
}