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
      for (;extra > 0; extra -= 1) {
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
  var mask = 2 ** lengthBits - 1;
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
  return sign * significand * 2 ** exponent;
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

function bitFalseTrue(bit) {
  return { value: !!bit };
}

function profileOverrideReason(reason) {
  switch (reason) {
    case 246:
      return 'driver_not_found';
    case 247:
      return 'calendar_active';
    case 248:
      return 'init_active';
    case 249:
      return 'profile_not_active';
    case 250:
      return 'ldr_active';
    case 251:
      return 'thr_active';
    case 252:
      return 'dig_active';
    case 253:
      return 'manual_active';
    case 254:
      return 'value_differ';
    case 255:
      return 'unknown';
    default:
      return 'none';
  }
}

function daliAddressParse(addr, ffStr, err) {
  if (addr === 0xFE) {
    return { value: 'broadcast', raw: addr };
  }
  if (addr === 0xFF) {
    if (ffStr) {
      return { value: ffStr, raw: addr };
    }
    err.warnings.push('invalid_dali_address');
    return { value: 'invalid', raw: addr };
  }
  // eslint-disable-next-line no-bitwise
  if (addr & 0x01) {
    err.warnings.push('invalid_dali_address');
    return { value: 'invalid', raw: addr };
  }
  // eslint-disable-next-line no-bitwise
  if (addr & 0x80) {
    // eslint-disable-next-line no-bitwise
    return { value: 'group ' + ((addr >> 1) & 0xF).toString(), raw: addr };
  }

  // eslint-disable-next-line no-bitwise
  return { value: 'single ' + ((addr >> 1) & 0x3F).toString(), raw: addr };
}

function profileParserPartial(dataView, profile, err) {
  var id = dataView.getUint8();
  var ver = dataView.getUint8();
  var addr = dataView.getUint8();
  var activeDays = dataView.getUint8();

  profile.profile_id = { value: id === 255 ? 'no_profile' : id, raw: id };

  profile.profile_version = { value: ver > 240 ? 'n/a' : ver, raw: ver };

  profile.profile_override = { value: profileOverrideReason(ver), raw: ver };

  profile.dali_address_short = daliAddressParse(addr, null, err);

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
  profile.days_active = { value: days, raw: activeDays };
}

function decodeUnixEpoch(epoch) {
  var date = new Date(epoch * 1000);
  var epochFormatted = date.toISOString();
  if (epoch < 946684800) { // before 2000-01-01
    epochFormatted = 'invalid_timestamp';
  } else if (epoch < 1420070400) { // between 2000-01-01 and 2015-01-01
    // ISO Period format. E.g. "P0003-06-04T12:30:05"
    epochFormatted = 'P' + pad(date.getUTCFullYear() - 2000, 4) + '-' + pad(date.getUTCMonth(), 2) + '-' + pad(date.getUTCDate() - 1, 2) + 'T' + pad(date.getUTCHours(), 2) + ':' + pad(date.getUTCMinutes(), 2) + ':' + pad(date.getUTCSeconds(), 2);
  }
  return { value: epochFormatted, raw: epoch };
}

function decodeLdrConfig(dataView, result) {
  result.packet_type = { value: 'ldr_config_packet' };

  var high = dataView.getUint8();
  result.switch_threshold_high = { value: high === 0xFF ? 'disabled' : high, raw: high };

  var low = dataView.getUint8();
  result.switch_threshold_low = { value: low === 0xFF ? 'disabled' : low, raw: low };

  var behaviorBits = dataView.getUint8Bits();
  behaviorBits.getBits(2);
  result.switch_trigger_alert_enabled = bitFalseTrue(behaviorBits.getBits(1));
}

function decodeDigConfig(dataView, result, err) {
  result.packet_type = { value: 'dig_config_packet' };

  var time = dataView.getUint16();
  result.switch_time = { value: time === 0xFFFF ? 'disabled' : time, raw: time, unit: 's' };

  var behaviorBits = dataView.getUint8Bits();
  behaviorBits.getBits(1);
  var edge = behaviorBits.getBits(1);
  result.switch_transition = { value: edge ? 'enabled' : 'disabled', raw: edge };
  result.switch_trigger_alert_enabled = bitFalseTrue(behaviorBits.getBits(1));

  var addr = dataView.getUint8();
  result.dali_address_short = daliAddressParse(addr, null, err);

  var level = dataView.getUint8();
  result.dimming_level = { value: level, unit: '%' };
}

function decodeStepTime(inByte, result) {
  var minTotal = inByte * 10;
  var hour = Math.trunc(minTotal / 60);
  var mn = minTotal - hour * 60;
  result.step_time = { value: pad(hour, 2) + ':' + pad(mn, 2), raw: minTotal };
}

function decodeOdRelaySwStep(dataView) {
  var res = {};

  decodeStepTime(dataView.getUint8(), res);

  var state = dataView.getUint8() !== 0;
  res.open_drain_out_state = bitFalseTrue(state);
  return res;
}

function decodeCalendarConfig(dataView, result) {
  result.packet_type = { value: 'calendar_config_packet' };

  var sunrise = dataView.getInt8();
  var sunset = dataView.getInt8();
  var lat = dataView.getInt16() / 100;
  var lon = dataView.getInt16() / 100;

  var clear = sunrise === -1 && sunset === -1;

  result.sunrise_offset = { value: clear ? 'disabled' : sunrise, unit: 'min', raw: sunrise };
  result.sunset_offset = { value: clear ? 'disabled' : sunset, unit: 'min', raw: sunset };

  result.latitude = { value: lat, unit: '°' };
  result.longitude = { value: lon, unit: '°' };
}

function decodeStatusConfig(dataView, result) {
  result.packet_type = { value: 'status_config_packet' };
  var interval = dataView.getUint32();
  result.staus_interval = { value: interval, unit: 's' };
}

function decodeDimmingStep(dataView) {
  var time = dataView.getUint8();
  var lvl = dataView.getUint8();
  var res = {};
  decodeStepTime(time, res);

  res.dimming_level = { value: lvl, unit: '%' };
  return res;
}

function decodeProfileConfig(dataView, result, err) {
  result.packet_type = { value: 'profile_config_packet' };
  profileParserPartial(dataView, result, err);
  result.dimming_steps = [];
  while (dataView.availableLen()) {
    result.dimming_steps.push(decodeDimmingStep(dataView));
  }
}

function decodeTimeConfig(dataView, result) {
  result.packet_type = { value: 'time_config_packet' };

  var epoch = dataView.getUint32();
  result.device_unix_epoch = decodeUnixEpoch(epoch);
}

function decodeLegacyDefaultsConfig(dataView, result) {
  result.packet_type = { value: 'legacy_defaults_config_packet' };

  var dim = dataView.getUint8();
  result.default_dim = { value: dim, unit: '%' };

  var alerts = dataView.getUint8Bits();
  result.ldr_alert_enabled = bitFalseTrue(alerts.getBits(1));
  alerts.getBits(1);
  result.dig_alert_enabled = bitFalseTrue(alerts.getBits(1));
  result.dali_alert_enabled = bitFalseTrue(alerts.getBits(1));
}

function decodeUsageConfig(dataView, result) {
  result.packet_type = { value: 'usage_config_packet' };
  var interval = dataView.getUint32();
  var volt = dataView.getUint8();
  result.usage_interval = { value: interval, unit: 's' };
  result.mains_voltage = { value: volt, unit: 'V' };
}

function decodeHolidayConfig(dataView, result) {
  result.packet_type = { value: 'holiday_config_packet' };
  result.holidays = [];
  while (dataView.availableLen()) {
    var month = dataView.getUint8();
    var day = dataView.getUint8();
    // eslint-disable-next-line no-bitwise
    result.holidays.push({ value: pad(month, 2) + '-' + pad(day, 2), raw: (month << 8) | day });
  }
}

function decodeBootDelayConfig(dataView, result) {
  result.packet_type = { value: 'boot_delay_config_packet' };
  var legacy = dataView.availableLen() === 1;
  var range = legacy ? dataView.getUint8() : dataView.getUint16();
  result.boot_delay_range = { value: range, unit: 's' };
}

function decodeFade(fade) {
  var lookup = [0.5, 0.71, 1.0, 1.41, 2.0, 2.83, 4.0, 5.66, 8.0, 11.31,
    16.0, 22.63, 32.0, 45.25, 64.0, 90.51];
  var val = fade > 16 ? 'invalid_fade' : lookup[fade];
  if (fade === 255) val = 'ignore';
  return { value: val, unit: 's', raw: fade };
}

function decodeDefaultsConfig(dataView, result) {
  result.packet_type = { value: 'defaults_config_packet' };
  var bits = dataView.getUint8Bits();
  var dim = bits.getBits(1);
  var maxDim = bits.getBits(1);
  var fade = bits.getBits(1);
  var sunsetMode = bits.getBits(1);
  var legacyMode = bits.getBits(1);
  if (dim) {
    var d = dataView.getUint8();
    result.default_dim = { value: d, unit: '%' };
  }
  if (maxDim) {
    var md = dataView.getUint8();
    result.max_dim = { value: md === 0xff ? 'default' : md, unit: '%', raw: md };
  }
  if (fade) {
    var f = dataView.getUint8();
    result.fade_duration = decodeFade(f);
  }
  if (sunsetMode) {
    var s = dataView.getUint8Bits().getBits(1);
    result.switch_point_sunset = { value: s ? 'sunset' : 'twilight', raw: s };
  }
  if (legacyMode) {
    var l = dataView.getUint8Bits().getBits(1);
    result.legacy_mode_enabled = bitFalseTrue(l);
  }
}

function decodeLocationConfig(dataView, result) {
  result.packet_type = { value: 'location_config_packet' };

  var bits1 = dataView.getUint8Bits();
  var positionSent = bits1.getBits(1);
  var addressSent = bits1.getBits(1);

  if (positionSent) {
    result.position_latitude = { value: dataView.getInt32() / 10000000.0, unit: '°' };
    result.position_longitude = { value: dataView.getInt32() / 10000000.0, unit: '°' };
  }
  if (addressSent) {
    var addressLen = dataView.getUint8();
    result.address = { value: dataView.getTextUtf8(addressLen) };
  }
}

function decodeLedConfig(dataView, result) {
  result.packet_type = { value: 'led_config_packet' };
  var l = dataView.getUint8Bits().getBits(1);
  result.status_led_enabled = bitFalseTrue(l);
}

function alertParamConfig(value, naValue, unit) {
  var val = value === naValue ? 'alert_off' : value;
  var res = { value: val, raw: value };
  if (unit) res.unit = value === naValue ? '' : unit;
  return res;
}

function decodeMeteringAlertConfig(dataView, result, err) {
  result.packet_type = { value: 'metering_alert_config_packet' };
  var header = dataView.getUint8();
  if (header !== 0x01) {
    err.errors.push('invalid_header');
    return;
  }
  var minPower = dataView.getUint16();
  var maxPower = dataView.getUint16();
  var minVoltage = dataView.getUint16();
  var maxVoltage = dataView.getUint16();
  var minPf = dataView.getUint8();

  result.min_power = alertParamConfig(minPower, 0xFFFF, 'W');
  result.max_power = alertParamConfig(maxPower, 0xFFFF, 'W');
  result.min_voltage = alertParamConfig(minVoltage, 0xFFFF, 'V');
  result.max_voltage = alertParamConfig(maxVoltage, 0xFFFF, 'V');
  result.min_power_factor = { value: minPf === 0xFF ? 'alert_off' : minPf / 100.0, raw: minPf };
}

function decodeMulticastConfig(dataView, result, err) {
  result.packet_type = { value: 'multicast_config_packet' };
  var dev = dataView.getUint8();
  if (dev === 0 || dev > 4) {
    err.errors.push('invalid_multicast_device');
    return;
  }
  result.multicast_device = { value: dev };
  var devaddr = dataView.getRaw(4).reverse();
  result.device_address = { value: bytesToHexStr(devaddr) };

  var nwkskey = dataView.getRaw(16);
  result.network_security_key = { value: bytesToHexStr(nwkskey) };

  var appskey = dataView.getRaw(16);
  result.application_security_key = { value: bytesToHexStr(appskey) };
}

function decodeClearConfig(dataView, result, err) {
  result.packet_type = { value: 'clear_config_packet' };
  var typ = dataView.getUint8();
  switch (typ) {
    case 0x01:
      result.reset_target = 'ldr_config';
      break;
    case 0x03:
      result.reset_target = 'dig_config';
      break;
    case 0x04:
      result.reset_target = 'profile_config';
      var addr = dataView.getUint8();
      result.dali_address_short = daliAddressParse(addr, 'all_profiles', err);
      if (dataView.availableLen()) {
        var id = dataView.getUint8();
        result.profile_id = { value: id === 0xFF ? 'all_used_profiles' : id, raw: id };
      }
      break;
    case 0x06:
      result.reset_target = 'holiday_config';
      break;
    case 0x52:
      result.reset_target = 'multicast_config';
      var device = dataView.getUint8();
      result.multicast_device = { value: device === 0xff ? 'all_multicast_devices' : device, raw: device };
      break;
    case 0xFF:
      result.reset_target = 'factory_reset';
      var ser = dataView.getRaw(4);
      result.device_serial = { value: bytesToHexStr(ser) };
      break;
    default:
      err.errors.push('invalid_clear_config_target');
  }
}

function decodeFport50(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);
  var header = dataView.getUint8();
  switch (header) {
    case 0x01:
      decodeLdrConfig(dataView, result);
      return;
    case 0x03:
      decodeDigConfig(dataView, result, err);
      return;
    case 0x05:
      result.packet_type = { value: 'open_drain_out_config_packet' };
      result.switching_steps = [];
      while (dataView.availableLen()) {
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
      err.errors.push('invalid_header');
  }
}

function decodeDaliStatus(dataView, err) {
  var result = {};
  var addr = dataView.getUint8();
  result.dali_address_short = daliAddressParse(addr, null, err);

  var stat = dataView.getUint8Bits();
  var controlGearFailure = stat.getBits(1);
  result.control_gear_failure = bitFalseTrue(controlGearFailure);
  var lampFailure = stat.getBits(1);
  result.lamp_failure = bitFalseTrue(lampFailure);
  result.lamp_on = bitFalseTrue(stat.getBits(1));
  var limitError = stat.getBits(1);
  result.limit_error = bitFalseTrue(limitError);
  result.fade_running = bitFalseTrue(stat.getBits(1));
  result.reset_state = bitFalseTrue(stat.getBits(1));
  result.short_address = bitFalseTrue(stat.getBits(1));
  result.power_cycle_seen = bitFalseTrue(stat.getBits(1));

  var alerts = [];
  if (controlGearFailure) alerts.push('control gear failure');
  if (lampFailure) alerts.push('lamp failure');
  if (limitError) alerts.push('limit error');
  if (alerts.length) {
    err.errors.push('Dali address: ' + result.dali_address_short.value + ' errors: ' + alerts.join(', '));
  }
  return result;
}

function decodeDaliStatusReq(dataView, result, err) {
  result.packet_type = { value: 'dali_status_request' };
  if (dataView.availableLen() === 1) {
    var addr = dataView.getUint8();
    if (addr === 0xFE) {
      result.dali_address_short = { value: 'all_drivers', raw: addr };
    } else {
      result.dali_address_short = daliAddressParse(addr, null, err);
    }
  } else {
    result.dali_statuses = [];
    while (dataView.availableLen()) {
      result.dali_statuses.push(decodeDaliStatus(dataView, err));
    }
  }
}

function decodeDimming(dataView, err) {
  var result = {};
  var addr = dataView.getUint8();
  result.dali_address_short = daliAddressParse(addr, null, err);

  var level = dataView.getUint8();
  result.dimming_level = { value: level === 0xFF ? 'resume' : level, unit: '%', raw: level };
  return result;
}

function decodeDimmingCommand(dataView, result, err) {
  result.packet_type = { value: 'manual_dimming_command' };
  result.manual_commands = [];
  while (dataView.availableLen()) {
    result.manual_commands.push(decodeDimming(dataView, err));
  }
}

function decodeCustomDaliReq(dataView, result, err) {
  result.packet_type = { value: 'custom_dali_request' };

  var { offset } = dataView;
  result.custom_dali_data = { value: bytesToHexStr(dataView.getRaw(dataView.availableLen())) };
  // restore previous offset like the getRaw read never happened
  dataView.offset = offset;

  // if lengt is 2 then address+query, 3 then address+query+asnwer.
  // If length is more, we cant assume anything.
  if (dataView.availableLen() > 3) {
    return;
  }

  var addr = dataView.getUint8();
  result.dali_address_short = daliAddressParse(addr, null, err);

  var query = dataView.getUint8();
  result.dali_query = { value: query };

  if (dataView.availableLen() === 1) {
    var ans = dataView.getUint8();
    result.dali_answer = { value: ans };
  }
}

function decodeCustomDaliCommand(dataView, result) {
  result.packet_type = { value: 'custom_dali_command' };

  var data = dataView.getRaw(dataView.availableLen());
  result.dali_command = { value: bytesToHexStr(data) };
}

function decodeStatusRequest(dataView, result) {
  result.packet_type = { value: 'status_or_usage_request' };

  var bits = dataView.getUint8Bits();
  result.usage_requested = bitFalseTrue(bits.getBits(1));
  result.status_requested = bitFalseTrue(bits.getBits(1));
}

function decodeDigVal(val) {
  if (val === 0x00) return 'off';
  if (val === 0x01) return 'on';
  if (val === 0xFF) return 'n/a';
  return 'invalid_value';
}

function decodeInterfacesRequest(dataView, result, err) {
  if (dataView.availableLen() === 1) {
    result.packet_type = { value: 'interface_request' };
    return;
  }

  result.packet_type = { value: 'interface_request' };
  var dig = dataView.getUint8();
  var digVal = dataView.getUint8();
  var ldr = dataView.getUint8();
  var ldrVal = dataView.getUint8();
  var thr = dataView.getUint8();
  dataView.getUint8();
  var relay = dataView.getUint8();
  var relayBits = dataView.getUint8Bits();
  if (dig !== 0x01 || ldr !== 0x02 || thr !== 0x03 || relay !== 0x04) {
    err.errors.push('invalid_interface');
    return;
  }

  result.dig = { value: decodeDigVal(digVal), raw: digVal };
  result.ldr = { value: ldrVal === 0xFF ? 'n/a' : ldrVal, raw: ldrVal };
  // thr deprecated
  result.main_relay_state = bitFalseTrue(relayBits.getBits(1));
  result.open_drain_out_state = bitFalseTrue(relayBits.getBits(1));
}

function decodeDriverMemoryPartial(dataView, result, err) {
  var addr = dataView.getUint8();
  result.dali_address_short = daliAddressParse(addr, null, err);

  var bank = dataView.getUint8();
  result.memory_bank = { value: bank };

  var memAddr = dataView.getUint8();
  result.memory_address = { value: memAddr };
}

function decodeDriverMemoryPartialSized(dataView, result, err) {
  decodeDriverMemoryPartial(dataView, result, err);
  var size = dataView.getUint8();
  result.read_size = { value: size, unit: 'bytes' };
  return size;
}

function decodeReadDriverMemory(dataView, result, err) {
  result.packet_type = { value: 'driver_memory_read' };
  if (dataView.availableLen() === 0) {
    err.warnings.push('driver_memory_read_failed');
    return;
  }

  var size = decodeDriverMemoryPartialSized(dataView, result, err);
  if (dataView.availableLen()) {
    var data = dataView.getRaw(size);
    result.memory_value = { value: bytesToHexStr(data) };
  }
}

function decodeWriteDriverMemory(dataView, result, err) {
  result.packet_type = { value: 'driver_memory_write' };
  if (dataView.availableLen() === 0) {
    err.warnings.push('driver_memory_write_failed');
    return;
  }

  decodeDriverMemoryPartial(dataView, result);
  var data = dataView.getRaw(dataView.availableLen());
  result.memory_value = { value: bytesToHexStr(data) };
}

function decodeTimedDimming(dataView, err) {
  var result = {};
  var addr = dataView.getUint8();
  result.dali_address_short = daliAddressParse(addr, null, err);

  var lvl = dataView.getUint8();
  result.dimming_level = { value: lvl, unit: '%' };

  var dur = dataView.getUint8();
  result.duration = { value: dur, unit: 'min' };
  return result;
}

function decodeTimedDimmingCommand(dataView, result, err) {
  result.packet_type = { value: 'timed_dimming_command' };
  result.timed_commands = [];
  while (dataView.availableLen()) {
    result.timed_commands.push(decodeTimedDimming(dataView, err));
  }
}

function decodeOpenDrainSwitching(dataView, result) {
  result.packet_type = { value: 'open_drain_out_control' };
  var sw = dataView.getUint8Bits().getBits(1);
  result.open_drain_out_state = bitFalseTrue(sw);
}

function decodeFport60(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);
  var header = dataView.getUint8();
  switch (header) {
    case 0x00:
      decodeDaliStatusReq(dataView, result, err);
      return;
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
      decodeStatusRequest(dataView, result);
      return;
    case 0x06:
      decodeInterfacesRequest(dataView, result, err);
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
    default:
      err.errors.push('invalid_command');
  }
}

