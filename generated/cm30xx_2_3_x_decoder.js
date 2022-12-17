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

function objToList(obj) {
  var res = [];
  // eslint-disable-next-line no-restricted-syntax
  for (var key in obj) {
    if (obj[key] !== undefined && obj[key]) {
      res.push(key);
    }
  }
  return res;
}

// FORMATTER AND CONVERTER FUNCTIONS
function meterStatusFormat(status, err) {
  switch (status) {
    case 0:
      return 'connected';
    case 1:
      return 'no_response';
    case 2:
      return 'protocol_error';
    case 3:
      return 'meter_damaged';
    case 4:
      return 'protocol_error';
    case 5:
      return 'bus_shorted';
    default:
      err.errors.push('invalid_status');
      return 'invalid_status';
  }
}

function meterMultiplierConvert(exp) {
  if (exp < 3 || exp > 7) {
    return -1;
  }
  return 10 ** (exp - 6);
}

function meterMediumFormat(medium, err) {
  switch (medium) {
    case 0:
      return 'water';
    case 1:
      return 'warm_water';
    case 2:
      return 'gas';
    default:
      err.errors.push('invalid_medium');
      return 'invalid_medium';
  }
}

function meterUnitFormat(unit, err) {
  switch (unit) {
    case 0:
      return 'm3';
    case 1:
      return 'gal';
    case 2:
      return 'ft3';
    default:
      err.errors.push('invalid_unit');
      return 'invalid_unit';
  }
}

function serialFormat(serial) {
  if (serial === 0xFFFFFFFF) {
    return 'not_available';
  }
  return intToHexStr(serial, 8);
}

function actualityDurationToMinutesFormat(actualityRaw) {
  if (actualityRaw < 60) {
    return actualityRaw;
  }
  if (actualityRaw < 156) {
    return (actualityRaw - 60) * 15;
  }
  if (actualityRaw < 200) {
    return (actualityRaw - 156) * 24 * 60;
  }
  if (actualityRaw < 253) {
    return (actualityRaw - 200) * 7 * 24 * 60;
  }
  if (actualityRaw === 253) {
    return 365 * 24 * 60;
  }
  return null;
}

function actualityDurationToFormatStr(actualityRaw) {
  var minutes = actualityDurationToMinutesFormat(actualityRaw);
  if (actualityRaw < 60) {
    return minutes + ' minutes';
  }
  if (actualityRaw < 156) {
    return (minutes / 60).toFixed(2) + ' hours';
  }
  if (actualityRaw < 200) {
    return (minutes / (60 * 24)).toFixed(2) + ' days';
  }
  if (actualityRaw < 253) {
    return (minutes / (60 * 24 * 7)).toFixed(2) + ' weeks';
  }
  if (actualityRaw === 253) {
    return (minutes / (60 * 24 * 365)).toFixed(2) + ' years';
  }
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
      throw Error('invalid_multiplier');
  }
}

function volumeFormatUnit(volume, multiplier) {
  var decimalPlaces = multiplierToExponent(multiplier);
  var volScaled = decimalPlaces > 0 ? volume : volume / multiplier;
  var paddedStr = pad(volScaled.toFixed(0), decimalPlaces > 0 ? 8 + decimalPlaces : 8);
  if (decimalPlaces < 0) {
    paddedStr = paddedStr.substring(0, 8 + decimalPlaces) + '.' + paddedStr.substring(8 + decimalPlaces);
  }
  return paddedStr;
}

function lorawanProfileFormat(profile, err) {
  switch (profile) {
    case 0x00:
      return 'lorawan_disabled';
    case 0x01:
      return 'lorawan_24_h_privacy';
    case 0x02:
      return 'lorawan_24_h';
    case 0x03:
      return 'lorawan_12_h';
    case 0x07:
      return 'lorawan_1_h_static';
    case 0x08:
      return 'lorawan_15_min_static';
    case 0x17:
      return 'lorawan_1_h_dynamic';
    case 0x18:
      return 'lorawan_15_min_dynamic';
    default:
      err.errors.push('invalid_lorawan_profile');
      return 'invalid_lorawan_profile';
  }
}

