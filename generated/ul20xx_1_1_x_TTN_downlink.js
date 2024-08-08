function BitPack(err) {
  // BINARY PACKING UTILITIES - Many workarounds here are only because
  // Dataview and other newer features are not available in ES5 (required by chirpstack).
  // basically a class (which is not directly supported in ES5)
  this.data_byte = 0;
  this.offset = 0; // 0 - 7
  this.err = err;
}

BitPack.prototype.addBit = function (val, key) {
  if (typeof val === 'string') {
    val = val.toLowerCase();
  }
  var val_int = parseInt(val);
  if (val === "true" || val === true || val_int === 1) {
    var val_bool = true;
  }
  else if (val === "false" || val === false || val_int === 0) {
    var val_bool = false;
  }
  else {
    var val_bool = false;
    this.err.warnings.push(key + " invalid_boolean_value_or_key_not_found");
  }

  if (this.offset + 1 >= 8) {
    this.err.errors.push(key + " too_many_bits");
  }

  this.data_byte |= val_bool << this.offset;
  this.offset += 1;
};

BitPack.prototype.addBits = function (val, lengthBits, key) {
  val = parseInt(val);
  if (val === null) // TODO
  {
    this.err.warnings.push(key + " invalid_bits");
  }
  if (this.offset + lengthBits > 8) {
    this.err.errors.push(key + " too_many_bits");
  }

  var mask = Math.pow(2, lengthBits) - 1;

  // eslint-disable-next-line no-bitwise
  this.data_byte |= (val & mask) << this.offset;
  this.offset += lengthBits;
};


function BinaryPack(err) {
  // everything is little-endian for now
  this.buffer = [];
  this.err = err;
}

BinaryPack.prototype.length = function () {
  return this.buffer.length;
};

BinaryPack.prototype.int_invalid = function (val, val_int, val_min, val_max, key) {
  if (val === undefined) {
    this.err.warnings.push(key + " key_not_found");
    return true;
  }
  if (isNaN(val_int)) {
    this.err.warnings.push(key + " value_not_integer");
    return true;
  }
  if (val_int < val_min) {
    this.err.warnings.push(key + " value_too_small");
    return true;
  }
  if (val_int > val_max) {
    this.err.warnings.push(key + " value_too_large");
    return true;
  }
  return false;
};

BinaryPack.prototype.addFloat = function (val, key) {
  var value = parseFloat(val);
  if (isNaN(value)) {
    this.err.warnings.push(key + " value_not_integer");
    return true;
  }

  var bytes = 0;
  switch (value) {
    case Number.POSITIVE_INFINITY: bytes = 0x7F800000; break;
    case Number.NEGATIVE_INFINITY: bytes = 0xFF800000; break;
    case +0.0: bytes = 0x40000000; break;
    case -0.0: bytes = 0xC0000000; break;
    default:
      if (Number.isNaN(value)) { bytes = 0x7FC00000; break; }

      if (value <= -0.0) {
        bytes = 0x80000000;
        value = -value;
      }

      var exponent = Math.floor(Math.log(value) / Math.log(2));
      var significand = ((value / Math.pow(2, exponent)) * 0x00800000) | 0;

      exponent += 127;
      if (exponent >= 0xFF) {
        exponent = 0xFF;
        significand = 0;
      } else if (exponent < 0) exponent = 0;

      bytes = bytes | (exponent << 23);
      bytes = bytes | (significand & ~(-1 << 23));
      break;
  }
  this.addInt32(bytes, key);
};

BinaryPack.prototype.addUint8Arr = function (val) {
  for (var c = 0; c < val.length; c += 2)
    this.buffer.push(parseInt(val.substr(c, 2), 16));
};

BinaryPack.prototype.addUint8 = function (val, key) {
  var val_int = parseInt(val);
  if (this.int_invalid(val, val_int, 0, 255, key)) {
    this.buffer.push(0);
    return;
  }
  this.buffer.push(val_int);
};

BinaryPack.prototype.addInt8 = function (val, key) {
  var val_int = parseInt(val);
  if (this.int_invalid(val, val_int, -128, 127, key)) {
    this.buffer.push(0);
    return;
  }
  this.buffer.push(val_int >= 0 ? val_int : 0x100 + val_int);
};

BinaryPack.prototype.addUint16 = function (val, key) {
  var val_int = parseInt(val.toString(2).slice(-16), 2);
  if (this.int_invalid(val, val_int, 0, 65535, key)) {
    this.buffer.push(0);
    this.buffer.push(0);
    return;
  }
  this.buffer.push(val_int & 0xFF);
  this.buffer.push((val_int >> 8) & 0xFF);
};

BinaryPack.prototype.addInt16 = function (val, key) {
  var val_int = parseInt(val);
  if (this.int_invalid(val, val_int, -32768, 32767, key)) {
    this.buffer.push(0);
    this.buffer.push(0);
    return;
  }
  var pos_val = val_int >= 0 ? val_int : 0x10000 + val_int;
  this.buffer.push(pos_val & 0xFF);
  this.buffer.push((pos_val >> 8) & 0xFF);
};