// UPLINK ONLY THINGS

function profileParser(dataView, err) {
  var profile = {};
  profileParserPartial(dataView, profile, err);

  var level = dataView.getUint8();
  profile.dimming_level = {
    value: level, unit: '%', min: 0, max: 100,
  };
  return profile;
}

function statusParser(buffer, result, err) {
  // does not support legacy mode status packet!
  var dataView = new BinaryExtract(buffer);

  result.packet_type = { value: 'status_packet' };

  var epoch = dataView.getUint32();
  result.device_unix_epoch = decodeUnixEpoch(epoch);

  var statusField = {};
  var bits = dataView.getUint8Bits();

  var daliErrExt = bits.getBits(1);
  statusField.dali_error_external = bitFalseTrue(daliErrExt);
  if (daliErrExt) err.warnings.push('dali external error reported by status packet');

  var daliErrConn = bits.getBits(1);
  statusField.dali_error_connection = bitFalseTrue(daliErrConn);
  if (daliErrConn) err.errors.push('dali connection error reported by status packet');

  statusField.ldr_state = bitFalseTrue(bits.getBits(1));
  bits.getBits(1);
  statusField.dig_state = bitFalseTrue(bits.getBits(1));
  statusField.hardware_error = bitFalseTrue(bits.getBits(1));
  statusField.firmware_error = bitFalseTrue(bits.getBits(1));
  statusField.internal_relay_state = bitFalseTrue(bits.getBits(1));
  result.status_field = statusField;

  result.downlink_rssi = { value: -1 * dataView.getUint8(), unit: 'dBm' };

  result.downlink_snr = { value: dataView.getInt8(), unit: 'dB' };

  result.mcu_temperature = { value: dataView.getInt8(), unit: '°C' };

  var thrSent = false;
  var ldrSent = false;
  var analogInterfaces = {};
  var bits2 = dataView.getUint8Bits();
  thrSent = bits2.getBits(1);
  ldrSent = bits2.getBits(1);
  analogInterfaces.open_drain_out_state = bitFalseTrue(bits2.getBits(1));
  bits2.getBits(1);
  analogInterfaces.voltage_alert_in_24h = bitFalseTrue(bits2.getBits(1));
  analogInterfaces.lamp_error_alert_in_24h = bitFalseTrue(bits2.getBits(1));
  analogInterfaces.power_alert_in_24h = bitFalseTrue(bits2.getBits(1));
  analogInterfaces.power_factor_alert_in_24h = bitFalseTrue(bits2.getBits(1));
  result.analog_interfaces = analogInterfaces;

  if (thrSent) {
    result.thr_value = { value: dataView.getUint8() };
  }
  if (ldrSent) {
    result.ldr_value = { value: dataView.getUint8() };
  }

  result.profiles = [];
  while (dataView.availableLen()) {
    result.profiles.push(profileParser(dataView, err));
  }
}