function wmbusProfileFormat(profile, err) {
  switch (profile) {
    case 0x00:
      return 'wmbus_disabled';
    case 0x01:
      return 'wmbus_privacy';
    case 0x02:
      return 'wmbus_driveby';
    case 0x03:
      return 'wmbus_fixnet';
    default:
      err.errors.push('invalid_wmbus_profile');
      return 'invalid_wmbus_profile';
  }
}

function packetErrorReasonFormatter(reason) {
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
    default:
      return 'invalid_error_code';
  }
}

function hardwareConfigFormat(hw, err) {
  switch (hw) {
    case 0x00:
      return 'Modularis';
    case 0x01:
      return 'Cyble';
    case 0x02:
      return 'Falcon_PR';
    case 0x03:
      return 'Picoflux';
    case 0x04:
      return 'Falcon_MJ';
    case 0x06:
      return 'RCM_LMx';
    case 0x20:
      return 'BK_G';
    default:
      err.errors.push('invalid_hardware_config');
      return 'invalid_hardware_config';
  }
}

function shutdownReasonFormat(reason, err) {
  switch (reason) {
    case 0x10:
      return 'calibration_timeout';
    case 0x31:
      return 'magnet_shutdown';
    case 0x32:
      return 'enter_dfu';
    case 0x33:
      return 'app_shutdown';
    case 0x34:
      return 'switch_to_wmbus';
    default:
      err.errors.push('invalid_shutdown_reason');
      return 'invalid_shutdown_reason';
  }
}

function bootPacketReason(reason, err) {
  switch (reason) {
    case 0:
      return 'unknown_reset';
    case 1:
      return 'from_shutdown';
    case 2:
      return 'from_dfu';
    case 3:
      return 'froced_reset';
    case 4:
      return 'lorawan_rejoin';
    default:
      err.errors.push('invalid_packet_reason');
      return 'invalid_packet_reason';
  }
}