BinaryPack.prototype.addUint32 = function (val, key) {
  var val_int = parseInt(val);
  if (this.int_invalid(val, val_int, 0, 4294967295, key)) {
    this.buffer.push(0);
    this.buffer.push(0);
    this.buffer.push(0);
    this.buffer.push(0);
    return;
  }
  this.buffer.push(val_int & 0xFF);
  this.buffer.push((val_int >> 8) & 0xFF);
  this.buffer.push((val_int >> 16) & 0xFF);
  this.buffer.push((val_int >> 24) & 0xFF);
};

BinaryPack.prototype.addInt32 = function (val, key) {
  var val_int = parseInt(val);
  if (this.int_invalid(val, val_int, -2147483648, 2147483647, key)) {
    this.buffer.push(0);
    this.buffer.push(0);
    this.buffer.push(0);
    this.buffer.push(0);
    return;
  }
  var pos_val = val_int >= 0 ? val_int : 0x100000000 + val_int;
  this.buffer.push(pos_val & 0xFF);
  this.buffer.push((pos_val >> 8) & 0xFF);
  this.buffer.push((pos_val >> 16) & 0xFF);
  this.buffer.push((pos_val >> 24) & 0xFF);
};

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
        err.warnings.push("invalid_value " + val);
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

function dimLevelEncode(level, err)
{
    if (level === "disabled") {
        return 0xff;
    }
    var l_int = parseInt(level);
    if (isNaN(l_int))
    {
        err.warnings.push("invalid_dim_value " + level);
        return 0xFF;
    }
    if (l_int < 0 || l_int > 100) {
        err.warnings.push("out_of_range_dim_value " + level);
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
    pack.addUint8(bits1.data_byte);
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
        pack.addUint8(86400);
    } else {
        pack.addUint32(interval, 'status_interval__s');
    }
}

