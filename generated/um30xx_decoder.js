function BitExtract(data_byte) {
  // BINARY EXTRACTING UTILITIES - Many workarounds here are only because Dataview and other newer features are not available in ES5 (required by chirpstack).
  // basically a class (which is not directly supported in ES5)
  this.data = data_byte;
  this.offset = 0;
}

  BitExtract.prototype._assertOnRemainingLength = function(length_bits) {
      if(length_bits === 0)
          throw Error("invalid zero length bit field");
      if(this.offset + length_bits > 8)
          throw Error("invalid number of bits extracted");
  };

  BitExtract.prototype.getBits = function(length_bits) {
      this._assertOnRemainingLength(length_bits);
      var mask = Math.pow(2, length_bits) - 1;
      var res = (this.data >> this.offset) & mask;
      this.offset += length_bits;
      return length_bits == 1 ? Boolean(res) : res; 
  };

function BinaryExtract(buffer) {
  // everything is little-endian for now
  this.buffer = buffer;
  this.offset = 0;
}

  BinaryExtract.prototype.availableLen = function() {
      return this.buffer.length - this.offset;
  };

  BinaryExtract.prototype._assertOnRemainingLength = function(length) {
      if(length > this.availableLen())
          throw Error("invalid buffer length: too short");
  };

  BinaryExtract.prototype.getUint8 = function() {
      this._assertOnRemainingLength(1);
      return this.buffer[this.offset++];
  };

  BinaryExtract.prototype.getInt8 = function() {
      var res = this.getUint8();
      return res > 0x7F ? res - 0x100 : res;
  };

  BinaryExtract.prototype.getUint16 = function() {
      this._assertOnRemainingLength(2);
      var res = this.buffer[this.offset++] +
          this.buffer[this.offset++] * 256;
      return res;
  };

  BinaryExtract.prototype.getInt16 = function() {
      var res = this.getUint16();
      return res > 0x7FFF ? res - 0x10000 : res;
  };

  BinaryExtract.prototype.getUint24 = function() {
      this._assertOnRemainingLength(3);
      var res = this.buffer[this.offset++] +
          this.buffer[this.offset++] * 256 + 
          this.buffer[this.offset++] * 65536;
      return res;
  };

  BinaryExtract.prototype.getUint32 = function() {
      this._assertOnRemainingLength(4);
      var res = this.buffer[this.offset++] +
          this.buffer[this.offset++] * 256 + 
          this.buffer[this.offset++] * 65536 +
          this.buffer[this.offset++] * 16777216;
      return res;
  };

  BinaryExtract.prototype.getInt32 = function() {
      var res = this.getUint32();
      return res > 0x7FFFFFFF ? res - 0x100000000 : res;
  };

  BinaryExtract.prototype.getUint64 = function() {
      var first = this.getUint32();
      var second = this.getUint32();
      var res = first + second * 0x100000000; // since double can safely represent needed range, its used MAX_SAFE_INTEGER → 9_007_199_254_740_991
      return res;
  };

  BinaryExtract.prototype.getTextUtf8 = function(len) {
      this._assertOnRemainingLength(len);
      var res = stringFromUTF8Array(this.buffer.slice(this.offset, this.offset + len));
      this.offset += len;
      return res;
  };

  BinaryExtract.prototype.getUint8Bits = function() {
      return new BitExtract(this.getUint8());
  };

  BinaryExtract.prototype.getRaw = function(len) {
      this._assertOnRemainingLength(len);
      var res = this.buffer.slice(this.offset, this.offset + len);
      this.offset += len;
      return res;
  };

  BinaryExtract.prototype.getFloat = function() {
    var bytes = this.getUint32();
    // from https://stackoverflow.com/a/16001019/12636611
    var sign = (bytes & 0x80000000) ? -1 : 1;
    var exponent = ((bytes >> 23) & 0xFF) - 127;
    var significand = (bytes & ~(-1 << 23));

    if (exponent == 128) 
        return sign * ((significand) ? Number.NaN : Number.POSITIVE_INFINITY);

    if (exponent == -127) {
        if (significand == 0) return sign * 0.0;
        exponent = -126;
        significand /= (1 << 22);
    } else significand = (significand | (1 << 23)) / (1 << 23);
    return sign * significand * Math.pow(2, exponent);
    };


