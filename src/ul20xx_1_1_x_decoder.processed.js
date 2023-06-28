import { BinaryExtract, BitExtract } from './util/extract';
import {
  pad, bytesToHexStr, bitFalseTrue, intToHexStr,
} from './util/misc';

function profileReason(reason, err) {

  switch (reason) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      return 'profile_' + reason;
    case 0x21:
      return 'calendar_day';
    case 0x22:
      return 'calendar_night';
    case 0x30:
      return 'calendar_dawn_step';
    case 0x50:
      return 'calendar_dusk_step';
    case 245:
      return 'relay_off';
    // eslint-disable-next-line no-duplicate-case
    case 248:
      return 'fallback_active';
    case 246:
      return 'driver_not_found';
    case 250:
      return 'ldr_input_active';
    case 252:
      return 'dig_input_active';
    case 253:
      return 'manual_active';
    case 255:
      return 'unknown';
    default:
      err.errors.push('invalid_reason');
      return 'invalid_reason';
  }
}

export function addressParse(addr, ffStr, err) {
  if (addr === 0x01) {
    return { value: 'analog_0_10v', raw: addr };
  }
  if (addr === 0xFE) {
    return { value: 'dali_broadcast', raw: addr };
  }
  if (addr === 0xFF) {
    if (ffStr) {
      return { value: ffStr, raw: addr };
    }
    err.warnings.push('invalid_address');
    return { value: 'invalid', raw: addr };
  }
  // eslint-disable-next-line no-bitwise
  if (addr & 0x01) {
    err.warnings.push('invalid_address');
    return { value: 'invalid', raw: addr };
  }
  // eslint-disable-next-line no-bitwise
  if (addr & 0x80) {
    // eslint-disable-next-line no-bitwise
    return { value: 'dali_group_' + ((addr >> 1) & 0xF).toString(), raw: addr };
  }

  // eslint-disable-next-line no-bitwise
  return { value: 'dali_single_' + ((addr >> 1) & 0x3F).toString(), raw: addr };
}

export function profileParserPartial(dataView, profile, err) {
  var id = dataView.getUint8();
  profile.profile_id = { value: id === 255 ? 'no_profile' : id, raw: id };

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
  profile.days_active = { value: days, raw: activeDays };

  dataView.getUint8();
  return length;
}

export function decodeUnixEpoch(epoch, err) {
  var date = new Date(epoch * 1000);
  var epochFormatted = date.toISOString();
  if (epoch < 1420070400) { // 1 January 2015 00:00:00
    epochFormatted = 'invalid_timestamp';
    err.warnings.push('invalid_timestamp');
  }
  return { value: epochFormatted, raw: epoch };
}

export function decodeLdrConfig(dataView, result) {
  result.packet_type = { value: 'ldr_input_config_packet' };

  var high = dataView.getUint8();
  result.ldr_off_threshold_high = { value: high === 0xFF ? 'disabled' : high, raw: high };

  var low = dataView.getUint8();
  result.ldr_on_threshold_low = { value: low === 0xFF ? 'disabled' : low, raw: low };

  var behaviorBits = dataView.getUint8Bits();
  behaviorBits.getBits(2);
  result.trigger_alert_enabled = bitFalseTrue(behaviorBits.getBits(1));
}

export function decodeLightDimStep(dataView) {
  var res = {};
  var light = dataView.getFloat();
  var level = dataView.getUint8();
  res.light_level = { value: formatLightLx(light), unit: "lx or none" };
  res.dimming_level = decodeDimmingLevel(level, 'inactive');
  return res;
}

export function decodeLightInputConfig(dataView, result, err) {
  result.packet_type = { value: 'light_input_config_packet' };

  var step_count = dataView.getUint8();
  if (step_count === 0xFF) {
    return;
  }
  var bits = dataView.getUint8Bits();
  result.alert_on_every_step = bitFalseTrue(bits.getBits(1));
  result.clamp_profile = bitFalseTrue(bits.getBits(1));
  result.clamp_dig = bitFalseTrue(bits.getBits(1));
  result.interpolate_steps = bitFalseTrue(bits.getBits(1));

  result.measurement_duration = { value: dataView.getUint8(), unit: "s" };

  var addr = dataView.getUint8();
  result.address = addressParse(addr, "all_devices", err);

  result.dim_steps = [];
  while (dataView.availableLen()) {
    result.dim_steps.push(decodeLightDimStep(dataView));
  }
}

export function decodeDimmingLevel(level, ffName) {
  if (level === 0xFF) {
    return { value: ffName, raw: level, unit: '' };
  }
  return { value: level, raw: level, unit: '%' };
}

export function decodeDigConfig(dataView, result, err) {
  result.packet_type = { value: 'dig_input_config_packet' };

  var time = dataView.getUint16();
  result.light_on_duration = { value: time === 0xFFFF ? 'dig_input_disabled' : time, raw: time, unit: 's' };

  var behaviorBits = dataView.getUint8Bits();
  behaviorBits.getBits(1);
  var edge = behaviorBits.getBits(1);
  var trigger = behaviorBits.getBits(1);
  result.signal_edge_rising = bitFalseTrue(edge);
  result.trigger_alert_enabled = bitFalseTrue(trigger);

  var addr = dataView.getUint8();
  result.address = addressParse(addr, "all_devices", err);

  var level = dataView.getUint8();
  result.dimming_level = decodeDimmingLevel(level, 'disabled');
}