// USAGE PAYLOAD
function usageParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x04) {
    result._packet_type = 'usage_packet';
  } else {
    err.errors.push('invalid_packet_type ' + packetType);
    return;
  }

  var activeAlerts = {};
  var bits1 = dataView.getUint8Bits();
  activeAlerts.backflow_pending = bits1.getBits(1);
  activeAlerts.broken_pipe_pending = bits1.getBits(1);
  activeAlerts.continuous_flow_pending = bits1.getBits(1);
  activeAlerts.tamper_pending = bits1.getBits(1);
  activeAlerts.temperature_pending = bits1.getBits(1);
  activeAlerts.low_battery = bits1.getBits(1);
  activeAlerts.no_usage = bits1.getBits(1);
  // TODO add to warnings
  // var anyAlertActiveNow = bits1.getBits(1);
  result.active_alerts = objToList(activeAlerts);

  result.meter_status = meterStatusFormat(dataView.getUint8(), err);

  var bits2 = dataView.getUint8Bits();
  result._meter_multiplier = meterMultiplierConvert(bits2.getBits(3));
  if (result._meter_multiplier < 0) {
    err.errors.push('invalid_multiplier');
    return;
  }
  result._meter_medium = meterMediumFormat(bits2.getBits(2), err);
  result._meter_unit = meterUnitFormat(bits2.getBits(2), err);
  var privacyModeActive = bits2.getBits(1);

  var actuality = dataView.getUint8();
  result.meter_actuality_duration__minutes = actualityDurationToMinutesFormat(actuality);
  result.meter_actuality_duration_formatted = actualityDurationToFormatStr(actuality);

  result['meter_accumulated_volume__' + result._meter_unit] = volumeFormatUnit(result._meter_multiplier * dataView.getUint32(), result._meter_multiplier);

  if (privacyModeActive) {
    var bits3 = dataView.getUint8Bits();
    var day = bits3.getBits(5);
    var yearLower = bits3.getBits(3);
    var bits4 = dataView.getUint8Bits();
    var month = bits4.getBits(4);
    var yearUpper = bits4.getBits(4);
    var year = 2000 + yearLower + 8 * yearUpper;
    var date = new Date();
    date.setUTCFullYear(year);
    date.setUTCMonth(month);
    date.setUTCDate(day);
    // eslint-disable-next-line prefer-destructuring
    result.meter_readout_date = date.toISOString().split(/[T ]/i, 1)[0];
  }

  var bits5 = dataView.getUint8Bits();
  result._app_connected_within_a_day = bits5.getBits(1);
  var deviceStatusSent = bits5.getBits(1);

  if (deviceStatusSent) {
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
function generalConfigurationParser(dataView, result, err) {
  result._packet_type = 'general_configuration_packet';

  var configuredParameters = {};
  var bits1 = dataView.getUint8Bits();
  configuredParameters.radio_lorawan_profile_sent = bits1.getBits(1);
  configuredParameters.radio_wmbus_profile_sent = bits1.getBits(1);
  configuredParameters.meter_serial_sent = bits1.getBits(1);
  configuredParameters.meter_multiplier_sent = bits1.getBits(1);
  configuredParameters.meter_volume_sent = bits1.getBits(1);
  configuredParameters.meter_volume_offset_sent = bits1.getBits(1);
  configuredParameters.meter_nominal_flow_sent = bits1.getBits(1);
  configuredParameters.alert_backflow_sent = bits1.getBits(1);

  var bits2 = dataView.getUint8Bits();
  configuredParameters.alert_broken_pipe_sent = bits2.getBits(1);
  configuredParameters.alert_continuous_flow_sent = bits2.getBits(1);
  configuredParameters.alert_no_usage_sent = bits2.getBits(1);
  configuredParameters.alert_tamper_sent = bits2.getBits(1);
  configuredParameters.alert_temperature_sent = bits2.getBits(1);

  if (configuredParameters.radio_lorawan_profile_sent) {
    result.radio_lorawan_profile = lorawanProfileFormat(dataView.getUint8(), err);
  }
  if (configuredParameters.radio_wmbus_profile_sent) {
    result.radio_wmbus_profile = wmbusProfileFormat(dataView.getUint8(), err);
  }
  if (configuredParameters.meter_serial_sent) {
    result.meter_serial = serialFormat(dataView.getUint32());
  }
  result.meter_unit = '';
  if (configuredParameters.meter_multiplier_sent) {
    var bits3 = dataView.getUint8Bits();
    result.meter_multiplier = meterMultiplierConvert(bits3.getBits(3));
    result.meter_medium = meterMediumFormat(bits3.getBits(2), err);
    result.meter_unit = meterUnitFormat(bits3.getBits(2), err);
    result.privacy_mode_active = bits3.getBits(1);
  }

  var unitPost = result.meter_unit !== '' ? '__' + result.meter_unit : '';
  if (configuredParameters.meter_volume_sent) {
    result['meter_accumulated_volume' + unitPost] = dataView.getUint64() / 1000.0;
  }
  if (configuredParameters.meter_volume_offset_sent) {
    result['meter_accumulated_volume_offset' + unitPost] = dataView.getInt32() / 1000.0;
  }
  if (configuredParameters.meter_nominal_flow_sent) {
    result['meter_nominal_flow' + unitPost] = dataView.getUint16() / 10.0;
  }
  if (configuredParameters.alert_backflow_sent) {
    var valBkThr = dataView.getUint16();
    result['alert_backflow_threshold' + unitPost] = valBkThr === 0 ? 'disabled' : valBkThr / 1000.0;
  }
  if (configuredParameters.alert_broken_pipe_sent) {
    var valBrThr = dataView.getUint32();
    result['alert_broken_pipe_threshold' + unitPost] = valBrThr === 0 ? 'disabled' : valBrThr / 1000.0;
  }
  if (configuredParameters.alert_continuous_flow_sent) {
    result.alert_continuous_flow_enabled = Boolean(dataView.getUint8());
  }
  if (configuredParameters.alert_no_usage_sent) {
    var valDays = dataView.getUint16();
    result.alert_no_usage_interval__days = valDays === 0 ? 'disabled' : valDays;
  }
  if (configuredParameters.alert_tamper_sent) {
    result.alert_tamper_enabled = Boolean(dataView.getUint8());
  }
  if (configuredParameters.alert_temperature_sent) {
    var low = dataView.getInt8();
    result.alert_temperature_threshold_low__C = low === -128 ? 'disabled' : low;
    var high = dataView.getInt8();
    result.alert_temperature_threshold_high__C = high === -128 ? 'disabled' : high;
  }
}

function locationConfigurationParser(dataView, result) {
  result._packet_type = 'location_configuration_packet';

  var configuredParams = {};
  var bits1 = dataView.getUint8Bits();
  configuredParams.gps_position_sent = bits1.getBits(1);
  configuredParams.time_zone_sent = bits1.getBits(1);
  configuredParams.address_sent = bits1.getBits(1);
  configuredParams.id_customer_sent = bits1.getBits(1);
  configuredParams.id_location_sent = bits1.getBits(1);

  if (configuredParams.gps_position_sent) {
    result.gps_position_latitude__deg = dataView.getInt32() / 10000000.0;
    result.gps_position_longitude__deg = dataView.getInt32() / 10000000.0;
  }
  if (configuredParams.time_zone_sent) {
    result.time_zone__h = dataView.getInt8() / 4.0;
  }
  if (configuredParams.address_sent) {
    var addressLen = dataView.getUint8();
    result.address = dataView.getTextUtf8(addressLen);
  }
  if (configuredParams.id_customer_sent) {
    var idCustLen = dataView.getUint8();
    result.id_customer = dataView.getTextUtf8(idCustLen);
  }
  if (configuredParams.id_location_sent) {
    var idLocLen = dataView.getUint8();
    result.id_location = dataView.getTextUtf8(idLocLen);
  }
}

function configurationParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x20) {
    generalConfigurationParser(dataView, result, err);
  } else if (packetType === 0x21) {
    locationConfigurationParser(dataView, result);
  } else {
    err.errors.push('invalid_configuration_type ' + packetType);
  }
}