function stringFromUTF8Array(data)
{
  // from https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/
  var extraByteMap = [ 1, 1, 1, 1, 2, 2, 3, 0 ];
  var count = data.length;
  var str = "";    
  for (var index = 0;index < count;)
  {
      var ch = data[index++];
      if (ch & 0x80)
      {
          var extra = extraByteMap[(ch >> 3) & 0x07];
          if (!(ch & 0x40) || !extra || ((index + extra) > count))
              return null;            
          ch = ch & (0x3F >> extra);
          for (;extra > 0;extra -= 1)
          {
              var chx = data[index++];
              if ((chx & 0xC0) != 0x80)
                  return null;
              ch = (ch << 6) | (chx & 0x3F);
          }
      }    
      str += String.fromCharCode(ch);
  }
  return str;
}

function pad(number, length) {
  var str = "" + number;
  while (str.length < length) {
      str = "0" + str;
  }   
  return str;
}

function bytesToHexStr(byte_arr) {
  var res = "";
  for(var i = 0; i<byte_arr.length; i++) {
      res += ("00"+byte_arr[i].toString(16)).slice(-2).toUpperCase();
  }
  return res;
}

// FORMATTER AND CONVERTER FUNCTIONS
function mbusStatus(status) {
    switch(status) {
    case 0:
        return "connected";
    case 1:
        return "nothing_requested";
    case 2:
        return "bus_unpowered";
    case 3:
        return "no_response";
    case 5:
        return "crc_or_len_error";
    case 6:
        return "parse_error";
    case 7:
        return "bus_shorted";
    default:
        return "invalid_status";
    }
}

function usagePulseMediumType(medium) {
    switch(medium) {
    case 0:
        return "triggers";
    case 1:
        return "pulses";
    case 2:
        return "L_water";
    case 3:
        return "Wh_electricity";
    case 4:
        return "L_gas";
    default:
        return "invalid_medium";
    }
}


function serialFormat(serial) {
    if(serial == 0xFFFFFFFF) 
        return "not_available";
    var hex = serial.toString(16).toUpperCase();   
    return pad(hex, 8);
}

function actualityDurationToMinutesFormat(actuality_raw) {
    if(actuality_raw < 60)
        return actuality_raw;
    if(actuality_raw < 156)
        return (actuality_raw - 60) * 15;
    if(actuality_raw < 200)
        return (actuality_raw - 156) * 24 * 60;
    if(actuality_raw < 253)
        return (actuality_raw - 200) * 7 * 24 * 60;
    if(actuality_raw == 253)
        return 365 * 24 * 60;
    return null;
}

function actualityDurationToFormatStr(actuality_raw) {
    var minutes = actualityDurationToMinutesFormat(actuality_raw);
    if(actuality_raw < 60)
        return minutes + " minutes";
    if(actuality_raw < 156)
        return (minutes / 60).toFixed(2) + " hours";
    if(actuality_raw < 200)
        return (minutes / (60 * 24)).toFixed(2) + " days";
    if(actuality_raw < 253)
        return (minutes / (60 * 24 * 7)).toFixed(2) + " weeks";
    if(actuality_raw == 253)
        return (minutes / (60 * 24 * 365)).toFixed(2) + " years";
    return null;
}

function usagePulseMultiplier(exp) {
    switch(exp) {
    case 0:
        return 1;
    case 1:
        return 10;
    case 2:
        return 100;
    case 3:
        return 1000;
    default:
        throw Error("invalid_multiplier");
    }
}

function pulseInputModeAndUnit(modeAndUnit) {
    switch(modeAndUnit) {
    case 0:
        return "disabled";
    case 1:
        return "pulses";
    case 2:
        return "L_water";
    case 3:
        return "Wh_electricity";
    case 4:
        return "L_gas";
    case 9:
        return "triggers_1_sec";
    case 10:
        return "triggers_10_sec";
    case 11:
        return "triggers_1_min";
    case 12:
        return "triggers_1_h";
    default:
        throw Error("invalid_input_mode");
    }
}

