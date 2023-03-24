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
function mbusStatus(status, err) {
  switch (status) {
    case 0:
      return 'connected';
    case 1:
      return 'nothing_requested';
    case 2:
      return 'bus_unpowered';
    case 3:
      return 'no_response';
    case 5:
      return 'crc_or_len_error';
    case 6:
      return 'parse_error';
    case 7:
      return 'bus_shorted';
    default:
      err.errors.push('invalid_mbus_status');
      return 'invalid_mbus_status';
  }
}

function usagePulseMediumType(medium, err) {
  switch (medium) {
    case 0:
      return 'triggers';
    case 1:
      return 'pulses';
    case 2:
      return 'L_water';
    case 3:
      return 'Wh_electricity';
    case 4:
      return 'L_gas';
    default:
      err.errors.push('invalid_medium');
      return 'invalid_medium';
  }
}

function serialFormat(serial) {
  if (serial === 0xFFFFFFFF) { return 'not_available'; }
  return intToHexStr(serial, 8);
}

function actualityDurationToMinutesFormat(actualityRaw) {
  if (actualityRaw < 60) { return actualityRaw; }
  if (actualityRaw < 156) { return (actualityRaw - 60) * 15; }
  if (actualityRaw < 200) { return (actualityRaw - 156) * 24 * 60; }
  if (actualityRaw < 253) { return (actualityRaw - 200) * 7 * 24 * 60; }
  if (actualityRaw === 253) { return 365 * 24 * 60; }
  return null;
}

function actualityDurationToFormatStr(actualityRaw) {
  var minutes = actualityDurationToMinutesFormat(actualityRaw);
  if (actualityRaw < 60) { return minutes + ' minutes'; }
  if (actualityRaw < 156) { return (minutes / 60).toFixed(2) + ' hours'; }
  if (actualityRaw < 200) { return (minutes / (60 * 24)).toFixed(2) + ' days'; }
  if (actualityRaw < 253) { return (minutes / (60 * 24 * 7)).toFixed(2) + ' weeks'; }
  if (actualityRaw === 253) { return (minutes / (60 * 24 * 365)).toFixed(2) + ' years'; }
  return null;
}

function usagePulseMultiplier(exp) {
  switch (exp) {
    case 0:
      return 1;
    case 1:
      return 10;
    case 2:
      return 100;
    case 3:
      return 1000;
    default:
      throw Error('invalid_multiplier');
  }
}

function pulseInputModeAndUnit(modeAndUnit, err) {
  switch (modeAndUnit) {
    case 0:
      return 'disabled';
    case 1:
      return 'pulses';
    case 2:
      return 'L_water';
    case 3:
      return 'Wh_electricity';
    case 4:
      return 'L_gas';
    case 9:
      return 'triggers_1_sec';
    case 10:
      return 'triggers_10_sec';
    case 11:
      return 'triggers_1_min';
    case 12:
      return 'triggers_1_h';
    default:
      err.errors.push('invalid_input_mode');
      throw Error('invalid_input_mode');
  }
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

function packetErrorReasonFormatter(reason, err) {
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
      err.errors.push('invalid_error_code');
      return 'invalid_error_code';
  }
}

function hardwareConfigFormat(hw, err) {
  switch (hw) {
    case 0x00:
      return 'pulse_only';
    case 0x01:
      return 'pulse_analog';
    case 0x02:
      return 'pulse_ssi';
    case 0x04:
      return 'pulse_mbus';
    case 0x06:
      return 'pulse_lbus';
    case 0x07:
      return 'pulse_izar';
    default:
      err.errors.push('invalid_hardware_config');
      return 'invalid_hardware_config';
  }
}

function shutdownReasonFormat(reason, err) {
  switch (reason) {
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
      err.errors.push('invalid_boot_packet_reason');
      return 'invalid_boot_packet_reason';
  }
}