function usageConsumptionParse(dataView, err) {
  var result = {};
  var addr = dataView.getUint8();
  result.dali_address_short = daliAddressParse(addr, 'internal_measurement', err);

  var bits = dataView.getUint8Bits();
  if (bits.getBits(1)) {
    result.active_energy_total = { value: dataView.getUint32(), unit: 'Wh' };
  }
  if (bits.getBits(1)) {
    result.active_energy_instant = { value: dataView.getUint16(), unit: 'W' };
  }
  if (bits.getBits(1)) {
    result.load_side_energy_total = { value: dataView.getUint32(), unit: 'Wh' };
  }
  if (bits.getBits(1)) {
    result.load_side_energy_instant = { value: dataView.getUint16(), unit: 'W' };
  }
  if (bits.getBits(1)) {
    result.power_factor_instant = { value: dataView.getUint8() / 100 };
  }
  if (bits.getBits(1)) {
    result.mains_voltage = { value: dataView.getUint8(), unit: 'V' };
  }
  if (bits.getBits(1)) {
    result.driver_operating_time = { value: dataView.getUint32(), unit: 's' };
  }
  if (bits.getBits(1)) {
    result.lamp_on_time = { value: dataView.getUint32(), unit: addr === 0xFF ? 'h' : 's' };
  }
  return result;
}

function usageParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  result.packet_type = { value: 'usage_packet' };

  result.reports = [];
  while (dataView.availableLen()) {
    result.reports.push(usageConsumptionParse(dataView, err));
  }
}

function deviceConfigParser(config, err) {
  switch (config) {
    case 0:
      return 'dali';
    case 1:
      return 'dali_nc';
    case 2:
      return 'dali_no';
    case 3:
      return 'analog_nc';
    case 4:
      return 'analog_no';
    case 5:
      return 'dali_analog_nc';
    case 6:
      return 'dali_analog_no';
    case 7:
      return 'dali_analog_nc_no';
    default:
      err.errors.push('invalid_device_config');
      return 'invalid_config';
  }
}

function optionalFeaturesParser(byte) {
  var res = [];
  var bits = new BitExtract(byte);
  bits.getBits(1);
  if (bits.getBits(1)) {
    res.push('thr');
  }
  if (bits.getBits(1)) {
    res.push('dig');
  }
  if (bits.getBits(1)) {
    res.push('ldr');
  }
  if (bits.getBits(1)) {
    res.push('open_drain_out');
  }
  if (bits.getBits(1)) {
    res.push('metering');
  }
  bits.getBits(1);
  if (bits.getBits(1)) {
    res.push('custom_request');
  }
  return res;
}