// CONFIGURATION REQUESTS AND COMMANDS
function configurationRequestsParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x20) {
    result._packet_type = 'general_configuration_request';
  } else if (packetType === 0x21) {
    result._packet_type = 'location_configuration_request';
  } else {
    err.errors.push('invalid_request_type ' + packetType);
  }
}

function commandParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x03) {
    if (buffer.length === 1) {
      result._packet_type = 'local_time_request';
      return;
    }
    result._packet_type = 'local_time_response';
    result.device_local_time__s = dataView.getUint32();

    var date = new Date(result.device_local_time__s * 1000);
    result.device_local_time_formatted = date.toISOString().replace(/.\d+Z$/g, 'Z');
    var startOf2020 = 1577836800;
    if (result.device_local_time__s < startOf2020) {
      result.device_local_time_formatted = 'invalid';
    }
  } else if (packetType === 0xFF) {
    result._packet_type = 'enter_dfu_command';
  } else {
    err.errors.push('invalid_command_type ' + packetType);
  }
}

// SYSTEM MESSAGES
function sysMessagesParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x13) {
    result._packet_type = 'faulty_downlink_packet';
    result.packet_fport = dataView.getUint8();
    result.packet_error_reason = packetErrorReasonFormatter(dataView.getUint8());
    err.warnings.push('faulty_downlink_packet: ' + result.packet_error_reason);
  } else if (packetType === 0x00) {
    result._packet_type = 'boot_packet';
    result.device_serial = serialFormat(dataView.getUint32());

    result.device_firmware_version = dataView.getUint8().toString() + '.' + dataView.getUint8() + '.' + dataView.getUint8();

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
    result.wakeup_reason_mcu = objToList(reason);
    // TODO add to warnings

    var bits2 = dataView.getUint8Bits();
    bits2.getBits(4);
    result.packet_reason = bootPacketReason(bits2.getBits(3), err);
    result.configuration_restored = bits2.getBits(1);

    result.hardware_configuration = hardwareConfigFormat(dataView.getUint8(), err);
    dataView.getUint8();
    dataView.getUint8();
    result.device_uptime_accumulated__days = parseFloat((dataView.getUint24() / 24.0).toFixed(2));
  } else if (packetType === 0x01) {
    var shutdownReason = shutdownReasonFormat(dataView.getUint8(), err);
    var bufferUsage = buffer.slice(2);
    usageParser(bufferUsage, result, err);
    result._packet_type = 'shutdown_packet';
    result._shutdown_reason = shutdownReason;
  } else {
    err.errors.push('invalid_sys_msg_type ' + packetType);
  }
}

function checkFport(fport, expectedFport, err) {
  if (fport !== expectedFport) {
    err.errors.push('wrong fport or header');
  }
}