function mbusMedium(medium) {
  switch (medium) {
    case 0x00:
      return 'other';
    case 0x01:
      return 'oil';
    case 0x02:
      return 'electricity';
    case 0x03:
      return 'gas';
    case 0x04:
      return 'heat (outlet vol)';
    case 0x05:
      return 'steam';
    case 0x06:
      return 'hot Water';
    case 0x07:
      return 'water';
    case 0x08:
      return 'heat cost allocator';
    case 0x09:
      return 'compressed air';
    case 0x0A:
    case 0x0B:
      return 'cooling load meter';
    case 0x0C:
      return 'heat (inlet vol)';
    case 0x0D:
      return 'heat / cooling load meter';
    case 0x0E:
      return 'bus / system';
    case 0x0F:
      return 'unknown';
    case 0x16:
      return 'cold water';
    case 0x17:
      return 'dual water';
    case 0x18:
      return 'pressure';
    case 0x19:
      return 'A/D converter';
    default:
      return 'unknown';
  }
}

function mbusManufacturer(mfgId) {
  // eslint-disable-next-line no-bitwise
  var out = String.fromCharCode(((mfgId >> 10) & 0x001F) + 64);
  // eslint-disable-next-line no-bitwise
  out += String.fromCharCode(((mfgId >> 5) & 0x001F) + 64);
  // eslint-disable-next-line no-bitwise
  out += String.fromCharCode(((mfgId) & 0x001F) + 64);
  return out;
}

function ssiSensor(status, err) {
  switch (status) {
    case 0:
      return 'disconnected';
    case 1:
      return 'pressure_30bar_temperature';
    default:
      err.errors.push('unknown_sensor_index');
      return 'unknown_sensor_index';
  }
}

// USAGE PAYLOAD
function pulseUsageParse(interfaceName, dataView, result, err) {
  var bits4 = dataView.getUint8Bits();
  result[interfaceName + '_input_state'] = bits4.getBits(1) === true ? 'closed' : 'open';
  var serialSent = bits4.getBits(1);
  var multiplier = usagePulseMultiplier(bits4.getBits(2));
  result['_' + interfaceName + '_muliplier'] = multiplier;
  var mediumType = usagePulseMediumType(bits4.getBits(4), err);
  result['_' + interfaceName + '_medium_type'] = mediumType;

  result[interfaceName + '_accumulated__' + mediumType] = dataView.getUint32() * multiplier;
  if (serialSent) {
    result[interfaceName + '_serial'] = serialFormat(dataView.getUint32());
  }
}

function usageAndStatusParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var deviceStatusSent = false;
  var packetType = dataView.getUint8();
  if (packetType === 0x02) {
    result._packet_type = 'usage_packet';
  } else if (packetType === 0x82) {
    result._packet_type = 'status_packet';
    deviceStatusSent = true;
  } else {
    err.errors.push('invalid_packet_type ' + packetType);
    return;
  }

  var bits1 = dataView.getUint8Bits();
  var activeAlerts = {};
  activeAlerts.pulse_1_trigger_alert = bits1.getBits(1);
  activeAlerts.pulse_2_trigger_alert = bits1.getBits(1);
  bits1.getBits(4);
  activeAlerts.low_battery = bits1.getBits(1);
  result._app_connected_within_a_day = bits1.getBits(1);
  result.active_alerts = objToList(activeAlerts);
  // TODO add to warnings

  if (deviceStatusSent) {
    result.battery_remaining__years = parseFloat((dataView.getUint8() / 12.0).toFixed(1));
    result._battery_voltage__V = dataView.getUint8() / 100.0 + 1.5;

    result.internal_temperature__C = dataView.getInt8();
    var bits5 = dataView.getUint8Bits();
    result._internal_temperature_min__C = bits5.getBits(4) * -2 + result.internal_temperature__C;
    result._internal_temperature_max__C = bits5.getBits(4) * 2 + result.internal_temperature__C;

    result.radio_downlink_rssi__dBm = -1 * dataView.getUint8();
    var bits6 = dataView.getUint8Bits();
    result._radio_downlink_snr__dB = bits6.getBits(4) * 2 - 20;
    result._radio_uplink_power__dBm = bits6.getBits(4) * 2;
  }

  var actuality = dataView.getUint8();
  result.meter_actuality_duration__minutes = actualityDurationToMinutesFormat(actuality);
  result.meter_actuality_duration_formatted = actualityDurationToFormatStr(actuality);

  var bits2 = dataView.getUint8Bits();
  var pulse1Sent = bits2.getBits(1);
  var pulse2Sent = bits2.getBits(1);
  var mainInterfaceSent = bits2.getBits(4);
  var mbusSent = mainInterfaceSent === 0x08;
  var ssiSent = mainInterfaceSent === 0x04;

  if (pulse1Sent) {
    pulseUsageParse('pulse_1', dataView, result, err);
  }
  if (pulse2Sent) {
    pulseUsageParse('pulse_2', dataView, result, err);
  }
  if (mbusSent) {
    var bits7 = dataView.getUint8Bits();
    result.mbus_last_status = mbusStatus(bits7.getBits(4), err);
    result._mbus_data_records_truncated = bits7.getBits(1);
    var stateAndSerialSent = bits7.getBits(1);

    if (stateAndSerialSent) {
      result.mbus_status = '0x' + intToHexStr(dataView.getUint8(), 2);
      result.mbus_serial = serialFormat(dataView.getUint32());
    }

    //        result.mbus_data_records = [];
    result.mbus_data_records_unparsed = '';
    while (dataView.offset < dataView.buffer.length) {
      result.mbus_data_records_unparsed += intToHexStr(dataView.getUint8(), 2);
    }
  }
  if (ssiSent) {
    var bits8 = dataView.getUint8Bits();
    result.ssi_sensor = ssiSensor(bits8.getBits(6), err);

    var bits9 = dataView.getUint8Bits();
    var ch1Inst = bits9.getBits(1);
    var ch1Avg = bits9.getBits(1);
    var ch2Inst = bits9.getBits(1);
    var ch2Avg = bits9.getBits(1);
    var ch3Inst = bits9.getBits(1);
    var ch3avg = bits9.getBits(1);
    var ch4Inst = bits9.getBits(1);
    var ch4Avg = bits9.getBits(1);

    if (ch1Inst) result.ssi_channel_1 = parseFloat(dataView.getFloat().toFixed(5));
    if (ch1Avg) result.ssi_channel_1_avg = parseFloat(dataView.getFloat().toFixed(5));
    if (ch2Inst) result.ssi_channel_2 = parseFloat(dataView.getFloat().toFixed(5));
    if (ch2Avg) result.ssi_channel_2_avg = parseFloat(dataView.getFloat().toFixed(5));
    if (ch3Inst) result.ssi_channel_3 = parseFloat(dataView.getFloat().toFixed(5));
    if (ch3avg) result.ssi_channel_3_avg = parseFloat(dataView.getFloat().toFixed(5));
    if (ch4Inst) result.ssi_channel_4 = parseFloat(dataView.getFloat().toFixed(5));
    if (ch4Avg) result.ssi_channel_4_avg = parseFloat(dataView.getFloat().toFixed(5));
  }
}

// CONFIGURATION PAYLOADS