export function decodeDigInputConfigNew(dataView, result, err) {
  result.packet_type = { value: 'dig_input_config_packet' };

  var index = dataView.getUint8();
  if (index === 0xFF) {
    return;
  }

  var bits = dataView.getUint8Bits();
  result.dig_mode_button = bitFalseTrue(bits.getBits(1));
  result.polarity_high_or_rising = bitFalseTrue(bits.getBits(1));
  result.alert_on_activation = bitFalseTrue(bits.getBits(1));
  result.alert_on_inactivation = bitFalseTrue(bits.getBits(1));

  var addr = dataView.getUint8();
  result.address = addressParse(addr, "all_devices", err);

  var active = dataView.getUint8();
  var inactive = dataView.getUint8();
  result.active_dimming_level = decodeDimmingLevel(active, 'inactive');
  result.inactive_dimming_level = decodeDimmingLevel(inactive, 'inactive');

  var on_delay = dataView.getUint16();
  var off_delay = dataView.getUint16();
  result.on_delay = { value: on_delay, unit: 's' };
  result.off_delay = { value: off_delay, unit: 's' };
}

export function decodeStepTime(inByte) {
  var minTotal = inByte * 10;
  var hour = Math.trunc(minTotal / 60);
  var mn = minTotal - hour * 60;
  return { value: pad(hour, 2) + ':' + pad(mn, 2), raw: minTotal };
}

export function decodeOdRelaySwStep(dataView) {
  var res = {};
  res.step_time = decodeStepTime(dataView.getUint8());

  var state = dataView.getUint8() !== 0;
  res.open_drain_output_on = bitFalseTrue(state);
  return res;
}

