import { BinaryExtract, BitExtract } from './util/extract';
import {
  pad, bytesToHexStr, intToHexStr,
} from './util/misc';

function profileReason(reason, err) {
  // #ifdef VER1_0
  if (reason < 240) {
    return reason;
  }
  // #endif

  switch (reason) {
    // #ifdef VER1_0
    case 247:
      return 'calendar_active';
    case 248:
      return 'init_active';
    case 249:
      return 'profile_not_active';
    case 254:
      return 'value_differ';
    // #else
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
    case 0x31:
    case 0x32:
    case 0x33:
    case 0x34:
    case 0x35:
    case 0x36:
    case 0x37:
    case 0x38:
    case 0x39:
    case 0x3A:
    case 0x3B:
    case 0x3C:
    case 0x3D:
    case 0x3E:
    case 0x3F:
      return 'calendar_dawn_step_' + (reason - 0x30);
    case 0x50:
    case 0x51:
    case 0x52:
    case 0x53:
    case 0x54:
    case 0x55:
    case 0x56:
    case 0x57:
    case 0x58:
    case 0x59:
    case 0x5A:
    case 0x5B:
    case 0x5C:
    case 0x5D:
    case 0x5E:
    case 0x5F:
      return 'calendar_dusk_step_' + (reason - 0x50);
    case 0x70:
      return 'dig_inactive';
    case 0x71:
      return 'dig_active';
    case 0x80:
    case 0x81:
    case 0x82:
    case 0x83:
    case 0x84:
    case 0x85:
    case 0x86:
    case 0x87:
        return 'light_monitor_step_' + (reason - 0x80);
    case 245:
      return 'relay_off';
      // eslint-disable-next-line no-duplicate-case
    case 248:
      return 'fallback_active';
    // #endif
    case 246:
      return 'driver_not_found';
    case 250:
      return 'ldr_input_active';
    case 252:
      return 'dig_input_active';
    case 253:
      return 'manual_active';
    case 255:
      err.errors.push('unknown_reason');
      return 'unknown';
    default:
      err.errors.push('invalid_reason');
      return 'invalid_reason';
  }
}

