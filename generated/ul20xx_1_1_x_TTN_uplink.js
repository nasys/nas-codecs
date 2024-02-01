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
  result.alert_on_every_step = bits.getBits(1);
  result.clamp_profile = bits.getBits(1);
  result.clamp_dig = bits.getBits(1);
  result.interpolate_steps = bits.getBits(1);

  result.measurement_duration__s = dataView.getUint8();

  result.address = addressParse(dataView.getUint8(), "all_devices", err);

  result.dim_steps = [];
  while (dataView.availableLen()) {
    result.dim_steps.push(decodeLightDimStep(dataView));
  }
}

function decodeDimNotifyConfig(dataView, result, err){
  result.packet_type = 'dim_notify_config_packet';
  var rdly = dataView.getUint8();
  result.random_delay__s = rdly === 0xff ? 'disabled' : rdly * 5;
  result.packet_limit__s = dataView.getUint8() * 60;
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
  result.alert_on_activation = bits.getBits(1);
  result.alert_on_inactivation = bits.getBits(1);

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
  result.packet_type = 'fade_config_packet' ;
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
  result.multicast_device =  dev;
  result.devaddr = bytesToHexStr(dataView.getRaw(4).reverse());

  result.nwkskey = bytesToHexStr(dataView.getRaw(16));

  result.appskey =  bytesToHexStr(dataView.getRaw(16));
}

function decodeClearConfig(dataView, result, err) {
  result.packet_type = 'clear_config_packet';
  switch (dataView.getUint8()) {
    case 0x01:
      result.reset_target = 'ldr_input_config';
      break;
    case 0x03:
      result.reset_target = 'dig_input_config';
      break;
    case 0x21:
      result.reset_target = 'profile_config';
      result.address = addressParse(dataView.getUint8(), 'all_profiles', err);
      break;
    case 0x23:
      result.reset_target = 'holiday_config';
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
  result.read_size__bytes= size;
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
  result.packet_type = 'address_dali_driver' ;
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
    err.errors.push(error.message);
  }
  return { data: res, errors: err.errors, warnings: err.warnings };
}

// entry point for TTN new api
function decodeUplink(input) {
  return decodeRaw(input.fPort, input.bytes);
}