function daliInfoParse(data, err) {
  var supply = data;
  if (supply < 0x70) {
    return { value: supply, raw: supply, unit: 'V' };
  }
  switch (data) {
    case 0x7E:
      return { value: 'bus_high', raw: supply };
    case 0x7f:
      err.warnings.push('dali supply state: error');
      return { value: 'dali_error', raw: supply };
    default:
      return { value: 'invalid_value', raw: supply };
  }
}

function resetReasonParse(byte) {
  var res = [];
  var bits = new BitExtract(byte);
  if (bits.getBits(1)) {
    res.push('reset_0');
  }
  if (bits.getBits(1)) {
    res.push('watchdog_reset');
  }
  if (bits.getBits(1)) {
    res.push('soft_reset');
  }
  if (bits.getBits(1)) {
    res.push('reset_3');
  }
  if (bits.getBits(1)) {
    res.push('reset_4');
  }
  if (bits.getBits(1)) {
    res.push('reset_5');
  }
  if (bits.getBits(1)) {
    res.push('reset_6');
  }
  if (bits.getBits(1)) {
    res.push('reset_7');
  }
  return res;
}

function bootParser(dataView, result, err) {
  result.packet_type = { value: 'boot_packet' };

  result.device_serial = intToHexStr(dataView.getUint32(), 8);

  var maj = dataView.getUint8();
  var min = dataView.getUint8();
  var patch = dataView.getUint8();

  // eslint-disable-next-line no-bitwise
  result.firmware_version = { value: maj + '.' + min + '.' + patch, raw: (maj << 16) | (min << 8) | patch };

  var epoch = dataView.getUint32();
  result.device_unix_epoch = decodeUnixEpoch(epoch);

  var config = dataView.getUint8();
  result.device_config = { value: deviceConfigParser(config, err), raw: config };

  var opt = dataView.getUint8();
  result.optional_features = { value: optionalFeaturesParser(opt), raw: opt };

  var daliBits = dataView.getUint8Bits();
  result.dali_supply_state = daliInfoParse(daliBits.getBits(7), err);
  var busPower = daliBits.getBits(1);
  result.dali_power_source = { value: busPower ? 'external' : 'internal', raw: busPower };

  var driver = dataView.getUint8Bits();
  result.dali_addressed_driver_count = { value: driver.getBits(7) };
  var unadressed = driver.getBits(1);
  result.dali_unadressed_driver_found = bitFalseTrue(unadressed);

  if (dataView.availableLen()) {
    var resetReas = dataView.getUint8();
    result.reset_reason = { value: resetReasonParse(resetReas), raw: resetReas };
  }
}