function pulseConfigParse(interfaceName, dataView, result, err) {
  result[interfaceName + '_input_mode_and_unit'] = pulseInputModeAndUnit(dataView.getUint8Bits().getBits(4), err);

  var bits2 = dataView.getUint8Bits();
  var multiplierSent = bits2.getBits(1);
  var accumulatedAbsoluteSent = bits2.getBits(1);
  var accumulatedOffsetSent = bits2.getBits(1);
  var serialSent = bits2.getBits(1);
  bits2.getBits(2);
  var multiplier = usagePulseMultiplier(bits2.getBits(2));

  if (multiplierSent) {
    result[interfaceName + '_multiplier_numerator'] = dataView.getUint16();
    result[interfaceName + '_multiplier_denominator'] = dataView.getUint8();
  }
  if (accumulatedAbsoluteSent) {
    result[interfaceName + '_accumulated_absolute'] = dataView.getUint32() * multiplier;
  }
  if (accumulatedOffsetSent) {
    result[interfaceName + '_accumulated_offset'] = dataView.getInt32() * multiplier;
  }
  if (serialSent) {
    result[interfaceName + '_serial'] = serialFormat(dataView.getUint32());
  }
}

function generalConfigurationParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x12) { result._packet_type = 'general_configuration_packet'; } else {
    err.errors.push('invalid_configuration_type ' + packetType);
    return;
  }

  var bits1 = dataView.getUint8Bits();
  var radioLorawanProfileSent = bits1.getBits(1);
  var radioWmbusProfileSent = bits1.getBits(1);
  bits1.getBits(2);
  var pulse1Sent = bits1.getBits(1);
  var pulse2Sent = bits1.getBits(1);

  if (radioLorawanProfileSent) {
    result.radio_lorawan_profile = lorawanProfileFormat(dataView.getUint8(), err);
  }
  if (radioWmbusProfileSent) {
    result.radio_wmbus_profile = wmbusProfileFormat(dataView.getUint8(), err);
  }
  if (pulse1Sent) {
    pulseConfigParse('pulse_1', dataView, result, err);
  }
  if (pulse2Sent) {
    pulseConfigParse('pulse_2', dataView, result, err);
  }
}

function mbusConfigurationParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x14) { result._packet_type = 'mbus_configuration_packet'; } else {
    err.errors.push('invalid_configuration_type ' + packetType);
    return;
  }
  var bits1 = dataView.getUint8Bits();
  var usageCount = bits1.getBits(4);
  var statusCount = bits1.getBits(4);
  if (usageCount > 10 || statusCount > 10) {
    err.errors.push('invalid_usage_or_status_count');
    return;
  }
  result.mbus_data_record_headers_unparsed = '';
  while (dataView.offset < dataView.buffer.length) {
    result.mbus_data_record_headers_unparsed += intToHexStr(dataView.getUint8(), 2);
  }
}

function locationConfigurationParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x21) { result._packet_type = 'location_configuration_packet'; } else {
    err.errors.push('invalid_configuration_type ' + packetType);
    return;
  }
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
    var idCustomerLen = dataView.getUint8();
    result.id_customer = dataView.getTextUtf8(idCustomerLen);
  }
  if (configuredParams.id_location_sent) {
    var idLocationLen = dataView.getUint8();
    result.id_location = dataView.getTextUtf8(idLocationLen);
  }
}