function activeAlertsFormat(alerts_obj) {
    var res = [];
    for (var key in alerts_obj) {
        if (alerts_obj.hasOwnProperty(key)) {
            if(alerts_obj[key] && (key != "any_alert_active_now")) {
                res.push(key);
            }
        }
    }    
    return res;
}

function lorawanProfileFormat(profile) {
    switch(profile) {
    case 0x00:
        return "lorawan_disabled";  
    case 0x01:
        return "lorawan_24_h_privacy";
    case  0x02:
        return "lorawan_24_h";
    case  0x03:
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
    switch(profile) {
    case 0x00:
        return "wmbus_disabled";  
    case 0x01:
        return "wmbus_privacy";
    case  0x02:
        return "wmbus_driveby";
    case  0x03:
        return "wmbus_fixnet";
    default:
        return "invalid_wmbus_profile";
    }
}

function packetErrorReasonFormatter(reason) {
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
    default:
        return "invalid_error_code";
    }
}

function hardwareConfigFormat(hw) {
    switch(hw) {
    case 0x00:
        return "pulse_only";
    case 0x01:
        return "pulse_analog";
    case 0x02:
        return "pulse_ssi";
    case 0x04:
        return "pulse_mbus";
    case 0x06:
        return "pulse_lbus";
    case 0x07:
        return "pulse_izar";
    default:
        return "invalid_hardware_config";
    }    
}