function errorCodeParser(reason) {
  switch (reason) {
    case 0x00:
      return 'n/a';
    case 0x01:
      return 'n/a';
    case 0x02:
      return 'unknown_fport';
    case 0x03:
      return 'packet_size_short';
    case 0x04:
      return 'packet_size_long';
    case 0x05:
      return 'value_error';
    case 0x06:
      return 'protocol_parse_error';
    case 0x07:
      return 'reserved_flag_set';
    case 0x08:
      return 'invalid_flag_combination';
    case 0x09:
      return 'unavailable_feature_request';
    case 0x0A:
      return 'unsupported_header';
    case 0x0B:
      return 'unreachable_hw_request';
    case 0x0C:
      return 'address_not_available';
    case 0x0D:
      return 'internal_error';
    case 0x0E:
      return 'packet_size_error';
    case 128:
      return 'no_room';
    case 129:
      return 'id_seq_error';
    case 130:
      return 'destination_eror';
    case 131:
      return 'days_error';
    case 132:
      return 'step_count_error';
    case 133:
      return 'step_value_error';
    case 134:
      return 'step_unsorted';
    case 135:
      return 'days_overlap';
    default:
      return 'invalid_error_code';
  }
}

function configFailedParser(dataView, result, err) {
  result.packet_type = { value: 'invalid_downlink_packet' };
  result.packet_from_fport = { value: dataView.getUint8() };
  var errCode = dataView.getUint8();
  var error = errorCodeParser(errCode);
  result.parse_error_code = { value: error, raw: errCode };
  err.errors.push('Config failed: ' + error);
}