// CONFIGURATION REQUESTS AND COMMANDS
function configurationRequestsParser(buffer, result, err) {
  var dataView = new BinaryExtract(buffer);

  var packetType = dataView.getUint8();
  if (packetType === 0x12) {
    result._packet_type = 'general_configuration_request';
  } else if (packetType === 0x14) {
    result._packet_type = 'mbus_configuration_request';
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
    if (result.device_local_time__s < startOf2020) { result.device_local_time_formatted = 'invalid'; }
  } else if (packetType === 0x81) {
    if (buffer.length === 1) {
      result._packet_type = 'mbus_available_data_records_request';
      return;
    }
    var bits = dataView.getUint8Bits();
    result._packet_number = bits.getBits(3);
    result._more_packets_following = bits.getBits(1);
    bits.getBits(2);
    var mbusHeaderSent = bits.getBits(1);

    if (mbusHeaderSent) {
      result._packet_type = 'mbus_available_data_records';
      result.mbus_header_serial = serialFormat(dataView.getUint32());
      result.mbus_header_manufacturer = mbusManufacturer(dataView.getUint16());
      result.mbus_header_version = '0x' + intToHexStr(dataView.getUint8(), 2);
      result.mbus_header_medium = mbusMedium(dataView.getUint8());
      result.mbus_header_access_number = dataView.getUint8();
      result.mbus_header_status = '0x' + intToHexStr(dataView.getUint8(), 2);
      var sig1 = intToHexStr(dataView.getUint8(), 2);
      var sig2 = intToHexStr(dataView.getUint8(), 2);
      result.mbus_header_signature = sig1 + sig2;
    }

    result.mbus_data_record_headers_unparsed = '';
    while (dataView.offset < dataView.buffer.length) {
      result.mbus_data_record_headers_unparsed += intToHexStr(dataView.getUint8(), 2);
    }
  } else if (packetType === 0xFF) { result._packet_type = 'enter_dfu_command'; } else {
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
    result.packet_error_reason = packetErrorReasonFormatter(dataView.getUint8(), err);
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
    // TODO add to alerts

    var bits2 = dataView.getUint8Bits();
    bits2.getBits(4);
    result.packet_reason = bootPacketReason(bits2.getBits(3), err);
    result.configuration_restored = bits2.getBits(1);

    result.hardware_configuration = hardwareConfigFormat(dataView.getUint8(), err);
    result.device_uptime_accumulated__days = parseFloat((dataView.getUint24() / 24.0).toFixed(2));
  } else if (packetType === 0x01) {
    var shutdownReason = shutdownReasonFormat(dataView.getUint8(), err);
    var bufferUsage = buffer.slice(2);
    usageAndStatusParser(bufferUsage, result);
    result._packet_type = 'shutdown_packet';
    result._shutdown_reason = shutdownReason;
  } else {
    err.errors.push('invalid_command_type ' + packetType);
  }
}

function checkFport(fport, expectedFport, err) {
  if (fport !== expectedFport) { err.errors.push('wrong fport or header'); }
}

function decodeByPacketHeader(fport, bytes, result, err) {
  if (bytes.length === 0) { err.errors.push('empty_payload'); } else if (bytes[0] === 0x02) {
    usageAndStatusParser(bytes, result, err);
    checkFport(fport, 25, err);
  } else if (bytes[0] === 0x82) {
    usageAndStatusParser(bytes, result, err);
    checkFport(fport, 24, err);
  } else if (bytes[0] === 0x12) {
    if (bytes.length === 1) {
      configurationRequestsParser(bytes, result, err);
      checkFport(fport, 49, err);
    } else {
      generalConfigurationParser(bytes, result, err);
      checkFport(fport, 50, err);
    }
  } else if (bytes[0] === 0x21) {
    if (bytes.length === 1) {
      configurationRequestsParser(bytes, result, err);
      checkFport(fport, 49, err);
    } else {
      locationConfigurationParser(bytes, result, err);
      checkFport(fport, 50, err);
    }
  } else if (bytes[0] === 0x14) {
    if (bytes.length === 1) {
      configurationRequestsParser(bytes, result, err);
      checkFport(fport, 49, err);
    } else {
      mbusConfigurationParser(bytes, result, err);
      checkFport(fport, 50, err);
    }
  } else if (bytes[0] === 0x03 || bytes[0] === 0x81 || bytes[0] === 0xFF) {
    commandParser(bytes, result, fport);
    if (bytes.length === 1) {
      checkFport(fport, 60, err);
    } else if (bytes[0] === 0x03) {
      checkFport(fport, 60, err);
    } else {
      checkFport(fport, 61, err);
    }
  } else if (bytes[0] === 0x00 || bytes[0] === 0x01 || bytes[0] === 0x13) {
    sysMessagesParser(bytes, result, err);
    checkFport(fport, 99, err);
  } else {
    err.errors.push('invalid_header');
  }
}

// eslint-disable-next-line import/prefer-default-export
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