function usage_config(data, pack, err){
    pack.addUint8(0x0B);
    var usage = strLookup(data.usage_interval__s, {'disabled': 0}, err);
    pack.addUint32(usage, 'usage_interval__s');
    if (data.mains_voltage__v){
        pack.addUint8(data.mains_voltage__v, mains_voltage__v);
    } else {
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
    pack.addUint16(data.boot_delay_range__s);
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
    bits2.addBit(data.calendar_clamps_dig, 'calendar_clamps_dig');
    bits2.addBit(data.ignore_gnss, 'ignore_gnss');
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
    pack.addUint8(encode_fade(data.fade_duration__s, err));
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
        var Month_Day = convertMonth(data.holidays[i]);
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
    var lookup = {"dali":0, "analog_0_10v": 1, "factory_default": 255};
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
        case 'light_sensor_config':
            pack.addUint8(0x29);
            break;
        case 'dig_input_config':
            pack.addUint8(0x28);
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
            pack.addUint8(encodeMulticast(data.multicast_device, err), 'multicast_device');
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
        bits1.addBit(data.request_gnss_notification, 'request_gnss_notification');
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
        boot_delay_config(data, pack);
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
        encode_holiday_config(data, pack);
    } else if (data.packet_type === 'dali_monitor_config_packet'){
        encode_dali_monitor_config(data, pack, err);
    } else if (data.packet_type === 'fallback_dim_config_packet'){
        fallback_dim_config(data, pack);
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
        interface_type_config(data, pack);
    } else if (data.packet_type === 'multicast_config_packet'){
        multicast_config(data, pack, err);
    } else if (data.packet_type === 'clear_config_packet'){
        clear_config(data, pack, err);
    } else if (data.packet_type === 'chained_config_packet'){
        pack.addUint8(0xFE);
        for (var i = 0;i < data.payloads.length; i++){
            var fp = encode_packet(data.payloads[i], pack, err);
            if (fp == 0) {
                err.warnings.push("invalid_chained_payload " + data.payloads[i].packet_type);
            }
            if (fp != 50) {
                err.warnings.push("non_config_packet_in_chain " + data.payloads[i].packet_type);
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
        custom_dali_request(data, pack);
        fport = 60;
    } else if (data.packet_type === 'custom_dali_command'){
        custom_dali_command(data, pack);
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

function rawEncode(data){
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

function stringFromUTF8Array(data) {
  // from https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/
  var extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
  var count = data.length;
  var str = '';
  for (var index = 0; index < count;) {
    // eslint-disable-next-line no-plusplus
    var ch = data[index++];
    // eslint-disable-next-line no-bitwise
    if (ch & 0x80) {
      // eslint-disable-next-line no-bitwise
      var extra = extraByteMap[(ch >> 3) & 0x07];
      // eslint-disable-next-line no-bitwise
      if (!(ch & 0x40) || !extra || ((index + extra) > count)) {
        return null;
      }
      // eslint-disable-next-line no-bitwise
      ch &= (0x3F >> extra);
      for (; extra > 0; extra -= 1) {
        // eslint-disable-next-line no-plusplus
        var chx = data[index++];
        // eslint-disable-next-line no-bitwise
        if ((chx & 0xC0) !== 0x80) {
          return null;
        }
        // eslint-disable-next-line no-bitwise
        ch = (ch << 6) | (chx & 0x3F);
      }
    }
    str += String.fromCharCode(ch);
  }
  return str;
}

function BitExtract(dataByte) {
  // BINARY EXTRACTING UTILITIES - Many workarounds here are only because
  // Dataview and other newer features are not available in ES5 (required by chirpstack).
  // basically a class (which is not directly supported in ES5)
  this.data = dataByte;
  this.offset = 0;
}

BitExtract.prototype._assertOnRemainingLength = function (lengthBits) {
  if (lengthBits === 0) { throw Error('invalid zero length bit field'); }
  if (this.offset + lengthBits > 8) { throw Error('invalid number of bits extracted'); }
};

BitExtract.prototype.getBits = function (lengthBits) {
  this._assertOnRemainingLength(lengthBits);
  var mask = Math.pow(2, lengthBits) - 1;
  // eslint-disable-next-line no-bitwise
  var res = (this.data >> this.offset) & mask;
  this.offset += lengthBits;
  return lengthBits === 1 ? Boolean(res) : res;
};

function BinaryExtract(buffer) {
  // everything is little-endian for now
  this.buffer = buffer;
  this.offset = 0;
}

BinaryExtract.prototype.availableLen = function () {
  return this.buffer.length - this.offset;
};

BinaryExtract.prototype._assertOnRemainingLength = function (length) {
  if (length > this.availableLen()) { throw Error('invalid buffer length: too short'); }
};

BinaryExtract.prototype.getUint8 = function () {
  this._assertOnRemainingLength(1);
  // eslint-disable-next-line no-plusplus
  return this.buffer[this.offset++];
};

BinaryExtract.prototype.getInt8 = function () {
  var res = this.getUint8();
  return res > 0x7F ? res - 0x100 : res;
};

BinaryExtract.prototype.getUint16 = function () {
  this._assertOnRemainingLength(2);
  // eslint-disable-next-line no-plusplus
  var res = this.buffer[this.offset++] + this.buffer[this.offset++] * 256;
  return res;
};

BinaryExtract.prototype.getInt16 = function () {
  var res = this.getUint16();
  return res > 0x7FFF ? res - 0x10000 : res;
};

BinaryExtract.prototype.getUint24 = function () {
  this._assertOnRemainingLength(3);
  // eslint-disable-next-line no-plusplus
  var res = this.buffer[this.offset++] + this.buffer[this.offset++] * 256
    // eslint-disable-next-line no-plusplus
    + this.buffer[this.offset++] * 65536;
  return res;
};

BinaryExtract.prototype.getUint32 = function () {
  this._assertOnRemainingLength(4);
  // eslint-disable-next-line no-plusplus
  var res = this.buffer[this.offset++] + this.buffer[this.offset++] * 256
    // eslint-disable-next-line no-plusplus
    + this.buffer[this.offset++] * 65536 + this.buffer[this.offset++] * 16777216;
  return res;
};

BinaryExtract.prototype.getInt32 = function () {
  var res = this.getUint32();
  return res > 0x7FFFFFFF ? res - 0x100000000 : res;
};

BinaryExtract.prototype.getUint64 = function () {
  var first = this.getUint32();
  var second = this.getUint32();
  // since double can safely represent needed range,
  // its used MAX_SAFE_INTEGER → 9_007_199_254_740_991
  var res = first + second * 0x100000000;
  return res;
};

BinaryExtract.prototype.getTextUtf8 = function (len) {
  this._assertOnRemainingLength(len);
  var res = stringFromUTF8Array(this.buffer.slice(this.offset, this.offset + len));
  this.offset += len;
  return res;
};

BinaryExtract.prototype.getUint8Bits = function () {
  return new BitExtract(this.getUint8());
};

BinaryExtract.prototype.getRaw = function (len) {
  this._assertOnRemainingLength(len);
  var res = this.buffer.slice(this.offset, this.offset + len);
  this.offset += len;
  return res;
};

BinaryExtract.prototype.getFloat = function () {
  var bytes = this.getUint32();
  // from https://stackoverflow.com/a/16001019/12636611
  // eslint-disable-next-line no-bitwise
  var sign = (bytes & 0x80000000) ? -1 : 1;
  // eslint-disable-next-line no-bitwise
  var exponent = ((bytes >> 23) & 0xFF) - 127;
  // eslint-disable-next-line no-bitwise
  var significand = (bytes & ~(-1 << 23));

  if (exponent === 128) { return sign * ((significand) ? Number.NaN : Number.POSITIVE_INFINITY); }

  if (exponent === -127) {
    if (significand === 0) return sign * 0.0;
    exponent = -126;
    // eslint-disable-next-line no-bitwise
    significand /= (1 << 22);
  } else {
    // eslint-disable-next-line no-bitwise
    significand = (significand | (1 << 23)) / (1 << 23);
  }
  return sign * significand * Math.pow(2, exponent);
};

function pad(number, length) {
  var str = '' + number;
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
}

function intToHexStr(int, len) {
  return pad(int.toString(16).toUpperCase(), len);
}

function bytesToHexStr(byteArr) {
  var res = '';
  for (var i = 0; i < byteArr.length; i += 1) {
    res += ('00' + byteArr[i].toString(16)).slice(-2).toUpperCase();
  }
  return res;
}

function addressParse(addr, ffStr, err) {
  if (addr === 0x01) {
    return 'analog_0_10v';
  }
  if (addr === 0xFE) {
    return 'dali_broadcast';
  }
  if (addr === 0xFF) {
    if (ffStr) {
      return ffStr;
    }
    err.warnings.push('invalid_address');
    return 'invalid';
  }
  // eslint-disable-next-line no-bitwise
  if (addr & 0x01) {
    err.warnings.push('invalid_address');
    return 'invalid';
  }
  // eslint-disable-next-line no-bitwise
  if (addr & 0x80) {
    // eslint-disable-next-line no-bitwise
    return 'dali_group_' + ((addr >> 1) & 0xF).toString();
  }

  // eslint-disable-next-line no-bitwise
  return 'dali_single_' + ((addr >> 1) & 0x3F).toString();
}

function profileParserPartial(dataView, profile, err) {
  var id = dataView.getUint8();
  profile.profile_id = id === 255 ? 'no_profile' : id;

  var length = 0;
  length = dataView.getUint8();

  var addr = dataView.getUint8();
  profile.address = addressParse(addr, "all_devices", err);

  var activeDays = dataView.getUint8();
  var bits = new BitExtract(activeDays);
  var days = [];
  if (bits.getBits(1)) {
    days.push('holiday');
  }
  if (bits.getBits(1)) {
    days.push('mon');
  }
  if (bits.getBits(1)) {
    days.push('tue');
  }
  if (bits.getBits(1)) {
    days.push('wed');
  }
  if (bits.getBits(1)) {
    days.push('thu');
  }
  if (bits.getBits(1)) {
    days.push('fri');
  }
  if (bits.getBits(1)) {
    days.push('sat');
  }
  if (bits.getBits(1)) {
    days.push('sun');
  }
  profile.days_active = days;

  dataView.getUint8();
  return length;
}

function decodeUnixEpoch(epoch, err) {
  var date = new Date(epoch * 1000);
  var epochFormatted = date.toISOString();
  if (epoch < 1420070400) { // 1 January 2015 00:00:00
    epochFormatted = 'invalid_timestamp';
    err.warnings.push('invalid_timestamp');
  }
  return epochFormatted;
}

function decodeLdrConfig(dataView, result) {
  result.packet_type = 'deprecated_ldr_input_config_packet';

  var high = dataView.getUint8();
  result.ldr_off_threshold_high = high === 0xFF ? 'disabled' : high;

  var low = dataView.getUint8();
  result.ldr_on_threshold_low = low === 0xFF ? 'disabled' : low;

  var behaviorBits = dataView.getUint8Bits();
  behaviorBits.getBits(2);
  result.trigger_alert_enabled = behaviorBits.getBits(1);
}
function decodeLightDimStep(dataView) {
  var res = {};
  var light = dataView.getFloat();
  var level = dataView.getUint8();
  res.light_level__lx = formatLightLx(light);
  res.dimming_level__percent = decodeDimmingLevel(level, 'inactive');
  return res;
}

function decodeLightSensorConfig(dataView, result, err) {
  result.packet_type = 'light_sensor_config_packet';

  if (dataView.getUint8() === 0xFF) {
    return;
  }
  var bits = dataView.getUint8Bits();
  result.notification_on_every_step = bits.getBits(1);
  result.light_sensor_clamps_profile = bits.getBits(1);
  result.light_sensor_clamps_dig = bits.getBits(1);
  result.interpolate_steps = bits.getBits(1);

  result.measurement_duration__s = dataView.getUint8();

  result.address = addressParse(dataView.getUint8(), "all_devices", err);

  result.dim_steps = [];
  while (dataView.availableLen()) {
    result.dim_steps.push(decodeLightDimStep(dataView));
  }
}

function decodeDimNotifyConfig(dataView, result, err) {
  result.packet_type = 'dim_notify_config_packet';
  var rdly = dataView.getUint8();
  result.random_delay__s = rdly === 0xff ? 'disabled' : rdly * 5;
  result.packet_limit__s = dataView.getUint8() * 60;
}

function decodeInterfaceType(val, err) {
  switch (val) {
    case 0:
      return 'dali';
    case 1:
      return 'analog_0_10v';
    case 254:
      err.errors.push('not_supported');
      return 'not_supported';
    case 254:
      return 'factory_default';
    default:
      err.errors.push('invalid_value');
      return 'invalid_value';
  }
}

function decodeInterfaceTypeConfig(dataView, result, err) {
  result.packet_type = 'interface_type_config_packet';
  result.interface_type = decodeInterfaceType(dataView.getUint8(), err);
}

function decodeDimmingLevel(level, ffName) {
  if (level === 0xFF) {
    return ffName;
  }
  return level;
}

function decodeDigConfig(dataView, result, err) {
  result.packet_type = 'deprecated_dig_input_config_packet';

  var time = dataView.getUint16();
  result.light_on_duration__s = time === 0xFFFF ? 'dig_input_disabled' : time;

  var behaviorBits = dataView.getUint8Bits();
  behaviorBits.getBits(1);
  result.signal_edge_rising = behaviorBits.getBits(1);
  result.trigger_alert_enabled = behaviorBits.getBits(1);

  result.address = addressParse(dataView.getUint8(), "all_devices", err);

  result.dimming_level__percent = decodeDimmingLevel(dataView.getUint8(), 'disabled');
}

function decodeDigInputConfigNew(dataView, result, err) {
  result.packet_type = 'dig_input_config_packet';

  var index = dataView.getUint8();
  if (index === 0xFF) {
    return;
  }

  var bits = dataView.getUint8Bits();
  result.dig_mode_button = bits.getBits(1);
  result.polarity_high_or_rising = bits.getBits(1);
  result.notification_on_activation = bits.getBits(1);
  result.notification_on_inactivation = bits.getBits(1);

  result.address = addressParse(dataView.getUint8(), "all_devices", err);

  result.active_dimming_level__percent = decodeDimmingLevel(dataView.getUint8(), 'inactive');
  result.inactive_dimming_level__percent = decodeDimmingLevel(dataView.getUint8(), 'inactive');

  var on_delay = dataView.getUint16();
  var off_delay = dataView.getUint16();
  result.on_delay__s = on_delay;
  result.off_delay__s = off_delay;
}

function decodeStepTime(inByte) {
  var minTotal = inByte * 10;
  var hour = Math.trunc(minTotal / 60);
  var mn = minTotal - hour * 60;
  return pad(hour, 2) + ':' + pad(mn, 2);
}

function decodeOdRelaySwStep(dataView) {
  var res = {};
  res.step_time = decodeStepTime(dataView.getUint8());

  var state = dataView.getUint8() !== 0;
  res.open_drain_output_on = state;
  return res;
}

function decodeZenithStep(dataView) {
  var step = {};
  step.zenith_angle__deg = (dataView.getInt8() / 6 + 90).toFixed(2);

  var dim = dataView.getUint8();
  step.dimming_level__percent = decodeDimmingLevel(dim, 'disabled');
  return step;
}

function decodeCalendarConfigV11(dataView, result) {
  result.packet_type = 'calendar_config_packet';

  var steps = dataView.getUint8Bits();
  var sunriseSteps = steps.getBits(4);
  var sunsetSteps = steps.getBits(4);

  var bits = dataView.getUint8Bits();
  result.calendar_prefers_meta_pos = bits.getBits(1);
  result.calendar_clamps_profiles = bits.getBits(1);
  result.calendar_clamps_dig = bits.getBits(1);
  result.ignore_gnss = bits.getBits(1);

  result.latitude__deg = dataView.getInt16() / 100;
  result.longitude__deg = dataView.getInt16() / 100;

  result.sunrise_steps = [];
  result.sunset_steps = [];

  for (var i1 = 0; i1 < sunriseSteps; i1 += 1) {
    result.sunrise_steps.push(decodeZenithStep(dataView));
  }
  for (var i2 = 0; i2 < sunsetSteps; i2 += 1) {
    result.sunset_steps.push(decodeZenithStep(dataView));
  }
}

function decodeStatusConfig(dataView, result) {
  result.packet_type = 'status_config_packet';
  result.status_interval__s = dataView.getUint32();
}

function decodeDimmingStep(dataView) {
  var res = {};
  res.step_time = decodeStepTime(dataView.getUint8());

  res.dimming_level__percent = decodeDimmingLevel(dataView.getUint8(), 'inactive');
  return res;
}

function decodeProfileConfig(dataView, result, err) {
  result.packet_type = 'profile_config_packet';
  var len = profileParserPartial(dataView, result, err);
  result.dimming_steps = [];

  for (var i = 0; i < len; i += 1) {
    result.dimming_steps.push(decodeDimmingStep(dataView));
  }
}

function decodeTimeConfig(dataView, result, err) {
  result.packet_type = 'time_config_packet';

  var epoch = dataView.getUint32();
  if (epoch == 0) {
    result.device_unix_epoch = 'force_lorawan_devicetimereq';
  }
  else
  {
    result.device_unix_epoch = decodeUnixEpoch(epoch, err);
  }
}

function decodeUsageConfig(dataView, result) {
  result.packet_type = 'usage_config_packet';
  var interval = dataView.getUint32();
  var volt = dataView.getUint8();
  result.usage_interval__s = interval;
  if (volt !== 0xFF) {
    result.mains_voltage__V = volt;
  }
}

function decodeMonthDay(dataView) {
  // eslint-disable-next-line no-bitwise
  return pad(dataView.getUint8(), 2) + '/' + pad(dataView.getUint8(), 2);
}

function decodeHolidayConfig(dataView, result) {
  result.packet_type = 'holiday_config_packet';
  result.holidays = [];

  var len = dataView.getUint8();
  for (var i = 0; i < len; i += 1) {
    result.holidays.push(decodeMonthDay(dataView));
  }
}

function decodeDaliMonitorConfig(dataView, result) {
  var bits = dataView.getUint8Bits();
  result.packet_type = 'dali_monitor_config_packet';
  result.send_dali_alert = bits.getBits(1);
  result.correct_dali_dimming_level = bits.getBits(1);
  result.periodic_bus_scan_enabled = bits.getBits(1);

  var interval = dataView.getUint16();
  if (interval === 0) {
    result.monitoring_interval__s = 'disabled';
  } else {
    result.monitoring_interval__s = interval;
  }
}

function decodeFallbackDimConfig(dataView, result) {
  result.packet_type = 'fallback_dim_config_packet';
  result.fallback_dimming_level__percent = dataView.getUint8();
}

function decodeMulticastFcntConfig(dataView, result) {
  result.packet_type = 'multicast_fcnt_config_packet';
  result.multicast_device = dataView.getUint8();
  result.multicast_fcnt = dataView.getUint32();
}

function decodeBootDelayConfig(dataView, result) {
  result.packet_type = 'boot_delay_config_packet';
  var legacy = dataView.availableLen() === 1;
  var range = legacy ? dataView.getUint8() : dataView.getUint16();
  result.boot_delay_range__s = range;
}

function decodeFade(fade, err) {
  var lookup = [0.5, 0.71, 1.0, 1.41, 2.0, 2.83, 4.0, 5.66, 8.0, 11.31,
    16.0, 22.63, 32.0, 45.25, 64.0, 90.51];
  if (fade === 255) {
    return 'ignore';
  } else if (fade >= 16) {
    err.errors.push('invalid_fade');
    return 'invalid_fade';
  } else {
    return lookup[fade];
  }
}

function decodeLocationConfigV11(dataView, result) {
  result.packet_type = 'location_config_packet';

  var addressLen = dataView.getUint8();

  result.latitude__deg = dataView.getInt32() / 10000000.0;
  result.longitude__deg = dataView.getInt32() / 10000000.0;

  result.address = dataView.getTextUtf8(addressLen);
}

function decodeLumalinkMode(mode, err) {
  switch (mode) {
    case 0:
      return 'never_advertise';
    case 1:
      return 'first_commission';
    case 2:
      return 'every_boot';
    case 3:
      return 'always';
    default:
      err.errors.push('invalid_mode');
      return 'invalid_mode';
  }
}

function decodeLumalinkConfig(dataView, result, err) {
  result.packet_type = 'lumalink_config_packet';
  result.access_mode = decodeLumalinkMode(dataView.getUint8(), err);
}

function decodeLedConfig(dataView, result) {
  result.packet_type = 'onboard_led_config_packet';
  var l = dataView.getUint8Bits().getBits(1);
  result.status_led_enabled = l;
}

function alertParamConfig(value, naValue) {
  var val = value === naValue ? 'alert_off' : value;
  return val;
}

function decodeMeteringAlertConfig(dataView, result, err) {
  result.packet_type = 'metering_alert_config_packet';
  var header = dataView.getUint8();
  if (header !== 0x01) {
    err.errors.push('invalid_packet_type');
    return;
  }
  var minPower = dataView.getUint16();
  var maxPower = dataView.getUint16();
  var minVoltage = dataView.getUint16();
  var maxVoltage = dataView.getUint16();
  var minPf = dataView.getUint8();

  result.min_power__W = alertParamConfig(minPower, 0xFFFF);
  result.max_power__W = alertParamConfig(maxPower, 0xFFFF);
  result.min_voltage__V = alertParamConfig(minVoltage, 0xFFFF);
  result.max_voltage__V = alertParamConfig(maxVoltage, 0xFFFF);
  result.min_power_factor = minPf === 0xFF ? 'alert_off' : minPf / 100.0;
}

function decodeFadeConfig(dataView, result, err) {
  result.packet_type = 'fade_config_packet';
  result.fade_duration__s = decodeFade(dataView.getUint8(), err);
}

function decodeMulticastConfig(dataView, result, err) {
  result.packet_type = 'multicast_config_packet';
  var dev = dataView.getUint8();

  var invalidMc = dev > 3;
  if (invalidMc) {
    err.errors.push('invalid_multicast_device');
    return;
  }
  result.multicast_device = dev;
  result.devaddr = bytesToHexStr(dataView.getRaw(4).reverse());

  result.nwkskey = bytesToHexStr(dataView.getRaw(16));

  result.appskey = bytesToHexStr(dataView.getRaw(16));
}

function decodeClearConfig(dataView, result, err) {
  result.packet_type = 'clear_config_packet';
  switch (dataView.getUint8()) {
    case 0x21:
      result.reset_target = 'profile_config';
      result.address = addressParse(dataView.getUint8(), 'all_profiles', err);
      break;
    case 0x23:
      result.reset_target = 'holiday_config';
      break;
    case 0x28:
      result.reset_target = 'dig_input_config';
      break;
    case 0x29:
      result.reset_target = 'light_sensor_config';
      break;
    case 0x52:
      result.reset_target = 'multicast_config';
      var device = dataView.getUint8();
      result.multicast_device = device === 0xff ? 'all_multicast_devices' : 'multicast_device_' + device;
      break;
    case 0xFF:
      result.reset_target = 'factory_reset';
      result.device_serial = intToHexStr(dataView.getUint32(), 8);
      break;
    default:
      err.errors.push('invalid_clear_config_target');
  }
}

function decodeFport50(dataView, result, err) {
  var header = dataView.getUint8();
  switch (header) {
    case 0x01:
      decodeLdrConfig(dataView, result);
      return;
    case 0x03:
      decodeDigConfig(dataView, result, err);
      return;
    case 0x05:
      result.packet_type = 'open_drain_output_config_packet';
      result.switching_steps = [];
      while (dataView.availableLen()) {
        result.switching_steps.push(decodeOdRelaySwStep(dataView));
      }
      return;
    case 0x07:
      decodeStatusConfig(dataView, result);
      return;
    case 0x09:
      decodeTimeConfig(dataView, result, err);
      return;
    case 0x0B:
      decodeUsageConfig(dataView, result);
      return;
    case 0x0D:
      decodeBootDelayConfig(dataView, result);
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

    case 0x20:
      decodeCalendarConfigV11(dataView, result);
      return;
    case 0x21:
      decodeProfileConfig(dataView, result, err);
      return;
    case 0x22:
      decodeFadeConfig(dataView, result, err);
      return;
    case 0x23:
      decodeHolidayConfig(dataView, result);
      return;
    case 0x24:
      decodeDaliMonitorConfig(dataView, result);
      return;
    case 0x25:
      decodeFallbackDimConfig(dataView, result);
      return;
    case 0x26:
      decodeLocationConfigV11(dataView, result);
      return;
    case 0x27:
      decodeLumalinkConfig(dataView, result, err);
      return;
    case 0x28:
      decodeDigInputConfigNew(dataView, result, err);
      return;
    case 0x29:
      decodeLightSensorConfig(dataView, result, err);
      return;
    case 0x2A:
      decodeDimNotifyConfig(dataView, result);
      return;
    case 0x2B:
      decodeInterfaceTypeConfig(dataView, result, err);
      return;
    case 0x53:
      decodeMulticastFcntConfig(dataView, result);
      return;
    case 0xFE:
      result.packet_type = 'chained_config_packet';
      result.payloads = [];
      while (dataView.availableLen()) {
        var packet = {};
        decodeFport50(dataView, packet, err);
        result.payloads.push(packet);
      }
      return;
    default:
      err.errors.push('invalid_packet_type');
  }
}

function decodeDimming(dataView, err) {
  var result = {};
  result.address = addressParse(dataView.getUint8(), "all_devices", err);

  result.dimming_level__percent = decodeDimmingLevel(dataView.getUint8(), 'resume');
  return result;
}

function decodeDimmingCommand(dataView, result, err) {
  result.packet_type = 'manual_dimming';
  result.destination = [];
  while (dataView.availableLen()) {
    result.destination.push(decodeDimming(dataView, err));
  }
}

function decodeCustomDaliReq(dataView, result, err) {
  result.packet_type = 'custom_dali_request';

  var offset = dataView.offset;
  result.query_data_raw = bytesToHexStr(dataView.getRaw(dataView.availableLen()));
  // restore previous offset like the getRaw read never happened
  dataView.offset = offset;

  // if lengt is 2 then address+query, 3 then address+query+asnwer.
  // If length is more, we cant assume anything, because we dont know if its uplink or downlink.
  if (dataView.availableLen() > 3) {
    dataView.getRaw(dataView.availableLen());
    return;
  }

  var addr = dataView.getUint8();
  result.address = addressParse(addr, null, err);

  result.dali_query = dataView.getUint8();

  if (dataView.availableLen() === 1) {
    result.dali_response = dataView.getUint8();
  }
}

function decodeCustomDaliCommand(dataView, result) {
  result.packet_type = 'custom_dali_command';
  result.dali_command = bytesToHexStr(dataView.getRaw(dataView.availableLen()));
}

function decodeDimMap(dataView, err) {
  var result = {};
  result.address = addressParse(dataView.getUint8(), null, err);
  result.dali_min_level = dataView.getUint8();
  result.dali_max_level = dataView.getUint8();
  result.dimming_curve = dataView.getUint8() === 0 ? 'logarithmic' : 'linear';
  return result;
}

function decodeStatusRequest(dataView, result, err) {
  result.packet_type = 'status_usage_request';

  var bits = dataView.getUint8Bits();
  result.usage_requested = bits.getBits(1);
  result.status_requested = bits.getBits(1);
  result.dim_map_report_requested = bits.getBits(1);
  result.request_gnss_notification = bits.getBits(1);

  if (result.dim_map_report_requested && dataView.availableLen() > 0) {
    result.drivers = [];
    while (dataView.availableLen()) {
      result.drivers.push(decodeDimMap(dataView, err));
    }
  }
}

function decodeDriverMemoryPartial(dataView, result, err) {
  result.address = addressParse(dataView.getUint8(), null, err);

  result.memory_bank = dataView.getUint8();
  result.memory_address = dataView.getUint8();}

function decodeDriverMemoryPartialSized(dataView, result, err) {
  decodeDriverMemoryPartial(dataView, result, err);
  var size = dataView.getUint8();
  result.read_size__bytes = size;
  return size;
}

function decodeReadDriverMemory(dataView, result, err) {
  result.packet_type = 'driver_memory_read';
  if (dataView.availableLen() === 0) {
    err.warnings.push('driver_memory_read_failed');
    return;
  }

  var size = decodeDriverMemoryPartialSized(dataView, result, err);
  if (dataView.availableLen()) {
    var data = dataView.getRaw(size);
    result.memory_value = bytesToHexStr(data);
  }
}

function decodeWriteDriverMemory(dataView, result, err) {
  result.packet_type = 'driver_memory_write';
  if (dataView.availableLen() === 0) {
    err.warnings.push('driver_memory_write_failed');
    return;
  }

  decodeDriverMemoryPartial(dataView, result);
  result.memory_value = bytesToHexStr(dataView.getRaw(dataView.availableLen()));
}

function decodeTimedDimming(dataView, err) {
  var result = {};
  result.address = addressParse(dataView.getUint8(), "all_devices", err);

  result.dimming_level__percent = decodeDimmingLevel(dataView.getUint8(), 'resume');

  result.duration__minutes = dataView.getUint8();
  return result;
}

function decodeTimedDimmingCommand(dataView, result, err) {
  result.packet_type = 'manual_timed_dimming';
  result.destination = [];
  while (dataView.availableLen()) {
    result.destination.push(decodeTimedDimming(dataView, err));
  }
}

function decodeAddressDaliDriver(dataView, result, err) {
  result.packet_type = 'address_dali_driver';
  result.address = addressParse(dataView.getUint8(), 'rescan_dali_bus', err);
}

function decodeDaliIdentify(result) {
  result.packet_type = 'dali_identify';
}

function decodeOpenDrainSwitching(dataView, result) {
  result.packet_type = 'open_drain_output_control';
  result.open_drain_output_on = dataView.getUint8Bits().getBits(1);
}

function decodeFport60(dataView, result, err) {
  var header = dataView.getUint8();
  switch (header) {
    case 0x01:
      decodeDimmingCommand(dataView, result, err);
      return;
    case 0x03:
      decodeCustomDaliReq(dataView, result, err);
      return;
    case 0x04:
      decodeCustomDaliCommand(dataView, result);
      return;
    case 0x05:
      decodeStatusRequest(dataView, result, err);
      return;
    case 0x07:
      decodeReadDriverMemory(dataView, result, err);
      return;
    case 0x08:
      decodeWriteDriverMemory(dataView, result, err);
      return;
    case 0x09:
      decodeTimedDimmingCommand(dataView, result, err);
      return;
    case 0x0C:
      decodeOpenDrainSwitching(dataView, result);
      return;

    case 0x0A:
      decodeAddressDaliDriver(dataView, result, err);
      return;
    case 0x0B:
      decodeDaliIdentify(result);
      return;

    default:
      err.errors.push('invalid_command');
  }
}

function formatLightLx(lx) {
  var log10_val = Math.log10(lx);
  var log10_pos = log10_val >= 0 ? log10_val : 0;
  var log10_lim = log10_pos > 3 ? 3 : log10_pos;
  var decimals = 3 - Math.trunc(log10_lim);
  return lx.toFixed(decimals);
}
// DOWNLINK ONLY THINGS

function decodeFport49(dataView, result, err) {
  var header = dataView.getUint8();
  switch (header) {
    case 0x01:
      result.packet_type = 'deprecated_ldr_input_config_request';
      return;
    case 0x03:
      result.packet_type = 'deprecated_dig_input_config_request';
      return;
    case 0x07:
      result.packet_type = 'status_config_request';
      return;
    case 0x09:
      result.packet_type = 'time_config_packet';
      return;
    case 0x0B:
      result.packet_type = 'usage_config_request';
      return;
    case 0x0D:
      result.packet_type = 'boot_delay_config_request';
      return;
    case 0x15:
      result.packet_type = 'onboard_led_config_request';
      return;
    case 0x16:
      result.packet_type = 'metering_alert_confic_request';
      return;
    case 0x52:
      result.packet_type = 'multicast_config_request';
      var mcDevice = dataView.getUint8();
      result.multicast_device = mcDevice === 0xFF ? 'all' : mcDevice;
      return;
    case 0x20:
      result.packet_type = 'calendar_config_request';
      return;
    case 0x21:
      result.packet_type = 'profile_config_request';
      var pid = dataView.getUint8();
      result.profile_id = pid === 0xFF ? 'all_profiles' : pid;
      return;
    case 0x22:
      result.packet_type = 'fade_config_request';
      return;
    case 0x23:
      result.packet_type = 'holiday_config_request';
      return;
    case 0x24:
      result.packet_type = 'dali_monitor_config_request';
      return;
    case 0x25:
      result.packet_type = 'fallback_dim_config_request';
      return;
    case 0x26:
      result.packet_type = 'location_config_request';
      return;
    case 0x27:
      result.packet_type = 'lumalink_config_request';
      return;
    case 0x28:
      result.packet_type = 'dig_input_config_request';
      return;
    case 0x29:
      result.packet_type = 'light_input_config_request';
      return;
    case 0x2A:
      result.packet_type = 'dim_notify_config_request';
      return;
    case 0x2B:
      result.packet_type = 'interface_type_config_request';
      return;
    default:
      err.errors.push('invalid_packet_type');
  }
}

function decodeFport51(dataView, result, err) {
  var header = dataView.getUint8();
  switch (header) {
    case 0xFF:
      result.packet_type = 'activate_dfu_command';
      return;
    case 0xFE:
      result.packet_type = 'restart_controller_command';
      return;
    default:
      err.errors.push('invalid_command');
  }
}

function decodeByFport(fport, bytes, result, err) {
  var dataView = new BinaryExtract(bytes);
  if (dataView.availableLen() === 0) {
    err.errors.push('empty_payload');
  } else if (fport === 49) {
    decodeFport49(dataView, result, err);
  } else if (fport === 50) {
    decodeFport50(dataView, result, err);
  } else if (fport === 51) {
    decodeFport51(dataView, result, err);
  } else if (fport === 60) {
    decodeFport60(dataView, result, err);
  } else {
    err.errors.push('invalid_fport');
  }

  if (dataView.availableLen() !== 0) {
    err.errors.push('invalid_payload_length_long');
  }
}

function decodeRaw(fport, bytes) {
  var res = {};
  var err = { errors: [], warnings: [] };
  try {
    decodeByFport(fport, bytes, res, err);
  } catch (error) {
    err.errors.push("decoder_error " + error.message);
  }
  return { data: res, errors: err.errors, warnings: err.warnings };
}

// entry point for TTN new api
function decodeDownlink(input) {
  return decodeRaw(input.fPort, input.bytes);
}

// entry point for TTN new api
function encodeDownlink(input) {
  return rawEncode(input);
}