function shutdownReasonFormat(reason) {
    switch(reason) {
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
    switch(reason) {
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

function mbusMedium(medium) {
    switch (medium)
    {
    case 0x00:
        return "other";
    case 0x01:
        return "oil";
    case 0x02:
        return "electricity";
    case 0x03:
        return "gas";
    case 0x04:
        return "heat (outlet vol)";
    case 0x05:
        return "steam";
    case 0x06:
        return "hot Water";
    case 0x07:
        return "water";
    case 0x08:
        return "heat cost allocator";
    case 0x09:
        return "compressed air";
    case 0x0A:
    case 0x0B:
        return "cooling load meter";
    case 0x0C:
        return "heat (inlet vol)";
    case 0x0D:
        return "heat / cooling load meter";
    case 0x0E:
        return "bus / system";
    case 0x0F:
        return "unknown";
    case 0x16:
        return "cold water";
    case 0x17:
        return "dual water";
    case 0x18:
        return "pressure";
    case 0x19:
        return "A/D converter";
    default:
        return "unknown";
    }
} 

function mbusManufacturer(mfgId) {
    var out = String.fromCharCode(((mfgId>>10) & 0x001F) + 64);
    out += String.fromCharCode(((mfgId>>5)  & 0x001F) + 64);
    out += String.fromCharCode(((mfgId)     & 0x001F) + 64);
    return out;
}

function ssiSensor(status) {
    switch(status) {
    case 0:
        return "disconnected";
    case 1:
        return "pressure_30bar_temperature";
    default:
        return "invalid_sensor_index";
    }
}


// USAGE PAYLOAD
function pulseUsageParse(interfaceName, dataView, result) {
    var bits4 = dataView.getUint8Bits();
    result[interfaceName + "_input_state"] = bits4.getBits(1) == 1 ? "closed" : "open";
    var serial_sent = bits4.getBits(1);
    var multiplier = usagePulseMultiplier(bits4.getBits(2));
    result["_" + interfaceName + "_muliplier"] = multiplier;
    var mediumType = usagePulseMediumType(bits4.getBits(4));
    result["_" + interfaceName + "_medium_type"] = mediumType;

    result[interfaceName + "_accumulated__" + mediumType] = dataView.getUint32() * multiplier;
    if(serial_sent) {
        result[interfaceName + "_serial"] = serialFormat(dataView.getUint32());
    }
}

function usageAndStatusParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var device_status_sent = false;
    var packet_type = dataView.getUint8();
    if(packet_type == 0x02) {
        result._packet_type = "usage_packet";
    }
    else if(packet_type == 0x82) {
        result._packet_type = "status_packet";
        device_status_sent = true;
    }
    else {
        result._error = ["invalid_packet_type " + packet_type];
        return;
    }

    var bits1 = dataView.getUint8Bits();
    var active_alerts = {};
    active_alerts.pulse_1_trigger_alert = bits1.getBits(1);
    active_alerts.pulse_2_trigger_alert = bits1.getBits(1);
    bits1.getBits(4);
    active_alerts.low_battery = bits1.getBits(1);
    result._app_connected_within_a_day = bits1.getBits(1);
    result.active_alerts = activeAlertsFormat(active_alerts);

    if(device_status_sent) {
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
    }

    var actuality = dataView.getUint8();
    result.meter_actuality_duration__minutes = actualityDurationToMinutesFormat(actuality);
    result.meter_actuality_duration_formatted = actualityDurationToFormatStr(actuality);

    var bits2 = dataView.getUint8Bits();
    var pulse_1_sent = bits2.getBits(1);
    var pulse_2_sent = bits2.getBits(1);
    var main_interface_sent = bits2.getBits(4);
    var mbus_sent = main_interface_sent == 0x08;
    var ssi_sent = main_interface_sent == 0x04;

    if(pulse_1_sent) {
        pulseUsageParse("pulse_1", dataView, result);
    }
    if(pulse_2_sent) {
        pulseUsageParse("pulse_2", dataView, result);
    }
    if(mbus_sent) {
        var bits6 = dataView.getUint8Bits();
        result.mbus_last_status = mbusStatus(bits6.getBits(4));
        result._mbus_data_records_truncated = bits6.getBits(1);
        var stateAndSerialSent = bits6.getBits(1);

        if(stateAndSerialSent) {
            result.mbus_status = "0x" + pad(dataView.getUint8().toString(16).toUpperCase(), 2);
            result.mbus_serial = serialFormat(dataView.getUint32());
        }

//        result.mbus_data_records = [];
        result.mbus_data_records_unparsed = "";
        while(dataView.offset < dataView.buffer.length) {
            result.mbus_data_records_unparsed += pad(dataView.getUint8().toString(16).toUpperCase(), 2);
        }
    }
    if(ssi_sent) {
        var bits7 = dataView.getUint8Bits();
        result.ssi_sensor = ssiSensor(bits7.getBits(6));
        
        var bits8 = dataView.getUint8Bits();
        var ch1_inst = bits8.getBits(1);
        var ch1_avg = bits8.getBits(1);
        var ch2_inst = bits8.getBits(1);
        var ch2_avg = bits8.getBits(1);
        var ch3_inst = bits8.getBits(1);
        var ch3_avg = bits8.getBits(1);
        var ch4_inst = bits8.getBits(1);
        var ch4_avg = bits8.getBits(1);

        if(ch1_inst) result.ssi_channel_1 = parseFloat(dataView.getFloat().toFixed(5));
        if(ch1_avg) result.ssi_channel_1_avg = parseFloat(dataView.getFloat().toFixed(5));
        if(ch2_inst) result.ssi_channel_2 = parseFloat(dataView.getFloat().toFixed(5));
        if(ch2_avg) result.ssi_channel_2_avg = parseFloat(dataView.getFloat().toFixed(5));
        if(ch3_inst) result.ssi_channel_3 = parseFloat(dataView.getFloat().toFixed(5));
        if(ch3_avg) result.ssi_channel_3_avg = parseFloat(dataView.getFloat().toFixed(5));
        if(ch4_inst) result.ssi_channel_4 = parseFloat(dataView.getFloat().toFixed(5));
        if(ch4_avg) result.ssi_channel_4_avg = parseFloat(dataView.getFloat().toFixed(5));
    }
}


// CONFIGURATION PAYLOADS

function pulseConfigParse(interfaceName, dataView, result) {
    result[interfaceName + "_input_mode_and_unit"] = pulseInputModeAndUnit(dataView.getUint8Bits().getBits(4));

    var bits2 = dataView.getUint8Bits();
    var multiplierSent = bits2.getBits(1);
    var accumulatedAbsoluteSent = bits2.getBits(1);
    var accumulatedOffsetSent = bits2.getBits(1);
    var serialSent = bits2.getBits(1);
    bits2.getBits(2);
    var multiplier = usagePulseMultiplier(bits2.getBits(2));

    if(multiplierSent) {
        result[interfaceName + '_multiplier_numerator'] = dataView.getUint16();
        result[interfaceName + '_multiplier_denominator'] = dataView.getUint8();
    }
    if(accumulatedAbsoluteSent) {
        result[interfaceName + '_accumulated_absolute'] = dataView.getUint32() * multiplier;
    }
    if(accumulatedOffsetSent) {
        result[interfaceName + '_accumulated_offset'] = dataView.getInt32() * multiplier;
    }
    if(serialSent) {
        result[interfaceName + '_serial'] = serialFormat(dataView.getUint32());
    }
}

function generalConfigurationParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if(packet_type == 0x12)
        result._packet_type = "general_configuration_packet";
    else {
        result._error = ["invalid_configuration_type " + packet_type];
        return;
    }

    var bits1 = dataView.getUint8Bits();
    var radio_lorawan_profile_sent = bits1.getBits(1);
    var radio_wmbus_profile_sent = bits1.getBits(1);
    bits1.getBits(2);
    var pulse_1_sent = bits1.getBits(1);
    var pulse_2_sent = bits1.getBits(1);

    if(radio_lorawan_profile_sent)
        result.radio_lorawan_profile = lorawanProfileFormat(dataView.getUint8());

    if(radio_wmbus_profile_sent)
        result.radio_wmbus_profile = wmbusProfileFormat(dataView.getUint8());
    
    if(pulse_1_sent) {
        pulseConfigParse("pulse_1", dataView, result); 
    }
    if(pulse_2_sent) {
        pulseConfigParse("pulse_2", dataView, result); 
    }
}

function mbusConfigurationParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if(packet_type == 0x14)
        result._packet_type = "mbus_configuration_packet";
    else {
        result._error = ["invalid_configuration_type " + packet_type];
        return;
    }
    var bits1 = dataView.getUint8Bits();
    var usage_count = bits1.getBits(4);
    var status_count = bits1.getBits(4);
    if(usage_count > 10 || status_count > 10) {
        result._error = ["invalid_usage_or_status_count"];
        return;
    }
    result.mbus_data_record_headers_unparsed = "";
    while(dataView.offset < dataView.buffer.length) {
        result.mbus_data_record_headers_unparsed += pad(dataView.getUint8().toString(16).toUpperCase(), 2);
    }
}

function locationConfigurationParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if(packet_type == 0x21)
        result._packet_type = "location_configuration_packet";
    else {
        result._error = ["invalid_configuration_type " + packet_type];
        return;
    }
    var configured_parameters = {};
    var bits1 = dataView.getUint8Bits();
    configured_parameters.gps_position_sent = bits1.getBits(1);
    configured_parameters.time_zone_sent = bits1.getBits(1);
    configured_parameters.address_sent = bits1.getBits(1);
    configured_parameters.id_customer_sent = bits1.getBits(1);
    configured_parameters.id_location_sent = bits1.getBits(1);

    if(configured_parameters.gps_position_sent) {
        result.gps_position_latitude__deg = dataView.getInt32() / 10000000.0;
        result.gps_position_longitude__deg = dataView.getInt32() / 10000000.0;
    }
    if(configured_parameters.time_zone_sent) {
        result.time_zone__h = dataView.getInt8() / 4.0;
    }
    if(configured_parameters.address_sent) {
        var address_len = dataView.getUint8();
        result.address = dataView.getTextUtf8(address_len);
    }
    if(configured_parameters.id_customer_sent) {
        var id_customer_len = dataView.getUint8();
        result.id_customer = dataView.getTextUtf8(id_customer_len);
}
    if(configured_parameters.id_location_sent) {
        var id_location_len = dataView.getUint8();
        result.id_location = dataView.getTextUtf8(id_location_len);
    }
}


// CONFIGURATION REQUESTS AND COMMANDS
function configurationRequestsParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if(packet_type == 0x12)
        result._packet_type = "general_configuration_request";
    else if(packet_type == 0x14)
        result._packet_type = "mbus_configuration_request";
    else if(packet_type == 0x21) 
        result._packet_type = "location_configuration_request";
    else {
        result._error = ["invalid_request_type " + packet_type];
    }
}



function commandParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if(packet_type == 0x03) {
        if(buffer.length == 1) {
            result._packet_type = "local_time_request";
            return;
        }
        result._packet_type = "local_time_response";
        result.device_local_time__s = dataView.getUint32();
            
        var date = new Date(result.device_local_time__s * 1000);
        result.device_local_time_formatted = date.toISOString().replace(/.\d+Z$/g, "Z");
        var start_of_2020 = 1577836800;
        if(result.device_local_time__s < start_of_2020)
            result.device_local_time_formatted = "invalid";
    }
    else if(packet_type == 0x81) {
        if(buffer.length == 1) {
            result._packet_type = "mbus_available_data_records_request";
            return;
        }
        var bits = dataView.getUint8Bits();
        result._packet_number = bits.getBits(3);
        result._more_packets_following = bits.getBits(1);
        bits.getBits(2);
        var mbus_header_sent = bits.getBits(1);

        if(mbus_header_sent) {
            result._packet_type = "mbus_available_data_records";
            result.mbus_header_serial = serialFormat(dataView.getUint32());
            result.mbus_header_manufacturer = mbusManufacturer(dataView.getUint16());
            result.mbus_header_version = "0x" + pad(dataView.getUint8().toString(16).toUpperCase(), 2);
            result.mbus_header_medium = mbusMedium(dataView.getUint8());
            result.mbus_header_access_number = dataView.getUint8();
            result.mbus_header_status = "0x" + pad(dataView.getUint8().toString(16).toUpperCase(), 2);
            result.mbus_header_signature = pad(dataView.getUint8().toString(16).toUpperCase(), 2) + pad(dataView.getUint8().toString(16).toUpperCase(), 2);
        }

        result.mbus_data_record_headers_unparsed = "";
        while(dataView.offset < dataView.buffer.length) {
            result.mbus_data_record_headers_unparsed += pad(dataView.getUint8().toString(16).toUpperCase(), 2);
        }    
    }
    else if(packet_type == 0xFF) 
        result._packet_type = "enter_dfu_command";
    else {
        result._error = ["invalid_command_type " + packet_type];
    }
}

// SYSTEM MESSAGES
function sysMessagesParser(buffer, result) {
    var dataView = new BinaryExtract(buffer);

    var packet_type = dataView.getUint8();
    if(packet_type == 0x13) {
        result._packet_type = "faulty_downlink_packet";
        result.packet_fport = dataView.getUint8();
        result.packet_error_reason = packetErrorReasonFormatter(dataView.getUint8());
    }
    else if(packet_type == 0x00) {
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
        result.device_uptime_accumulated__days = parseFloat((dataView.getUint24() / 24.0).toFixed(2));
    }
    else if(packet_type == 0x01) {
        var shutdown_reason = shutdownReasonFormat(dataView.getUint8());
        var buffer_usage = buffer.slice(2);
        usageAndStatusParser(buffer_usage, result);
        result._packet_type = "shutdown_packet";
        result._shutdown_reason = shutdown_reason;
    }
    else {
        result._error = ["invalid_command_type " + packet_type];
    }
}
/*
function decodeByFport(fport, bytes, result) {
    if(bytes.length == 0)
        result._error = ["empty_payload"];
    else if(fport == 25)
        usageParser(bytes, result);
    else if(fport == 49)
        configurationRequestsParser(bytes, result);
    else if(fport == 50)
        configurationParser(bytes, result);
    else if(fport == 60)
        commandParser(bytes, result);
    else if(fport == 99)
        sysMessagesParser(bytes, result);
    else {
        result._error = ["invalid_fport"];
    }
    return result;
}
*/

function checkFport(fport, expectedFport, result) {
    if(fport != expectedFport) 
        result._error = ["wrong fport or header"];
}