function decodeFport99(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);
  var header = dataView.getUint8();
  switch (header) {
    case 0x00:
      bootParser(dataView, result, err);
      return;
    case 0x13:
      configFailedParser(dataView, result, err);
      return;
    default:
      err.errors.push('invalid_header');
  }
}

function decodeFport61(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);
  var header = dataView.getUint8();
  var rawByte2 = dataView.getUint8();
  // eslint-disable-next-line no-bitwise
  var len = rawByte2 >> 4;
  switch (header) {
    case 0x80:
      result.packet_type = { value: 'dig_alert' };
      if (len !== 2) {
        err.errors.push('invalid_packet_length');
        return;
      }
      var cnt = dataView.getUint16();
      result.dig_alert_counter = { value: cnt };
      return;
    case 0x81:
      result.packet_type = { value: 'ldr_alert' };
      if (len !== 2) {
        err.errors.push('invalid_packet_length');
        return;
      }
      var state = dataView.getUint8Bits().getBits(1);
      var val = dataView.getUint8();
      result.ldr_state = bitFalseTrue(state);
      result.ldr_value = { value: val };
      return;
    case 0x83:
      result.packet_type = { value: 'dali_driver_alert' };
      result.drivers = [];
      while (dataView.availableLen()) {
        result.drivers.push(decodeDaliStatus(dataView, err));
      }
      return;
    case 0x84:
      result.packet_type = { value: 'metering_alert' };
      var cond = new BitExtract(rawByte2);

      var lampError = cond.getBits(1);
      var overCurrent = cond.getBits(1);
      var underVoltage = cond.getBits(1);
      var overVoltage = cond.getBits(1);
      var lowPowerFactor = cond.getBits(1);

      result.lamp_error_alert = bitFalseTrue(lampError);
      result.over_current_alert = bitFalseTrue(overCurrent);
      result.under_voltage_alert = bitFalseTrue(underVoltage);
      result.over_voltage_alert = bitFalseTrue(overVoltage);
      result.low_power_factor_alert = bitFalseTrue(lowPowerFactor);

      var conditions = [];
      if (lampError) conditions.push('lamp_error');
      if (overCurrent) conditions.push('over_current');
      if (underVoltage) conditions.push('under_voltage');
      if (overVoltage) conditions.push('over_voltage');
      if (lowPowerFactor) conditions.push('low_power_factor');
      if (conditions.length) {
        err.warnings.push('Metering alerts: ' + conditions.join(', '));
      }

      var pw = dataView.getUint16();
      result.power = { value: pw, unit: 'W' };

      var volt = dataView.getUint16();
      result.voltage = { value: volt, unit: 'V' };

      var pf = dataView.getUint8() / 100;
      result.power_factor = { value: pf };
      return;
    default:
      err.errors.push('invalid_header');
  }
}

// DOWNLINK ONLY THINGS