export function addressParse(addr, ffStr, err) {
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

export function profileParserPartial(dataView, profile, err) {
  var id = dataView.getUint8();
  profile.profile_id = id === 255 ? 'no_profile' : id;

  var length = 0;
  // #ifdef VER1_0
  var ver = dataView.getUint8();
  profile.profile_version = profileReason(ver, err);
  // #else
  length = dataView.getUint8();
  // #endif

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

  // #ifndef VER1_0
  dataView.getUint8();
  // #endif
  return length;
}

export function decodeUnixEpoch(epoch, err) {
  var date = new Date(epoch * 1000);
  var epochFormatted = date.toISOString();
  if (epoch < 1420070400) { // 1 January 2015 00:00:00
    epochFormatted = 'invalid_timestamp';
    err.warnings.push('invalid_timestamp');
  }
  return epochFormatted;
}

export function decodeLdrConfig(dataView, result) {
  result.packet_type = 'deprecated_ldr_input_config_packet';

  var high = dataView.getUint8();
  result.ldr_off_threshold_high = high === 0xFF ? 'disabled' : high;

  var low = dataView.getUint8();
  result.ldr_on_threshold_low = low === 0xFF ? 'disabled' : low;

  var behaviorBits = dataView.getUint8Bits();
  behaviorBits.getBits(2);
  result.trigger_alert_enabled = behaviorBits.getBits(1);
}
// #ifndef VER1_0
export function decodeLightDimStep(dataView) {
  var res = {};
  var light = dataView.getFloat();
  var level = dataView.getUint8();
  res.light_level__lx = formatLightLx(light);
  res.dimming_level__percent = decodeDimmingLevel(level, 'inactive');
  return res;
}

export function decodeLightSensorConfig(dataView, result, err) {
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
// #endif

export function decodeDimNotifyConfig(dataView, result, err) {
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

export function decodeInterfaceTypeConfig(dataView, result, err) {
  result.packet_type = 'interface_type_config_packet';
  result.interface_type = decodeInterfaceType(dataView.getUint8(), err);
}

export function decodeDimmingLevel(level, ffName) {
  if (level === 0xFF) {
    return ffName;
  }
  return level;
}

export function decodeDigConfig(dataView, result, err) {
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

export function decodeDigInputConfigNew(dataView, result, err) {
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

export function decodeStepTime(inByte) {
  var minTotal = inByte * 10;
  var hour = Math.trunc(minTotal / 60);
  var mn = minTotal - hour * 60;
  return pad(hour, 2) + ':' + pad(mn, 2);
}

export function decodeOdRelaySwStep(dataView) {
  var res = {};
  res.step_time = decodeStepTime(dataView.getUint8());

  var state = dataView.getUint8() !== 0;
  res.open_drain_output_on = state;
  return res;
}

export function decodeCalendarConfigV10(dataView, result) {
  result.packet_type = 'calendar_config_packet';

  var sunrise = dataView.getInt8();
  var sunset = dataView.getInt8();
  var lat = dataView.getInt16() / 100;
  var lon = dataView.getInt16() / 100;

  var clear = sunrise === -1 && sunset === -1;

  result.sunrise_offset__minutes = clear ? 'disabled' : sunrise;
  result.sunset_offset__minutes = clear ? 'disabled' : sunset;

  result.latitude__deg = lat;
  result.longitude__deg = lon;
}

export function decodeZenithStep(dataView) {
  var step = {};
  step.zenith_angle__deg = (dataView.getInt8() / 6 + 90).toFixed(2);

  var dim = dataView.getUint8();
  step.dimming_level__percent = decodeDimmingLevel(dim, 'disabled');
  return step;
}

// #ifndef VER1_0
export function decodeCalendarConfigV11(dataView, result) {
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
// #endif

export function decodeStatusConfig(dataView, result) {
  result.packet_type = 'status_config_packet';
  result.status_interval__s = dataView.getUint32();
}

export function decodeDimmingStep(dataView) {
  var res = {};
  res.step_time = decodeStepTime(dataView.getUint8());

  res.dimming_level__percent = decodeDimmingLevel(dataView.getUint8(), 'inactive');
  return res;
}

export function decodeProfileConfig(dataView, result, err) {
  result.packet_type = 'profile_config_packet';
  var len = profileParserPartial(dataView, result, err);
  result.dimming_steps = [];

  // #ifdef VER1_0
  while (dataView.availableLen()) {
    result.dimming_steps.push(decodeDimmingStep(dataView));
  }
  // #else
  for (var i = 0; i < len; i += 1) {
    result.dimming_steps.push(decodeDimmingStep(dataView));
  }
  // #endif
}

export function decodeTimeConfig(dataView, result, err) {
  result.packet_type = 'time_config_packet';

  var epoch = dataView.getUint32();
  // #ifndef VER1_0
  if (epoch == 0) {
    result.device_unix_epoch = 'force_lorawan_devicetimereq';
  }
  else
  // #endif
  {
    result.device_unix_epoch = decodeUnixEpoch(epoch, err);
  }
}

export function decodeLegacyDefaultsConfig(dataView, result) {
  result.packet_type = 'legacy_defaults_config_packet';

  result.default_dim__percent = dataView.getUint8();

  var alerts = dataView.getUint8Bits();
  result.ldr_alert_enabled = alerts.getBits(1);
  alerts.getBits(1);
  result.dig_alert_enabled = alerts.getBits(1);
  result.dali_alert_enabled = alerts.getBits(1);
}

export function decodeUsageConfig(dataView, result) {
  result.packet_type = 'usage_config_packet';
  var interval = dataView.getUint32();
  var volt = dataView.getUint8();
  result.usage_interval__s = interval;
  if (volt !== 0xFF) {
    result.mains_voltage__V = volt;
  }
}

export function decodeMonthDay(dataView) {
  // eslint-disable-next-line no-bitwise
  return pad(dataView.getUint8(), 2) + '/' + pad(dataView.getUint8(), 2);
}

export function decodeHolidayConfig(dataView, result) {
  result.packet_type = 'holiday_config_packet';
  result.holidays = [];

  // #ifdef VER1_0
  while (dataView.availableLen()) {
    result.holidays.push(decodeMonthDay(dataView));
  }
  // #else
  var len = dataView.getUint8();
  for (var i = 0; i < len; i += 1) {
    result.holidays.push(decodeMonthDay(dataView));
  }
  // #endif
}

export function decodeDaliMonitorConfig(dataView, result) {
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

export function decodeFallbackDimConfig(dataView, result) {
  result.packet_type = 'fallback_dim_config_packet';
  result.fallback_dimming_level__percent = dataView.getUint8();
}

export function decodeMulticastFcntConfig(dataView, result) {
  result.packet_type = 'multicast_fcnt_config_packet';
  result.multicast_device = dataView.getUint8();
  result.multicast_fcnt = dataView.getUint32();
}

export function decodeBootDelayConfig(dataView, result) {
  result.packet_type = 'boot_delay_config_packet';
  var legacy = dataView.availableLen() === 1;
  var range = legacy ? dataView.getUint8() : dataView.getUint16();
  result.boot_delay_range__s = range;
}

export function decodeFade(fade, err) {
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

export function decodeDefaultsConfig(dataView, result, err) {
  result.packet_type = 'defaults_config_packet';
  var bits = dataView.getUint8Bits();
  var dim = bits.getBits(1);
  var maxDim = bits.getBits(1);
  var fade = bits.getBits(1);
  var sunsetMode = bits.getBits(1);
  var legacyMode = bits.getBits(1);
  if (dim) {
    result.default_dim__percent = dataView.getUint8();
  }
  if (maxDim) {
    var md = dataView.getUint8();
    result.max_dim__percent = md === 0xff ? 'default' : md;
  }
  if (fade) {
    var f = dataView.getUint8();
    result.fade_duration__s = decodeFade(f, err);
  }
  if (sunsetMode) {
    result.switch_point_sunset = dataView.getUint8Bits().getBits(1) ? 'sunset' : 'twilight';
  }
  if (legacyMode) {
    result.legacy_mode_enabled = dataView.getUint8Bits().getBits(1);
  }
}

export function decodeLocationConfigV10(dataView, result) {
  result.packet_type = 'location_config_packet';

  var bits1 = dataView.getUint8Bits();
  var positionSent = bits1.getBits(1);
  var addressSent = bits1.getBits(1);

  if (positionSent) {
    result.latitude__deg = dataView.getInt32() / 10000000.0;
    result.longitude__deg = dataView.getInt32() / 10000000.0;
  }
  if (addressSent) {
    result.address = dataView.getTextUtf8(dataView.getUint8());
  }
}

export function decodeLocationConfigV11(dataView, result) {
  result.packet_type = 'location_config_packet';

  var addressLen = dataView.getUint8();

  result.latitude__deg = dataView.getInt32() / 10000000.0;
  result.longitude__deg = dataView.getInt32() / 10000000.0;

  result.address = dataView.getTextUtf8(addressLen);
}

// #ifndef VER1_0
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
  result.packet_type = 'lumalink_config_packet';
  result.access_mode = decodeLumalinkMode(dataView.getUint8(), err);
}
// #endif

export function decodeLedConfig(dataView, result) {
  result.packet_type = 'onboard_led_config_packet';
  var l = dataView.getUint8Bits().getBits(1);
  result.status_led_enabled = l;
}

export function alertParamConfig(value, naValue) {
  var val = value === naValue ? 'alert_off' : value;
  return val;
}

export function decodeMeteringAlertConfig(dataView, result, err) {
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

export function decodeFadeConfig(dataView, result, err) {
  result.packet_type = 'fade_config_packet';
  result.fade_duration__s = decodeFade(dataView.getUint8(), err);
}

export function decodeMulticastConfig(dataView, result, err) {
  result.packet_type = 'multicast_config_packet';
  var dev = dataView.getUint8();

  var invalidMc = dev > 3;
  // #ifdef VER1_0
  invalidMc = dev === 0 || dev > 4;
  // #endif
  if (invalidMc) {
    err.errors.push('invalid_multicast_device');
    return;
  }
  result.multicast_device = dev;
  result.devaddr = bytesToHexStr(dataView.getRaw(4).reverse());

  result.nwkskey = bytesToHexStr(dataView.getRaw(16));

  result.appskey = bytesToHexStr(dataView.getRaw(16));
}

export function decodeClearConfig(dataView, result, err) {
  result.packet_type = 'clear_config_packet';
  switch (dataView.getUint8()) {
    // #ifdef VER1_0
    case 0x01:
      result.reset_target = 'ldr_input_config';
      break;
    case 0x03:
      result.reset_target = 'dig_input_config';
      break;
    case 0x04:
      result.reset_target = 'profile_config';
      result.address = addressParse(dataView.getUint8(), 'all_profiles', err);
      if (dataView.availableLen()) {
        result.profile_id = dataView.getUint8();
      }
      break;
    case 0x06:
      result.reset_target = 'holiday_config';
      break;
    // #else
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
    // #endif
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

    // #ifdef VER1_0
    case 0x06:
      decodeCalendarConfigV10(dataView, result);
      return;
    case 0x08:
      decodeProfileConfig(dataView, result, err);
      return;
    case 0x0A:
      decodeLegacyDefaultsConfig(dataView, result);
      return;
    case 0x0C:
      decodeHolidayConfig(dataView, result);
      return;
    case 0x0E:
      decodeDefaultsConfig(dataView, result, err);
      return;
    case 0x13:
      decodeLocationConfigV10(dataView, result);
      return;

    // #else
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
      decodeDimNotifyConfig(dataView, result, err);
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
    // #endif
    default:
      err.errors.push('invalid_packet_type');
  }
}

function daliStatus(bits, address, err) {
  var status = {
    driver_error: false,
    lamp_failure: false,
    lamp_on: false,
    limit_error: false,
    fade_running: false,
    reset_state: false,
    missing_short_address: false,
    power_failure: false,
  };
  if (bits.data === 0xFF) return status;

  var driverError = bits.getBits(1);
  status.driver_error = driverError;

  var lampFailure = bits.getBits(1);
  status.lamp_failure = lampFailure;

  status.lamp_on = bits.getBits(1);

  var limitError = bits.getBits(1);
  status.limit_error = limitError;

  status.fade_running = bits.getBits(1);

  var resetState = bits.getBits(1);
  status.reset_state = resetState;

  var missingAddress = bits.getBits(1);
  status.missing_short_address = missingAddress;

  var powerFailure = bits.getBits(1);
  status.power_failure = powerFailure;

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

  result.status = daliStatus(dataView.getUint8Bits(), addrParsed, err);
  return result;
}

function decodeDaliStatusReq(dataView, result, err) {
  result.packet_type = 'dali_status_request';
  if (dataView.availableLen() === 1) {
    var addr = dataView.getUint8();
    if (addr === 0xFE) {
      result.address = 'all_drivers';
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
  result.address = addressParse(dataView.getUint8(), "all_devices", err);

  result.dimming_level__percent = decodeDimmingLevel(dataView.getUint8(), 'resume');
  return result;
}

export function decodeDimmingCommand(dataView, result, err) {
  result.packet_type = 'manual_dimming';
  result.destination = [];
  while (dataView.availableLen()) {
    result.destination.push(decodeDimming(dataView, err));
  }
}

export function decodeCustomDaliReq(dataView, result, err) {
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

export function decodeCustomDaliCommand(dataView, result) {
  result.packet_type = 'custom_dali_command';
  result.dali_command = bytesToHexStr(dataView.getRaw(dataView.availableLen()));
}

// #ifndef VER1_0
function decodeDimMap(dataView, err) {
  var result = {};
  result.address = addressParse(dataView.getUint8(), null, err);
  result.dali_min_level = dataView.getUint8();
  result.dali_max_level = dataView.getUint8();
  result.dimming_curve = dataView.getUint8() === 0 ? 'logarithmic' : 'linear';
  return result;
}
// #endif

export function decodeStatusRequest(dataView, result, err) {
  result.packet_type = 'status_usage_request';

  var bits = dataView.getUint8Bits();
  result.usage_requested = bits.getBits(1);
  result.status_requested = bits.getBits(1);
  // #ifndef VER1_0
  result.dim_map_report_requested = bits.getBits(1);
  result.request_gnss_notification = bits.getBits(1);

  if (result.dim_map_report_requested && dataView.availableLen() > 0) {
    result.drivers = [];
    while (dataView.availableLen()) {
      result.drivers.push(decodeDimMap(dataView, err));
    }
  }
  // #endif
}

function decodeDigVal(val) {
  if (val === 0x00) return 'off';
  if (val === 0x01) return 'on';
  if (val === 0xFF) return 'n/a';
  return 'invalid_value';
}

export function decodeInterfacesRequest(dataView, result, err) {
  result.packet_type = 'interface_request';
  if (dataView.availableLen() === 1) {
    dataView.getUint8();
    return;
  }

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

  result.dig = decodeDigVal(digVal);
  result.ldr = ldrVal === 0xFF ? 'n/a' : ldrVal;
  // thr deprecated
  result.internal_relay_closed = relayBits.getBits(1);
  result.open_drain_output_on = relayBits.getBits(1);
}

export function decodeDriverMemoryPartial(dataView, result, err) {
  result.address = addressParse(dataView.getUint8(), null, err);

  result.memory_bank = dataView.getUint8();;

  result.memory_address = dataView.getUint8();;
}

export function decodeDriverMemoryPartialSized(dataView, result, err) {
  decodeDriverMemoryPartial(dataView, result, err);
  var size = dataView.getUint8();
  result.read_size__bytes = size;
  return size;
}

export function decodeReadDriverMemory(dataView, result, err) {
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

export function decodeWriteDriverMemory(dataView, result, err) {
  result.packet_type = 'driver_memory_write';
  if (dataView.availableLen() === 0) {
    err.warnings.push('driver_memory_write_failed');
    return;
  }

  decodeDriverMemoryPartial(dataView, result);
  result.memory_value = bytesToHexStr(dataView.getRaw(dataView.availableLen()));
}

export function decodeTimedDimming(dataView, err) {
  var result = {};
  result.address = addressParse(dataView.getUint8(), "all_devices", err);

  result.dimming_level__percent = decodeDimmingLevel(dataView.getUint8(), 'resume');

  result.duration__minutes = dataView.getUint8();
  return result;
}

export function decodeTimedDimmingCommand(dataView, result, err) {
  result.packet_type = 'manual_timed_dimming';
  result.destination = [];
  while (dataView.availableLen()) {
    result.destination.push(decodeTimedDimming(dataView, err));
  }
}

export function decodeAddressDaliDriver(dataView, result, err) {
  result.packet_type = 'address_dali_driver';
  result.address = addressParse(dataView.getUint8(), 'rescan_dali_bus', err);
}

export function decodeDaliIdentify(result) {
  result.packet_type = 'dali_identify';
}

export function decodeOpenDrainSwitching(dataView, result) {
  result.packet_type = 'open_drain_output_control';
  result.open_drain_output_on = dataView.getUint8Bits().getBits(1);
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

    // #ifdef VER1_0
    case 0x00:
      decodeDaliStatusReq(dataView, result, err);
      return;
    case 0x06:
      decodeInterfacesRequest(dataView, result, err);
      return;

    // #else
    case 0x0A:
      decodeAddressDaliDriver(dataView, result, err);
      return;
    case 0x0B:
      decodeDaliIdentify(result);
      return;

    // #endif
    default:
      err.errors.push('invalid_command');
  }
}

// UPLINK ONLY THINGS

function statusProfileParser(dataView, err) {
  var profile = {};
  profileParserPartial(dataView, profile, err);

  var level = dataView.getUint8();
  profile.dimming_level__percent = decodeDimmingLevel(level, 'resume');
  return profile;
}

function dimmingSourceParser(dataView, err) {
  var source = {};

  source.address = addressParse(dataView.getUint8(), null, err);
  source.reason = profileReason(dataView.getUint8(), err);
  source.dimming_level__percent = decodeDimmingLevel(dataView.getUint8(), 'n/a');
  source.status = daliStatus(dataView.getUint8Bits(), source.address, err);
  return source;
}

// #ifndef VER1_0
export function formatLightLx(lx) {
  var log10_val = Math.log10(lx);
  var log10_pos = log10_val >= 0 ? log10_val : 0;
  var log10_lim = log10_pos > 3 ? 3 : log10_pos;
  var decimals = 3 - Math.trunc(log10_lim);
  return lx.toFixed(decimals);
}

function calcLightLx(light_raw) {
  if (light_raw === 0xFFFF) {
    return 'unavailable'
  }
  var light_val = light_raw & 0x7FFF;
  var lx = Math.pow(10, light_val / 4000.0) / 1000.0;
  return formatLightLx(lx);
}
// #endif

function decodeSensorSource(dataView, header, result, err) {
  if (header === 0x01) {
    result.sensor_source.ldr_input = dataView.getUint8();
    return 1;
  }
  if (header == 0x02) {
    result.sensor_source.light_sensor__lx = calcLightLx(dataView.getUint16());
    return 2;
  }
  if (header == 0x03) {
    result.sensor_source.d4i_light_sensor__lx = calcLightLx(dataView.getUint16());
    return 2;
  }
  if (header == 0x04) {
    var bits = dataView.getUint8Bits();
    result.sensor_source.dig_input_1_on = bits.getBits(1);
    return 1;
  }
  if (header == 0x08) {
    var deg = dataView.getUint8();
    if (deg == 0xFF) {
      deg = null;
    }
    result.sensor_source.tilt_sensor__deg = deg;
    return 1;
  }
  return 0;
}

// #ifndef VER1_0
function statusParser1_1(dataView, result, err) {
  result.packet_type = 'status_packet';

  var header = dataView.getUint8();
  var header_below_1_1_4 = header === 0x00;
  if (!header_below_1_1_4 && header !== 0x01) {
    err.errors.push('invalid_packet_type');
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

  statusField.dali_connection_error = daliErrConn;
  if (daliErrConn) err.warnings.push('dali_connection_error');

  statusField.metering_com_error = err1;
  if (err1) err.warnings.push('metering_com_error');

  statusField.ext_rtc_warning = err2;
  if (err2) err.warnings.push('ext_rtc_warning');

  statusField.internal_relay_closed = internalRelay;
  if (header_below_1_1_4) {
    statusField.ldr_input_on = ldrOn;
    statusField.dig_input_on = digOn;
  }

  if (!header_below_1_1_4) {
    var bits1 = dataView.getUint8Bits();
    bits1.getBits(1);
    bits1.getBits(1);
    statusField.open_drain_output_on = bits1.getBits(1);
    bits1.getBits(1);
    bits1.getBits(1);
    bits1.getBits(1);
    statusField.lumalink_connected = bits1.getBits(1);
    statusField.lumalink_connected_after_boot = bits1.getBits(1);
  }

  result.status = statusField;

  result.downlink_rssi__dBm = -1 * dataView.getUint8();

  result.downlink_snr__dB = dataView.getInt8();

  result.mcu_temperature__C = dataView.getInt8();

  var alertsSent = true;
  if (header_below_1_1_4) {
    var bits2 = dataView.getUint8Bits();
    bits2.getBits(1); // legacy thr
    var ldrSent = bits2.getBits(1);
    var odOn = bits2.getBits(1);
    bits2.getBits(1);
    result.status.open_drain_output_on = odOn;
    alertsSent = bits2.getBits(1);

    if (ldrSent) {
      result.ldr_input_value = dataView.getUint8();
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
    alerts.voltage_alert_in_24h = alertVolt;
    alerts.lamp_error_alert_in_24h = alertLamp;
    alerts.power_alert_in_24h = alertPower;
    alerts.power_factor_alert_in_24h = alertPF;
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
      var header = dataView.getUint8();
      senorSrcLeft = senorSrcLeft - 1;
      var consumed_len = decodeSensorSource(dataView, header, result, err);
      if (consumed_len == 0) {
        err.errors.push("unsupported_sensor_source");
        // consume all leftover bytes assigned for sensor_source so that future sensor sources would not break the code
        dataView.getRaw(senorSrcLeft);
        senorSrcLeft = 0;
      }
      else {
        senorSrcLeft = senorSrcLeft - consumed_len;
      }
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
// #endif
function statusParser1_0(dataView, result, err) {
  // does not support 1.0.x legacy mode status packet!
  result.packet_type = 'status_packet';

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

  statusField.dali_error_external = daliErrExt;
  if (daliErrExt) err.warnings.push('dali_external_error');

  statusField.dali_connection_error = daliErrConn;
  if (daliErrConn) err.warnings.push('dali_connection_error');

  statusField.hardware_error = err1;
  if (err1) err.warnings.push('hardware_error');

  statusField.internal_relay_closed = internalRelay;
  statusField.ldr_input_on = ldrOn;
  statusField.dig_input_on = digOn;

  result.status = statusField;

  result.downlink_rssi__dBm = -1 * dataView.getUint8();

  result.downlink_snr__dB = dataView.getInt8();

  result.mcu_temperature__C = dataView.getInt8();

  var reportedFields = {};
  var bits2 = dataView.getUint8Bits();
  bits2.getBits(1); // legacy thr
  var ldrSent = bits2.getBits(1);
  var odOn = bits2.getBits(1);
  bits2.getBits(1);

  result.status.open_drain_output_on = odOn;

  reportedFields.voltage_alert_in_24h = bits2.getBits(1);
  reportedFields.lamp_error_alert_in_24h = bits2.getBits(1);
  reportedFields.power_alert_in_24h = bits2.getBits(1);
  reportedFields.power_factor_alert_in_24h = bits2.getBits(1);
  result.analog_interfaces = reportedFields;

  if (ldrSent) {
    result.ldr_input_value = dataView.getUint8();
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
    result.active_energy__Wh = dataView.getUint32();
  }
  if (bits.getBits(1)) {
    result.active_power__W = dataView.getUint16();
  }
  if (bits.getBits(1)) {
    result.load_side_energy__Wh = dataView.getUint32();
  }
  if (bits.getBits(1)) {
    result.load_side_power__W = dataView.getUint16();
  }
  if (bits.getBits(1)) {
    var rawPf = dataView.getUint8();
    result.power_factor = rawPf === 0xFF ? 'unknown' : (rawPf / 100.0);
  }
  if (bits.getBits(1)) {
    result.mains_voltage__V = dataView.getUint8();
  }
  if (bits.getBits(1)) {
    result.driver_operating_time__h = Math.round(dataView.getUint32() / 3600);
  }
  if (bits.getBits(1)) {
    // #ifdef VER1_0
    var sec = dataView.getUint32();
    if (addr === 0xFF) sec = sec;
    result.lamp_on_time__h = Math.round((sec/3600)*10) / 10;
    // #else
    result.lamp_on_time__h = Math.round((dataView.getUint32()/3600)*10) / 10;
    // #endif
  }
  return result;
}
function usageParser(dataView, result, err) {
  // #ifndef VER1_0
  if (dataView.getUint8() !== 0) {
    err.errors.push('invalid_packet_type');
    return;
  }
  // #endif

  result.packet_type = 'usage_packet';

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
  res.dig_input = bits.getBits(1);
  res.ldr_input = bits.getBits(1);
  res.open_drain_output = bits.getBits(1);
  res.metering = bits.getBits(1);
  bits.getBits(1);
  bits.getBits(1);
  return res;
}

function daliSupplyParse(data, err) {
  if (data < 0x70) {
    return data;
  }
  switch (data) {
    case 0x7E:
      return 'bus_high';
    case 0x7f:
      err.warnings.push('dali_bus_error');
      return 'bus_error';
    default:
      return 'invalid_value';
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
  result.packet_type = 'boot_packet';

  result.device_serial = intToHexStr(dataView.getUint32(), 8);

  // eslint-disable-next-line no-bitwise
  result.firmware_version = dataView.getUint8() + '.' + dataView.getUint8() + '.' + dataView.getUint8();

  result.device_unix_epoch = decodeUnixEpoch(dataView.getUint32(), err);

  result.device_config = deviceConfigParser(dataView.getUint8(), err);

  result.optional_features = optionalFeaturesParser(dataView.getUint8());

  var daliBits = dataView.getUint8Bits();
  result.dali_supply_state__V = daliSupplyParse(daliBits.getBits(7), err);
  result.dali_power_source_external = daliBits.getBits(1) ? 'external' : 'internal';

  var driver = dataView.getUint8Bits();
  result.dali_addressed_driver_count = driver.getBits(7);
  var unadressed = driver.getBits(1);
  result.dali_unaddressed_driver_found = unadressed;
  if (unadressed) {
    err.warnings.push("unadressed_dali_driver_on_bus")
  }

  if (dataView.availableLen()) {
    result.reset_reason = resetReasonParse(dataView.getUint8(), err);
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
  result.packet_type = 'invalid_downlink_packet';
  result.downlink_from_fport = dataView.getUint8();
  var error = errorCodeParser(dataView.getUint8());
  result.error_reason = error;
  err.warnings.push('downlink_error ' + error);
}
// #ifndef UPLINK_REMOVE
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
      err.errors.push('invalid_packet_type');
  }
}

function decodeFport61(dataView, result, err) {
  var header = dataView.getUint8();
  var rawByte2 = dataView.getUint8();
  // eslint-disable-next-line no-bitwise
  var len = rawByte2 >> 4;
  switch (header) {
    case 0x80:
      // #ifdef VER1_0
      result.packet_type = 'dig_input_alert';
      // #else
      result.packet_type = 'dig_input_notification';
      // #endif
      if (len === 2) {
        result.dig_input_event_counter = dataView.getUint16();
      }
      else if (len === 4) {
        var bit2 = new BitExtract(rawByte2);
        result.dig_input_on = bit2.getBits(1);
        result.dig_input_event_counter = dataView.getUint32();
      }
      else {
        err.errors.push('invalid_packet_length');
      }
      return;
    case 0x81:
      // #ifdef VER1_0
      result.packet_type = 'ldr_input_alert';
      // #else
      result.packet_type = 'ldr_input_notification';
      // #endif
      if (len !== 2) {
        err.errors.push('invalid_packet_length');
        return;
      }

      var state = dataView.getUint8Bits().getBits(1);
      var val = dataView.getUint8();
      result.ldr_input_on = state;
      result.ldr_input_value = val;
      return;
    case 0x83:
      result.packet_type = 'dali_driver_alert';

      result.drivers = [];
      while (dataView.availableLen()) {
        result.drivers.push(decodeDaliStatus(dataView, err));
      }
      return;
    case 0x84:
      result.packet_type = 'metering_alert';
      var cond = new BitExtract(rawByte2);

      var lampError = cond.getBits(1);
      var overCurrent = cond.getBits(1);
      var underVoltage = cond.getBits(1);
      var overVoltage = cond.getBits(1);
      var lowPowerFactor = cond.getBits(1);

      result.lamp_error_alert = lampError;
      result.over_current_alert = overCurrent;
      result.under_voltage_alert = underVoltage;
      result.over_voltage_alert = overVoltage;
      result.low_power_factor_alert = lowPowerFactor;

      if (lampError) err.warnings.push('metering_lamp_error');
      if (overCurrent) err.warnings.push('metering_over_current');
      if (underVoltage) err.warnings.push('metering_under_voltage');
      if (overVoltage) err.warnings.push('metering_over_voltage');
      if (lowPowerFactor) err.warnings.push('metering_low_power_factor');

      result.power__W = dataView.getUint16();

      result.voltage__V = dataView.getUint16();

      result.power_factor = dataView.getUint8() / 100;
      return;
    // #ifndef VER1_0
    case 0x85:
      result.packet_type = 'deprecated_light_sensor_notification';
      result.active_dim_step = rawByte2;
      return;
    case 0x86:
      result.packet_type = 'location_notification';
      var loc_status = rawByte2;
      if (loc_status === 0x00){
        result.location_status = 'good_fix';
        result.latitude__deg = dataView.getFloat().toFixed(6);
        result.longitude__deg = dataView.getFloat().toFixed(6);
        result.last_fix_utc_time = decodeUnixEpoch(dataView.getUint32());
      } else if (loc_status === 0x01){
        result.location_status = 'no_fix';
      } else if (loc_status === 0x02 || loc_status === 0xFF){
        result.location_status = 'internal_error';
      } else {
        result.location_status = 'invalid_status';
      }
      return;
    // #endif
    default:
      err.errors.push('invalid_packet_type');
  }
}
// #endif
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
    // #ifdef VER1_0
    case 0x06:
      result.packet_type = 'calendar_config_request';
      return;
    case 0x08:
      result.packet_type = 'profile_config_request';
      var id = dataView.getUint8();
      result.profile_id = id === 0xFF ? 'all_profiles' : id;
      return;
    case 0x0A:
      result.packet_type = 'default_dim_config_request';
      return;
    case 0x0C:
      result.packet_type = 'holiday_config_request';
      return;
    case 0x0E:
      result.packet_type = 'defaults_config_request';
      return;
    case 0x13:
      result.packet_type = 'location_config_request';
      return;
    // #else
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
    // #endif
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
    // #ifndef VER1_0
    case 0xFE:
      result.packet_type = 'restart_controller_command';
      return;
    // #endif
    default:
      err.errors.push('invalid_command');
  }
}

function decodeByFport(fport, bytes, result, err) {
  var dataView = new BinaryExtract(bytes);
  if (dataView.availableLen() === 0) {
    err.errors.push('empty_payload');
    // #ifndef UPLINK_REMOVE
    // #ifdef VER1_0
  } else if (fport === 24) {
    statusParser1_0(dataView, result, err);
  } else if (fport === 25) {
    usageParser(dataView, result, err);
    // #else
  } else if (fport === 23) {
    statusParser1_1(dataView, result, err);
  } else if (fport === 26) {
    usageParser(dataView, result, err);
    // #endif
    // #endif
  } else if (fport === 49) {
    decodeFport49(dataView, result, err);
  } else if (fport === 50) {
    decodeFport50(dataView, result, err);
  } else if (fport === 51) {
    decodeFport51(dataView, result, err);
  } else if (fport === 60) {
    decodeFport60(dataView, result, err);
    // #ifndef UPLINK_REMOVE
  } else if (fport === 61) {
    decodeFport61(dataView, result, err);
  } else if (fport === 99) {
    decodeFport99(dataView, result, err);
    // #endif
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
    err.errors.push("decoder_error " + error.message);
  }
  return { data: res, errors: err.errors, warnings: err.warnings };
}