function decodeByPacketHeader(fport, bytes, result) {
    if(bytes.length == 0)
        result._error = ["empty_payload"];
    else if(bytes[0] == 0x02) {
        usageAndStatusParser(bytes, result);
        checkFport(fport, 25, result);
    }
    else if(bytes[0] == 0x82) {
        usageAndStatusParser(bytes, result);
        checkFport(fport, 24, result);
    }
    else if(bytes[0] == 0x12) {
        if (bytes.length == 1) {
            configurationRequestsParser(bytes, result);
            checkFport(fport, 49, result);    
        }
        else {
            generalConfigurationParser(bytes, result);
            checkFport(fport, 50, result);    
        }
    }
    else if(bytes[0] == 0x21) {
        if (bytes.length == 1) {
            configurationRequestsParser(bytes, result);
            checkFport(fport, 49, result);    
        }
        else {
            locationConfigurationParser(bytes, result);
            checkFport(fport, 50, result);    
        }
    }
    else if(bytes[0] == 0x14) {
        if (bytes.length == 1) {
            configurationRequestsParser(bytes, result);
            checkFport(fport, 49, result);    
        }
        else {
            mbusConfigurationParser(bytes, result);
            checkFport(fport, 50, result);    
        }
    }    
    else if(bytes[0] == 0x03 || bytes[0] == 0x81 || bytes[0] == 0xFF) {
        commandParser(bytes, result);
        if(bytes.length == 1)
            checkFport(fport, 60, result);
        else {
            if(bytes[0] == 0x03)
                checkFport(fport, 60, result);
            else
                checkFport(fport, 61, result);
        }
    }
    else if(bytes[0] == 0x00 || bytes[0] == 0x01 || bytes[0] == 0x13) {
        sysMessagesParser(bytes, result);
        checkFport(fport, 99, result);
    }
    else {
        result._error = ["invalid_header"];
    }
    return result;
}

function decodeRaw(fport, bytes) {
    var res = {};
    try {
        decodeByPacketHeader(fport, bytes, res);
//        decodeByFport(fport, bytes, res);
    } catch(err) {
        res._error = [err.message];
    }
    res._raw_payload = bytesToHexStr(bytes);
    // brings values containing 'invalid_' out to _errors list.
    for(var key in res) {
        if(typeof res[key] == "string" && res[key].indexOf("invalid_") > -1) {
            if(!('_error' in res))
                res._error = [];
            res._error.push(res[key]);
        }
    }
    return res;
}

// Functions for post-proccessing the cm30xx and um30xx decoder result

function _extract_unit_from_key(key) {
    // key with unit looks like "meter_accumulated_volume__m3"
    var spl = key.split("__");
    var unit = spl.length > 1 ? spl[1] : "";
    if (unit == "C")
        unit = unit.replace("C", "°C");
    unit = unit.replaceAll("_", "/");
    unit = unit.replace("3", "³");
    unit = unit.replace("deg", "°");
    return unit
}

function formatElementStrValueUnit(key_printable, value, formatted_value, unit) {
    if (formatted_value) {
        return formatted_value;  
    }
    var res = value.toString();
    if(unit.length > 0) {
        var float_val = +(res);
        if (!isNaN(float_val)) {
            // only add unit if it is value
            res = res + " " + unit;
        }
    }
    return res.replaceAll("_", " ");
}


function convertToFormatted(decoded, elementFormatter, out_is_list) {
    var converted = out_is_list ? [] : {};
    var hidden = out_is_list ? [] : {};
    for(var key in decoded) {
        if (key.split("_formatted").length > 1) {
            // key containing '_formatted' must have its pair, so skip _formatted
            // e.g. with 'actuality_duration_formatted' also must exist e.g. 'actuality_duration__minutes'
            continue
        }
        var param_name = key.split("__")[0];
        var value = decoded[key];

        var formatted_value = null;
        if (param_name + '_formatted' in decoded) {
            formatted_value = decoded[param_name + '_formatted'];
        }

        var unit = _extract_unit_from_key(key);

        var key_printable = param_name;
        is_hidden_param = key_printable[0] == '_';
        if (is_hidden_param) {
            // remove first empty char
            key_printable = key_printable.slice(1);
        }

        element = elementFormatter(key_printable, value, formatted_value, unit);

        if (is_hidden_param) {
            if (out_is_list) { hidden.push(element); }
            else { hidden[param_name] = element; }
        }
        else {
            if (out_is_list) { converted.push(element); }
            else { converted[param_name] = element; }
        }
    }
    return {hidden: hidden, data: converted};
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