function decodeByPacketHeader(fport, bytes, result, err) {
  if (bytes.length === 0) {
    err.errors.push('empty_payload');
  } else if (bytes[0] === 0x04) {
    usageParser(bytes, result, err);
    checkFport(fport, 25, err);
  } else if (bytes[0] === 0x20 || bytes[0] === 0x21) {
    if (bytes.length === 1) {
      configurationRequestsParser(bytes, result, err);
      checkFport(fport, 49, err);
    } else {
      configurationParser(bytes, result, err);
      checkFport(fport, 50, err);
    }
  } else if (bytes[0] === 0x03 || bytes[0] === 0xFF) {
    commandParser(bytes, result, err);
    checkFport(fport, 60, err);
  } else if (bytes[0] === 0x00 || bytes[0] === 0x01 || bytes[0] === 0x13) {
    sysMessagesParser(bytes, result, err);
    checkFport(fport, 99, err);
  } else {
    err.errors.push('invalid_header');
  }
  return result;
}

function decodeRaw(fport, bytes) {
  var res = {};
  var err = { errors: [], warnings: [] };
  try {
    decodeByPacketHeader(fport, bytes, res, err);
  } catch (error) {
    err.errors.push(error.message);
  }
  //  res._raw_payload = bytesToHexStr(bytes);
  var out = { data: res };
  if (err.errors.length) {
    out.errors = err.errors;
  }
  if (err.warnings.length) {
    out.warnings = err.warnings;
  }
  return out;
}

// Functions for post-proccessing the cm30xx and um30xx decoder result

function extractUnitFromKey(key) {
  // key with unit looks like "meter_accumulated_volume__m3"
  var spl = key.split('__');
  var unit = spl.length > 1 ? spl[1] : '';
  if (unit === 'C') { unit = unit.replace('C', '°C'); }
  unit = unit.replace('_', '/');
  unit = unit.replace('3', '³');
  unit = unit.replace('deg', '°');
  return unit;
}

function formatElementStrValueUnit(keyPrintable, value, formattedValue, unit) {
  if (formattedValue) {
    return formattedValue;
  }
  var res = value.toString();
  if (unit.length > 0) {
    var floatVal = +(res);
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(floatVal)) {
      // only add unit if it is value
      res = res + ' ' + unit;
    }
  }
  return res.split('_').join(' '); // workaround for missing replaceAll in ES5
}

function convertToFormatted(decoded, elementFormatter, outIsList) {
  var dataOrig = decoded.data;
  var converted = outIsList ? [] : {};
  for (var key in dataOrig) {
    if (key.split('_formatted').length > 1) {
      // key containing '_formatted' must have its pair, so skip _formatted
      // e.g. with 'actuality_duration__formatted' also must exist e.g. 'actuality_duration__minutes'
      continue;
    }
    var paramName = key.split('__')[0];
    var value = dataOrig[key];

    var formattedValue = null;
    if (paramName + '_formatted' in dataOrig) {
      formattedValue = dataOrig[paramName + '_formatted'];
    }

    var unit = extractUnitFromKey(key);

    var keyPrintable = paramName;
    var isHiddenParam = paramName[0] === '_';
    if (isHiddenParam) {
      // remove first underscore (that signifies less important parameters)
      keyPrintable = keyPrintable.slice(1);
    }

    var element = elementFormatter(keyPrintable, value, formattedValue, unit);

    if (outIsList) { converted.push(element); } else { converted[keyPrintable] = element; }
  }
  decoded.data = converted; // decoded may still contain warnings and errors.
  return decoded;
}

// Change formatElementStrValueUnit to formatElementStrValue if only values are needed
// If raw formatting is desired, just return directly from decodeRaw() function
// You need only one entrypoint, others can be removed.


// entry point for TTN new api
function decodeDownlink(input) {
    var dec = decodeRaw(input.fPort, input.bytes);
    return convertToFormatted(dec, formatElementStrValueUnit, false);
}

// entry point for TTN new api
function decodeUplink(input) {
    var dec = decodeRaw(input.fPort, input.bytes);
    return convertToFormatted(dec, formatElementStrValueUnit, false);
}

// entry point for TTN old version
function Decoder(bytes, fport) {
    var dec = decodeRaw(fport, bytes);
    return convertToFormatted(dec, formatElementStrValueUnit, false);
}

// entry point for Chirpstack
function Decode(fport, bytes) {
    var dec = decodeRaw(fport, bytes);
    return convertToFormatted(dec, formatElementStrValueUnit, false);
}