export function decodeCalendarConfigV10(dataView, result) {
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

export function decodeZenithStep(dataView) {
  var step = {};
  var angle = dataView.getInt8();
  step.zenith_angle = { value: (angle / 6 + 90).toFixed(2), raw: angle, unit: '°' };

  var dim = dataView.getUint8();
  step.dimming_level = decodeDimmingLevel(dim, 'disabled');
  return step;
}

export function decodeCalendarConfigV11(dataView, result) {
  result.packet_type = { value: 'calendar_config_packet' };

  var steps = dataView.getUint8Bits();
  var sunriseSteps = steps.getBits(4);
  var sunsetSteps = steps.getBits(4);

  var bits = dataView.getUint8Bits();
  result.calendar_prefers_meta_pos = bitFalseTrue(bits.getBits(1));
  result.calendar_clamps_profiles = bitFalseTrue(bits.getBits(1));
  result.calendar_clamps_dig = bitFalseTrue(bits.getBits(1));

  var lat = dataView.getInt16() / 100;
  var lon = dataView.getInt16() / 100;
  result.latitude = { value: lat, unit: '°' };
  result.longitude = { value: lon, unit: '°' };

  result.sunrise_steps = [];
  result.sunset_steps = [];

  for (var i1 = 0; i1 < sunriseSteps; i1 += 1) {
    result.sunrise_steps.push(decodeZenithStep(dataView));
  }
  for (var i2 = 0; i2 < sunsetSteps; i2 += 1) {
    result.sunset_steps.push(decodeZenithStep(dataView));
  }
}

export function decodeStatusConfig(dataView, result) {
  result.packet_type = { value: 'status_config_packet' };
  var interval = dataView.getUint32();
  result.status_interval = { value: interval, unit: 's' };
}

export function decodeDimmingStep(dataView) {
  var res = {};
  res.step_time = decodeStepTime(dataView.getUint8());

  var dim = dataView.getUint8();
  res.dimming_level = decodeDimmingLevel(dim, 'inactive');
  return res;
}

export function decodeProfileConfig(dataView, result, err) {
  result.packet_type = { value: 'profile_config_packet' };
  var len = profileParserPartial(dataView, result, err);
  result.dimming_steps = [];

  for (var i = 0; i < len; i += 1) {
    result.dimming_steps.push(decodeDimmingStep(dataView));
  }
}

export function decodeTimeConfig(dataView, result, err) {
  result.packet_type = { value: 'time_config_packet' };

  var epoch = dataView.getUint32();
  if (epoch == 0) {
    result.device_unix_epoch = { value: 'force_lorawan_devicetimereq', raw: 0 };
  }
  else
  {
    result.device_unix_epoch = decodeUnixEpoch(epoch, err);
  }
}

export function decodeLegacyDefaultsConfig(dataView, result) {
  result.packet_type = { value: 'legacy_defaults_config_packet' };

  var dim = dataView.getUint8();
  result.default_dim = { value: dim, unit: '%' };

  var alerts = dataView.getUint8Bits();
  result.ldr_alert_enabled = bitFalseTrue(alerts.getBits(1));
  alerts.getBits(1);
  result.dig_alert_enabled = bitFalseTrue(alerts.getBits(1));
  result.dali_alert_enabled = bitFalseTrue(alerts.getBits(1));
}

export function decodeUsageConfig(dataView, result) {
  result.packet_type = { value: 'usage_config_packet' };
  var interval = dataView.getUint32();
  var volt = dataView.getUint8();
  result.usage_interval = { value: interval, unit: 's' };
  if (volt !== 0xFF) {
    result.mains_voltage = { value: volt, unit: 'V' };
  }
}

export function decodeMonthDay(dataView) {
  var month = dataView.getUint8();
  var day = dataView.getUint8();
  // eslint-disable-next-line no-bitwise
  return { value: pad(month, 2) + '/' + pad(day, 2), raw: (month << 8) | day };
}

export function decodeHolidayConfig(dataView, result) {
  result.packet_type = { value: 'holiday_config_packet' };
  result.holidays = [];

  var len = dataView.getUint8();
  for (var i = 0; i < len; i += 1) {
    result.holidays.push(decodeMonthDay(dataView));
  }
}

export function decodeDaliMonitorConfig(dataView, result) {
  var bits = dataView.getUint8Bits();
  result.packet_type = { value: 'dali_monitor_config_packet' };
  result.send_dali_alert = bitFalseTrue(bits.getBits(1));
  result.correct_dali_dimming_level = bitFalseTrue(bits.getBits(1));
  result.periodic_bus_scan_enabled = bitFalseTrue(bits.getBits(1));

  var interval = dataView.getUint16();
  result.monitoring_interval = { value: interval, raw: interval, unit: 's' };
  if (interval === 0) {
    result.monitoring_interval = { value: 'disabled', raw: interval, unit: '' };
  }
}

export function decodeFallbackDimConfig(dataView, result) {
  result.packet_type = { value: 'fallback_dim_config_packet' };
  var dim = dataView.getUint8();
  result.fallback_dimming_level = { value: dim, unit: '%' };
}

export function decodeMulticastFcntConfig(dataView, result) {
  result.packet_type = { value: 'multicast_fcnt_config_packet' };
  result.multicast_device = { value: dataView.getUint8() };
  result.multicast_fcnt = { value: dataView.getUint32() };
}

export function decodeBootDelayConfig(dataView, result) {
  result.packet_type = { value: 'boot_delay_config_packet' };
  var legacy = dataView.availableLen() === 1;
  var range = legacy ? dataView.getUint8() : dataView.getUint16();
  result.boot_delay_range = { value: range, unit: 's' };
}

export function decodeFade(fade, err) {
  var lookup = [0.5, 0.71, 1.0, 1.41, 2.0, 2.83, 4.0, 5.66, 8.0, 11.31,
    16.0, 22.63, 32.0, 45.25, 64.0, 90.51];
  var unitStr = '';
  var val = '';
  if (fade === 255) {
    val = 'ignore';
  } else if (fade >= 16) {
    val = 'invalid_fade';
    err.errors.push('invalid_fade');
  } else {
    unitStr = 's';
    val = lookup[fade];
  }
  return { value: val, unit: unitStr, raw: fade };
}

export function decodeDefaultsConfig(dataView, result, err) {
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
    result.fade_duration = decodeFade(f, err);
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

export function decodeLocationConfigV10(dataView, result) {
  result.packet_type = { value: 'location_config_packet' };

  var bits1 = dataView.getUint8Bits();
  var positionSent = bits1.getBits(1);
  var addressSent = bits1.getBits(1);

  if (positionSent) {
    result.latitude = { value: dataView.getInt32() / 10000000.0, unit: '°' };
    result.longitude = { value: dataView.getInt32() / 10000000.0, unit: '°' };
  }
  if (addressSent) {
    var addressLen = dataView.getUint8();
    result.address = { value: dataView.getTextUtf8(addressLen) };
  }
}

export function decodeLocationConfigV11(dataView, result) {
  result.packet_type = { value: 'location_config_packet' };

  var addressLen = dataView.getUint8();

  result.latitude = { value: dataView.getInt32() / 10000000.0, unit: '°' };
  result.longitude = { value: dataView.getInt32() / 10000000.0, unit: '°' };

  result.address = { value: dataView.getTextUtf8(addressLen) };
}

export function decodeLumalinkMode(mode, err) {
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

export function decodeLumalinkConfig(dataView, result, err) {
  result.packet_type = { value: 'lumalink_config_packet' };
  var mode = dataView.getUint8();
  result.access_mode = { value: decodeLumalinkMode(mode, err), raw: mode };
}

export function decodeLedConfig(dataView, result) {
  result.packet_type = { value: 'onboard_led_config_packet' };
  var l = dataView.getUint8Bits().getBits(1);
  result.status_led_enabled = bitFalseTrue(l);
}

export function alertParamConfig(value, naValue, unit) {
  var val = value === naValue ? 'alert_off' : value;
  var res = { value: val, raw: value };
  if (unit) res.unit = value === naValue ? '' : unit;
  return res;
}

export function decodeMeteringAlertConfig(dataView, result, err) {
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

export function decodeFadeConfig(dataView, result, err) {
  result.packet_type = { value: 'fade_config_packet' };
  var dur = dataView.getUint8();
  result.fade_duration = decodeFade(dur, err);
}

export function decodeMulticastConfig(dataView, result, err) {
  result.packet_type = { value: 'multicast_config_packet' };
  var dev = dataView.getUint8();

  var invalidMc = dev > 3;
  if (invalidMc) {
    err.errors.push('invalid_multicast_device');
    return;
  }
  result.multicast_device = { value: dev };
  var devaddr = dataView.getRaw(4).reverse();
  result.devaddr = { value: bytesToHexStr(devaddr) };

  var nwkskey = dataView.getRaw(16);
  result.nwkskey = { value: bytesToHexStr(nwkskey) };

  var appskey = dataView.getRaw(16);
  result.appskey = { value: bytesToHexStr(appskey) };
}

export function decodeClearConfig(dataView, result, err) {
  result.packet_type = { value: 'clear_config_packet' };
  var typ = dataView.getUint8();
  switch (typ) {
    case 0x01:
      result.reset_target = { value: 'ldr_input_config' };
      break;
    case 0x03:
      result.reset_target = { value: 'dig_input_config' };
      break;
    case 0x21:
      result.reset_target = { value: 'profile_config' };
      result.address = addressParse(dataView.getUint8(), 'all_profiles', err);
      break;
    case 0x23:
      result.reset_target = { value: 'holiday_config' };
      break;
    case 0x52:
      result.reset_target = { value: 'multicast_config' };
      var device = dataView.getUint8();
      result.multicast_device = { value: device === 0xff ? 'all_multicast_devices' : 'multicast_device_' + device, raw: device };
      break;
    case 0xFF:
      result.reset_target = { value: 'factory_reset' };
      result.device_serial = { value: intToHexStr(dataView.getUint32(), 8) };
      break;
    default:
      err.errors.push('invalid_clear_config_target');
  }
}

export function decodeFport50(dataView, result, err) {
  var header = dataView.getUint8();
  switch (header) {
    case 0x01:
      decodeLdrConfig(dataView, result);
      return;
    case 0x03:
      decodeDigConfig(dataView, result, err);
      return;
    case 0x05:
      result.packet_type = { value: 'open_drain_output_config_packet' };
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
      decodeLightInputConfig(dataView, result, err);
      return;
    case 0x53:
      decodeMulticastFcntConfig(dataView, result);
      return;
    case 0xFE:
      result.packet_type = { value: 'chained_config_packet' };
      result.payloads = [];
      while (dataView.availableLen()) {
        var packet = {};
        decodeFport50(dataView, packet, err);
        result.payloads.push(packet);
      }
      return;
    default:
      err.errors.push('invalid_header');
  }
}

function daliStatus(bits, address, err) {
  var status = {
    driver_error: bitFalseTrue(false),
    lamp_failure: bitFalseTrue(false),
    lamp_on: bitFalseTrue(false),
    limit_error: bitFalseTrue(false),
    fade_running: bitFalseTrue(false),
    reset_state: bitFalseTrue(false),
    missing_short_address: bitFalseTrue(false),
    power_failure: bitFalseTrue(false),
  };
  if (bits.data === 0xFF) return status;

  var driverError = bits.getBits(1);
  status.driver_error = bitFalseTrue(driverError);

  var lampFailure = bits.getBits(1);
  status.lamp_failure = bitFalseTrue(lampFailure);

  status.lamp_on = bitFalseTrue(bits.getBits(1));

  var limitError = bits.getBits(1);
  status.limit_error = bitFalseTrue(limitError);

  status.fade_running = bitFalseTrue(bits.getBits(1));

  var resetState = bits.getBits(1);
  status.reset_state = bitFalseTrue(resetState);

  var missingAddress = bits.getBits(1);
  status.missing_short_address = bitFalseTrue(missingAddress);

  var powerFailure = bits.getBits(1);
  status.power_failure = bitFalseTrue(powerFailure);

  if (driverError) err.warnings.push(address + ' driver_error');
  if (lampFailure) err.warnings.push(address + ' lamp_failure');
  if (limitError) err.warnings.push(address + ' limit_error');
  if (resetState) err.warnings.push(address + ' reset_state');
  if (powerFailure) err.warnings.push(address + ' power_failure');
  return status;
}

export function decodeDaliStatus(dataView, err) {
  var result = {};
  var addr = dataView.getUint8();
  var addrParsed = addressParse(addr, null, err);
  result.address = addrParsed;

  result.status = daliStatus(dataView.getUint8Bits(), addrParsed.value, err);
  return result;
}

function decodeDaliStatusReq(dataView, result, err) {
  result.packet_type = { value: 'dali_status_request' };
  if (dataView.availableLen() === 1) {
    var addr = dataView.getUint8();
    if (addr === 0xFE) {
      result.address = { value: 'all_drivers', raw: addr };
    } else {
      result.address = addressParse(addr, null, err);
    }
  } else {
    result.dali_statuses = [];
    while (dataView.availableLen()) {
      result.dali_statuses.push(decodeDaliStatus(dataView, err));
    }
  }
}

export function decodeDimming(dataView, err) {
  var result = {};
  var addr = dataView.getUint8();
  result.address = addressParse(addr, "all_devices", err);

  var level = dataView.getUint8();
  result.dimming_level = decodeDimmingLevel(level, 'resume');
  return result;
}

export function decodeDimmingCommand(dataView, result, err) {
  result.packet_type = { value: 'manual_dimming' };
  result.destination = [];
  while (dataView.availableLen()) {
    result.destination.push(decodeDimming(dataView, err));
  }
}

export function decodeCustomDaliReq(dataView, result, err) {
  result.packet_type = { value: 'custom_dali_request' };

  var offset = dataView.offset;
  result.query_data_raw = { value: bytesToHexStr(dataView.getRaw(dataView.availableLen())) };
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

  var query = dataView.getUint8();
  result.dali_query = { value: query };

  if (dataView.availableLen() === 1) {
    var ans = dataView.getUint8();
    result.dali_response = { value: ans };
  }
}

export function decodeCustomDaliCommand(dataView, result) {
  result.packet_type = { value: 'custom_dali_command' };

  var data = dataView.getRaw(dataView.availableLen());
  result.dali_command = { value: bytesToHexStr(data) };
}

function decodeDimMap(dataView, err) {
  var result = {};
  result.address = addressParse(dataView.getUint8(), null, err);
  result.dali_min_level = { value: dataView.getUint8() };
  result.dali_max_level = { value: dataView.getUint8() };
  var curve = dataView.getUint8();
  result.dimming_curve = { value: curve === 0 ? 'logarithmic' : 'linear', raw: curve };
  return result;
}

export function decodeStatusRequest(dataView, result, err) {
  result.packet_type = { value: 'status_usage_request' };

  var bits = dataView.getUint8Bits();
  result.usage_requested = bitFalseTrue(bits.getBits(1));
  result.status_requested = bitFalseTrue(bits.getBits(1));
  result.dim_map_report_requested = bitFalseTrue(bits.getBits(1));

  if (result.dim_map_report_requested && dataView.availableLen() > 0) {
    result.drivers = [];
    while (dataView.availableLen()) {
      result.drivers.push(decodeDimMap(dataView, err));
    }
  }
}

function decodeDigVal(val) {
  if (val === 0x00) return 'off';
  if (val === 0x01) return 'on';
  if (val === 0xFF) return 'n/a';
  return 'invalid_value';
}

export function decodeInterfacesRequest(dataView, result, err) {
  if (dataView.availableLen() === 1) {
    dataView.getUint8();
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
  result.internal_relay_closed = bitFalseTrue(relayBits.getBits(1));
  result.open_drain_output_on = bitFalseTrue(relayBits.getBits(1));
}

export function decodeDriverMemoryPartial(dataView, result, err) {
  var addr = dataView.getUint8();
  result.address = addressParse(addr, null, err);

  var bank = dataView.getUint8();
  result.memory_bank = { value: bank };

  var memAddr = dataView.getUint8();
  result.memory_address = { value: memAddr };
}

export function decodeDriverMemoryPartialSized(dataView, result, err) {
  decodeDriverMemoryPartial(dataView, result, err);
  var size = dataView.getUint8();
  result.read_size = { value: size, unit: 'bytes' };
  return size;
}

export function decodeReadDriverMemory(dataView, result, err) {
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

export function decodeWriteDriverMemory(dataView, result, err) {
  result.packet_type = { value: 'driver_memory_write' };
  if (dataView.availableLen() === 0) {
    err.warnings.push('driver_memory_write_failed');
    return;
  }

  decodeDriverMemoryPartial(dataView, result);
  var data = dataView.getRaw(dataView.availableLen());
  result.memory_value = { value: bytesToHexStr(data) };
}

export function decodeTimedDimming(dataView, err) {
  var result = {};
  var addr = dataView.getUint8();
  result.address = addressParse(addr, "all_devices", err);

  var lvl = dataView.getUint8();
  result.dimming_level = decodeDimmingLevel(lvl, 'resume');

  var dur = dataView.getUint8();
  result.duration = { value: dur, unit: 'min' };
  return result;
}

export function decodeTimedDimmingCommand(dataView, result, err) {
  result.packet_type = { value: 'manual_timed_dimming' };
  result.destination = [];
  while (dataView.availableLen()) {
    result.destination.push(decodeTimedDimming(dataView, err));
  }
}

export function decodeAddressDaliDriver(dataView, result, err) {
  result.packet_type = { value: 'address_dali_driver' };
  var addr = dataView.getUint8();
  result.address = addressParse(addr, 'rescan_dali_bus', err);
}

export function decodeDaliIdentify(result) {
  result.packet_type = { value: 'dali_identify' };
}

export function decodeOpenDrainSwitching(dataView, result) {
  result.packet_type = { value: 'open_drain_output_control' };
  var sw = dataView.getUint8Bits().getBits(1);
  result.open_drain_output_on = bitFalseTrue(sw);
}

export function decodeFport60(dataView, result, err) {
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

// UPLINK ONLY THINGS

function statusProfileParser(dataView, err) {
  var profile = {};
  profileParserPartial(dataView, profile, err);

  var level = dataView.getUint8();
  profile.dimming_level = decodeDimmingLevel(level, 'resume');
  return profile;
}

function dimmingSourceParser(dataView, err) {
  var source = {};

  var addrParsed = addressParse(dataView.getUint8(), null, err);
  source.address = addrParsed;

  source.reason = profileReason(dataView.getUint8(), err);

  var level = dataView.getUint8();
  source.dimming_level = decodeDimmingLevel(level, 'ignore');

  source.status = daliStatus(dataView.getUint8Bits(), addrParsed.value, err);
  return source;
}

export function formatLightLx(lx) {
  var log10_val = Math.log10(lx);
  var log10_pos = log10_val >= 0 ? log10_val : 0;
  var log10_lim = log10_pos > 3 ? 3 : log10_pos;
  var decimals = 3 - Math.trunc(log10_lim);
  return lx.toFixed(decimals);
}

function calcLightLx(light_raw) {
  var light_val = light_raw & 0x7FFF;
  var lx = Math.pow(10, light_val / 4000.0) / 1000.0;
  return formatLightLx(lx);
}

function decodeSensorSource(dataView, result, err) {
  var header = dataView.getUint8();
  if (header === 0x01) {
    result.sensor_source.ldr_input = { value: dataView.getUint8() };
    return 2;
  }
  if (header == 0x02) {
    var lx = calcLightLx(dataView.getUint16());
    result.sensor_source.light_sensor = { value: lx, unit: 'lx' };
    return 3;
  }
  if (header == 0x03) {
    var lx = calcLightLx(dataView.getUint16());
    result.sensor_source.d4i_light_sensor = { value: lx, unit: 'lx' };
    return 3;
  }
  if (header == 0x04) {
    var bits = dataView.getUint8Bits();
    result.sensor_source.dig_input_1_on = bitFalseTrue(bits.getBits(1));
    return 2;
  }
  err.errors.push("invalid_sensor_source");
  return 1;
}

function statusParser1_1(dataView, result, err) {
  result.packet_type = { value: 'status_packet' };

  var header = dataView.getUint8();
  var header_below_1_1_4 = header === 0x00;
  if (!header_below_1_1_4 && header !== 0x01) {
    err.errors.push('invalid_header');
    return;
  }

  var epoch = dataView.getUint32();
  result.device_unix_epoch = decodeUnixEpoch(epoch, err);

  var statusField = {};
  var bits = dataView.getUint8Bits();

  var daliErrExt = bits.getBits(1);
  var daliErrConn = bits.getBits(1);
  var ldrOn = bits.getBits(1);
  bits.getBits(1);
  var digOn = bits.getBits(1);
  var err1 = bits.getBits(1);
  var err2 = bits.getBits(1);
  var internalRelay = bits.getBits(1);

  statusField.dali_connection_error = bitFalseTrue(daliErrConn);
  if (daliErrConn) err.warnings.push('dali_connection_error');

  statusField.metering_com_error = bitFalseTrue(err1);
  if (err1) err.warnings.push('metering_com_error');
  statusField.rtc_com_error = bitFalseTrue(err2);
  if (err2) err.warnings.push('rtc_com_error');

  statusField.internal_relay_closed = bitFalseTrue(internalRelay);
  if (header_below_1_1_4) {
    statusField.ldr_input_on = bitFalseTrue(ldrOn);
    statusField.dig_input_on = bitFalseTrue(digOn);
  }

  if (!header_below_1_1_4) {
    var bits1 = dataView.getUint8Bits();
    bits1.getBits(1);
    bits1.getBits(1);
    statusField.open_drain_output_on = bitFalseTrue(bits1.getBits(1));
    bits1.getBits(1);
    bits1.getBits(1);
    bits1.getBits(1);
    statusField.lumalink_connected = bitFalseTrue(bits1.getBits(1));
    statusField.lumalink_connected_once = bitFalseTrue(bits1.getBits(1));
  }

  result.status = statusField;

  result.downlink_rssi = { value: -1 * dataView.getUint8(), unit: 'dBm' };

  result.downlink_snr = { value: dataView.getInt8(), unit: 'dB' };

  result.mcu_temperature = { value: dataView.getInt8(), unit: '°C' };

  var alertsSent = true;
  if (header_below_1_1_4) {
    var bits2 = dataView.getUint8Bits();
    bits2.getBits(1); // legacy thr
    var ldrSent = bits2.getBits(1);
    var odOn = bits2.getBits(1);
    bits2.getBits(1);
    result.status.open_drain_output_on = bitFalseTrue(odOn);
    alertsSent = bits2.getBits(1);

    if (ldrSent) {
      result.ldr_input_value = { value: dataView.getUint8() };
    }

  }

  if (alertsSent) {
    var bits4 = dataView.getUint8Bits();
    bits4.getBits(4);
    var alertVolt = bits4.getBits(1);
    var alertLamp = bits4.getBits(1);
    var alertPower = bits4.getBits(1);
    var alertPF = bits4.getBits(1);

    var alerts = {};
    alerts.voltage_alert_in_24h = bitFalseTrue(alertVolt);
    alerts.lamp_error_alert_in_24h = bitFalseTrue(alertLamp);
    alerts.power_alert_in_24h = bitFalseTrue(alertPower);
    alerts.power_factor_alert_in_24h = bitFalseTrue(alertPF);
    result.active_alerts = alerts;

    if (alertVolt) {
      err.warnings.push('voltage_alert_in_24h');
    }
    if (alertLamp) {
      err.warnings.push('lamp_error_alert_in_24h');
    }
    if (alertPower) {
      err.warnings.push('power_alert_in_24h');
    }
    if (alertPF) {
      err.warnings.push('power_factor_alert_in_24h');
    }
  }

  if (!header_below_1_1_4) {
    var senorSrcLeft = dataView.getUint8();
    result.sensor_source = {};
    while (senorSrcLeft > 0) {
      senorSrcLeft = senorSrcLeft - decodeSensorSource(dataView, result, err);
    }
    if (senorSrcLeft < 0) {
      err.errors.push('error_decoding_sensor_source');
    }
  }

  result.dimming_source = [];
  while (dataView.availableLen()) {
    result.dimming_source.push(dimmingSourceParser(dataView, err));
  }
}

function statusParser1_0(dataView, result, err) {
  // does not support 1.0.x legacy mode status packet!
  result.packet_type = { value: 'status_packet' };

  var epoch = dataView.getUint32();
  result.device_unix_epoch = decodeUnixEpoch(epoch, err);

  var statusField = {};
  var bits = dataView.getUint8Bits();

  var daliErrExt = bits.getBits(1);
  var daliErrConn = bits.getBits(1);
  var ldrOn = bits.getBits(1);
  bits.getBits(1);
  var digOn = bits.getBits(1);
  var err1 = bits.getBits(1);
  var err2 = bits.getBits(1);
  var internalRelay = bits.getBits(1);

  statusField.dali_error_external = bitFalseTrue(daliErrExt);
  if (daliErrExt) err.warnings.push('dali_external_error');

  statusField.dali_connection_error = bitFalseTrue(daliErrConn);
  if (daliErrConn) err.warnings.push('dali_connection_error');

  statusField.hardware_error = bitFalseTrue(err1);
  if (err1) err.warnings.push('hardware_error');

  statusField.internal_relay_closed = bitFalseTrue(internalRelay);
  statusField.ldr_input_on = bitFalseTrue(ldrOn);
  statusField.dig_input_on = bitFalseTrue(digOn);

  result.status = statusField;

  result.downlink_rssi = { value: -1 * dataView.getUint8(), unit: 'dBm' };

  result.downlink_snr = { value: dataView.getInt8(), unit: 'dB' };

  result.mcu_temperature = { value: dataView.getInt8(), unit: '°C' };

  var reportedFields = {};
  var bits2 = dataView.getUint8Bits();
  bits2.getBits(1); // legacy thr
  var ldrSent = bits2.getBits(1);
  var odOn = bits2.getBits(1);
  bits2.getBits(1);

  result.status.open_drain_output_on = bitFalseTrue(odOn);

  reportedFields.voltage_alert_in_24h = bitFalseTrue(bits2.getBits(1));
  reportedFields.lamp_error_alert_in_24h = bitFalseTrue(bits2.getBits(1));
  reportedFields.power_alert_in_24h = bitFalseTrue(bits2.getBits(1));
  reportedFields.power_factor_alert_in_24h = bitFalseTrue(bits2.getBits(1));
  result.analog_interfaces = reportedFields;

  if (ldrSent) {
    result.ldr_input_value = { value: dataView.getUint8() };
  }

  result.profiles = [];
  while (dataView.availableLen()) {
    result.profiles.push(statusProfileParser(dataView, err));
  }
}

function usageConsumptionParse(dataView, err) {
  var result = {};
  var addr = dataView.getUint8();
  result.address = addressParse(addr, 'internal_measurement', err);

  var bits = dataView.getUint8Bits();
  if (bits.getBits(1)) {
    result.active_energy = { value: dataView.getUint32(), unit: 'Wh' };
  }
  if (bits.getBits(1)) {
    result.active_power = { value: dataView.getUint16(), unit: 'W' };
  }
  if (bits.getBits(1)) {
    result.load_side_energy = { value: dataView.getUint32(), unit: 'Wh' };
  }
  if (bits.getBits(1)) {
    result.load_side_power = { value: dataView.getUint16(), unit: 'W' };
  }
  if (bits.getBits(1)) {
    var rawPf = dataView.getUint8();
    result.power_factor = { value: rawPf === 0xFF ? 'unknown' : (rawPf / 100.0), raw: rawPf };
  }
  if (bits.getBits(1)) {
    result.mains_voltage = { value: dataView.getUint8(), unit: 'V' };
  }
  if (bits.getBits(1)) {
    result.driver_operating_time = { value: dataView.getUint32(), unit: 's' };
  }
  if (bits.getBits(1)) {
    result.lamp_on_time = { value: dataView.getUint32(), unit: 's' };
  }
  return result;
}

function usageParser(dataView, result, err) {
  if (dataView.getUint8() !== 0) {
    err.errors.push('invalid_header');
    return;
  }

  result.packet_type = { value: 'usage_packet' };

  result.consumption = [];
  while (dataView.availableLen()) {
    result.consumption.push(usageConsumptionParse(dataView, err));
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
  var res = {};
  var bits = new BitExtract(byte);
  bits.getBits(1);
  bits.getBits(1);
  res.dig_input = bitFalseTrue(bits.getBits(1));
  res.ldr_input = bitFalseTrue(bits.getBits(1));
  res.open_drain_output = bitFalseTrue(bits.getBits(1));
  res.metering = bitFalseTrue(bits.getBits(1));
  bits.getBits(1);
  bits.getBits(1);
  return res;
}

function daliSupplyParse(data, err) {
  var supply = data;
  if (supply < 0x70) {
    return { value: supply, raw: supply, unit: 'V' };
  }
  switch (data) {
    case 0x7E:
      return { value: 'bus_high', raw: supply };
    case 0x7f:
      err.warnings.push('dali_bus_error');
      return { value: 'bus_error', raw: supply };
    default:
      return { value: 'invalid_value', raw: supply };
  }
}

function resetReasonParse(byte, err) {
  var res = [];
  var bits = new BitExtract(byte);
  if (bits.getBits(1)) {
    res.push('reset_0');
  }
  if (bits.getBits(1)) {
    res.push('watchdog_reset');
    err.warnings.push('watchdog_reset');
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

  result.device_serial = { value: intToHexStr(dataView.getUint32(), 8) };

  var maj = dataView.getUint8();
  var min = dataView.getUint8();
  var patch = dataView.getUint8();

  // eslint-disable-next-line no-bitwise
  result.firmware_version = { value: maj + '.' + min + '.' + patch, raw: (maj << 16) | (min << 8) | patch };

  var epoch = dataView.getUint32();
  result.device_unix_epoch = decodeUnixEpoch(epoch, err);

  var config = dataView.getUint8();
  result.device_config = { value: deviceConfigParser(config, err), raw: config };

  var opt = dataView.getUint8();
  result.optional_features = optionalFeaturesParser(opt);

  var daliBits = dataView.getUint8Bits();
  result.dali_supply_state = daliSupplyParse(daliBits.getBits(7), err);
  var busPower = daliBits.getBits(1);
  result.dali_power_source_external = { value: busPower ? 'external' : 'internal', raw: busPower };

  var driver = dataView.getUint8Bits();
  result.dali_addressed_driver_count = { value: driver.getBits(7) };
  var unadressed = driver.getBits(1);
  result.dali_unadressed_driver_found = bitFalseTrue(unadressed);
  if (unadressed) {
    err.warnings.push("unadressed_dali_driver_on_bus")
  }

  if (dataView.availableLen()) {
    var resetReas = dataView.getUint8();
    result.reset_reason = { value: resetReasonParse(resetReas, err), raw: resetReas };
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
    case 0x81:
      return 'profile_id_seq_error';
    case 0x82:
      return 'profile_destination_eror';
    case 0x83:
      return 'profile_days_error';
    case 0x84:
      return 'profile_step_count_error';
    case 0x85:
      return 'profile_step_value_error';
    case 0x86:
      return 'profile_step_unsorted_error';
    default:
      return 'invalid_error_code';
  }
}

function configFailedParser(dataView, result, err) {
  result.packet_type = { value: 'invalid_downlink_packet' };
  result.downlink_from_fport = { value: dataView.getUint8() };
  var errCode = dataView.getUint8();
  var error = errorCodeParser(errCode);
  result.error_reason = { value: error, raw: errCode };
  err.warnings.push('downlink_' + error);
}

function decodeFport99(dataView, result, err) {
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

function decodeFport61(dataView, result, err) {
  var header = dataView.getUint8();
  var rawByte2 = dataView.getUint8();
  // eslint-disable-next-line no-bitwise
  var len = rawByte2 >> 4;
  switch (header) {
    case 0x80:
      result.packet_type = { value: 'dig_input_alert' };
      err.warnings.push('dig_input_alert');

      if (len === 2) {
        var cnt = dataView.getUint16();
        result.dig_input_event_counter = { value: cnt };
      }
      else if (len === 4) {
        var bit2 = new BitExtract(rawByte2);
        result.dig_input_on = bitFalseTrue(bit2.getBits(1));
        var cnt = dataView.getUint32();
        result.dig_input_event_counter = { value: cnt };
      }
      else {
        err.errors.push('invalid_packet_length');
      }
      return;
    case 0x81:
      result.packet_type = { value: 'ldr_input_alert' };
      if (len !== 2) {
        err.errors.push('invalid_packet_length');
        return;
      }
      err.warnings.push('ldr_input_alert');

      var state = dataView.getUint8Bits().getBits(1);
      var val = dataView.getUint8();
      result.ldr_input_on = bitFalseTrue(state);
      result.ldr_input_value = { value: val };
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

      if (lampError) err.warnings.push('metering_lamp_error');
      if (overCurrent) err.warnings.push('metering_over_current');
      if (underVoltage) err.warnings.push('metering_under_voltage');
      if (overVoltage) err.warnings.push('metering_over_voltage');
      if (lowPowerFactor) err.warnings.push('metering_low_power_factor');

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

function decodeFport49(dataView, result, err) {
  var header = dataView.getUint8();
  switch (header) {
    case 0x01:
      result.packet_type = { value: 'ldr_input_config_request' };
      return;
    case 0x03:
      result.packet_type = { value: 'dig_input_config_request' };
      return;
    case 0x07:
      result.packet_type = { value: 'status_config_request' };
      return;
    case 0x09:
      result.packet_type = { value: 'time_config_packet' };
      return;
    case 0x0B:
      result.packet_type = { value: 'usage_config_request' };
      return;
    case 0x0D:
      result.packet_type = { value: 'boot_delay_config_request' };
      return;
    case 0x15:
      result.packet_type = { value: 'onboard_led_config_request' };
      return;
    case 0x16:
      result.packet_type = { value: 'metering_alert_confic_request' };
      return;
    case 0x52:
      result.packet_type = { value: 'multicast_config_request' };
      var mcDevice = dataView.getUint8();
      result.multicast_device = { value: mcDevice === 0xFF ? 'all' : mcDevice, raw: mcDevice };
      return;
    case 0x20:
      result.packet_type = { value: 'calendar_config_request' };
      return;
    case 0x21:
      result.packet_type = { value: 'profile_config_request' };
      var pid = dataView.getUint8();
      result.profile_id = { value: pid === 0xFF ? 'all_profiles' : pid, raw: pid };
      return;
    case 0x22:
      result.packet_type = { value: 'fade_config_request' };
      return;
    case 0x23:
      result.packet_type = { value: 'holiday_config_request' };
      return;
    case 0x24:
      result.packet_type = { value: 'dali_monitor_config_request' };
      return;
    case 0x25:
      result.packet_type = { value: 'fallback_dim_config_request' };
      return;
    case 0x26:
      result.packet_type = { value: 'location_config_request' };
      return;
    case 0x27:
      result.packet_type = { value: 'lumalink_config_request' };
      return;
    default:
      err.errors.push('invalid_header');
  }
}

function decodeFport51(dataView, result, err) {
  var header = dataView.getUint8();
  switch (header) {
    case 0xFF:
      result.packet_type = { value: 'activate_dfu_command' };
      return;
    case 0xFE:
      result.packet_type = { value: 'restart_controller_command' };
      return;
    default:
      err.errors.push('invalid_command');
  }
}

function decodeByFport(fport, bytes, result, err) {
  var dataView = new BinaryExtract(bytes);
  if (dataView.availableLen() === 0) {
    err.errors.push('empty_payload');
  } else if (fport === 23) {
    statusParser1_1(dataView, result, err);
  } else if (fport === 26) {
    usageParser(dataView, result, err);
  } else if (fport === 49) {
    decodeFport49(dataView, result, err);
  } else if (fport === 50) {
    decodeFport50(dataView, result, err);
  } else if (fport === 51) {
    decodeFport51(dataView, result, err);
  } else if (fport === 60) {
    decodeFport60(dataView, result, err);
  } else if (fport === 61) {
    decodeFport61(dataView, result, err);
  } else if (fport === 99) {
    decodeFport99(dataView, result, err);
  } else {
    err.errors.push('invalid_fport');
  }

  if (dataView.availableLen() !== 0) {
    err.errors.push('invalid_payload_length_long');
  }
}

export function decodeRaw(fport, bytes) {
  var res = {};
  var err = { errors: [], warnings: [] };
  try {
    decodeByFport(fport, bytes, res, err);
  } catch (error) {
    err.errors.push(error.message);
  }
  var out = { data: res };
  if (err.errors.length) {
    out.errors = err.errors;
  }
  if (err.warnings.length) {
    out.warnings = err.warnings;
  }
  return out;
}