function decodeFport49(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);
  var header = dataView.getUint8();
  switch (header) {
    case 0x01:
      result.packet_type = { value: 'ldr_config_request' };
      return;
    case 0x02:
      result.packet_type = { value: 'thr_config_request' };
      return;
    case 0x03:
      result.packet_type = { value: 'dig_config_request' };
      return;
    case 0x05:
      result.packet_type = { value: 'open_drain_out_config_request' };
      return;
    case 0x06:
      result.packet_type = { value: 'calendar_config_request' };
      return;
    case 0x07:
      result.packet_type = { value: 'status_config_request' };
      return;
    case 0x08:
      result.packet_type = { value: 'profile_config_request' };
      var id = dataView.getUint8();
      result.profile_id = { value: id === 0xFF ? 'all_used_profiles' : id, raw: id };
      return;
    case 0x0A:
      result.packet_type = { value: 'default_dim_config_request' };
      return;
    case 0x0B:
      result.packet_type = { value: 'usage_config_request' };
      return;
    case 0x0C:
      result.packet_type = { value: 'holiday_config_request' };
      return;
    case 0x0D:
      result.packet_type = { value: 'boot_delay_config_request' };
      return;
    case 0x0E:
      result.packet_type = { value: 'defaults_config_request' };
      return;
    case 0x13:
      result.packet_type = { value: 'meta_pos_config_request' };
      return;
    case 0x15:
      result.packet_type = { value: 'led_config_request' };
      return;
    case 0x16:
      result.packet_type = { value: 'metering_alert_confic_request' };
      return;
    case 0x52:
      result.packet_type = { value: 'multicast_config_request' };
      result.multicast_device = { value: dataView.getUint8() };
      return;
    default:
      err.errors.push('invalid_header');
  }
}

function decodeFport51(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);
  var header = dataView.getUint8();
  switch (header) {
    case 0xFF:
      result.packet_type = { value: 'activate_dfu_command' };
      return;
    default:
      err.errors.push('invalid_command');
  }
}

function decodeByFport(fport, bytes, result, err) {
  if (bytes.length === 0) { err.errors.push('empty_payload'); } else if (fport === 24) { statusParser(bytes, result, err); } else if (fport === 25) { usageParser(bytes, result, err); } else if (fport === 49) { decodeFport49(bytes, result, err); } else if (fport === 50) { decodeFport50(bytes, result, err); } else if (fport === 51) { decodeFport51(bytes, result, err); } else if (fport === 60) { decodeFport60(bytes, result, err); } else if (fport === 61) { decodeFport61(bytes, result, err); } else if (fport === 99) { decodeFport99(bytes, result, err); } else { err.errors.push('invalid_fport'); }
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

// Functions for post-proccessing the ul20xx decoder result

function formatElementStrValueUnit(value, unit) {
  var res = value.toString();
  if (unit.length > 0) {
    var floatVal = +(res);
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(floatVal)) {
      // only add unit if it is value
      res = res + ' ' + unit;
    }
  }
  return res;
}

function convertObjRecursive(element, elementFormatter) {
  if (element.constructor === Object) {
    // is dictionary

    if ('value' in element) {
      var val = element.value;
      var unit = 'unit' in element ? element.unit : '';
      return elementFormatter(val, unit);
    }

    var output1 = {};
    // eslint-disable-next-line no-restricted-syntax
    for (var key in element) {
      if (element[key] !== undefined && element[key]) {
        output1[key] = convertObjRecursive(element[key], elementFormatter);
      }
    }
    return output1;
  }
  if (element instanceof Array) {
    // is array
    var output2 = [];
    element.forEach((item) => {
      output2.push(convertObjRecursive(item, elementFormatter));
    });
    return output2;
  }
  return element;
}

function convertObjToFormatted(decoded, elementFormatter) {
  var converted = {};
  // eslint-disable-next-line no-restricted-syntax
  for (var key in decoded) {
    if (decoded[key] !== undefined && decoded[key]) {
      converted[key] = convertObjRecursive(decoded[key], elementFormatter);
    }
  }
  return converted;
}

// Change formatElementStrValueUnit to formatElementStrValue if only values are needed
// If raw formatting is desired, just return directly from decodeRaw() function
// You need only one entrypoint, others can be removed.


// entry point for TTN new api
function decodeDownlink(input) {
    var dec = decodeRaw(input.fPort, input.bytes);
    return convertObjToFormatted(dec, formatElementStrValueUnit);
}

// entry point for TTN new api
function decodeUplink(input) {
    var dec = decodeRaw(input.fPort, input.bytes);
    return convertObjToFormatted(dec, formatElementStrValueUnit);
}

// entry point for TTN old version
function Decoder(bytes, fport) {
    var dec = decodeRaw(fport, bytes);
    return convertObjToFormatted(dec, formatElementStrValueUnit);
}

// entry point for Chirpstack
function Decode(fport, bytes) {
    var dec = decodeRaw(fport, bytes);
    return convertObjToFormatted(dec, formatElementStrValueUnit);
}


