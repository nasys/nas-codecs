import {BinaryExtract} from './util/extract';
import {pad, intToHexStr} from './util/misc';

export function meteringTimeFormat(meteringTime, err){
  if (meteringTime === 0xFF) {
    return 'live';
  } if (meteringTime > 143){
    err.errors.push('invalid_metering_time');
    return 'invalid_metering_time';
  } var minutesTotal = meteringTime * 10;
  var minutes = minutesTotal % 60;
  var hours = Math.floor(minutesTotal / 60);
  return pad(hours, 2) + ':' + pad(minutes, 2) + ':00Z';
}

function formatEpoch(time, err){ //1519740126 -> 27-02-2018T14:02:06Z
  var timeStr = '' + time
  if (timeStr.length !== 10){
    err.errors.push('invalid_date');
    return 'invalid_date';
  } return new Date(time * 1000).toISOString();
}

function formatDate(yymmdd, err){ // 200716 -> 2020-07-16
  var yymmddStr = '' + yymmdd;
  if (yymmddStr.length !== 6) {
    err.errors.push('invalid_date');
    return 'invalid_date';
  }
  return '20' + yymmddStr.slice(0,2) + '-' + yymmddStr.slice(2,4) + '-' + yymmddStr.slice(4,6);
}

function formatYymm(yymm, err){  // YY-MM---T
  var yymmStr = '' + yymm;
  if (yymmStr.length !== 4){
    err.errors.push('invalid_date');
    return 'invalid_date';
  } return yymmStr.slice(0,2) + '-' + yymmStr.slice(2,4)+'---T';
}

function formatDdhh(ddhh, err){
  var ddhhStr = '' + ddhh;
  if (ddhhStr.length !== 4){
    err.errors.push('invalid_time');
    return 'invalid_time';
  } return '--' + ddhhStr.slice(0,2) +'T'+ ddhhStr.slice(2,4) + ':00Z';
}

function formatTime(hhmmss, err){ // 192300 -> 19:23:00Z
  var hhmmssStr = '' + hhmmss;
  if (hhmmssStr.length !== 5 && hhmmssStr.length !== 6) {
    err.errors.push('invalid_time');
    return 'invalid_time';
  } if (hhmmssStr.length === 6){
    return hhmmssStr.slice(0,2) + ':' + hhmmssStr.slice(2,4) + ':' + hhmmssStr.slice(4,6) + 'Z';
} else if (hhmmssStr.length === 5){
    return '0' + hhmmssStr.slice(0,1) + ':' + hhmmssStr.slice(1,3) + ':' + hhmmssStr.slice(3,5) + 'Z';
  }
}

function meter_prog(value, result, err) {
  var val_str = value.toString();

  if (val_str.length !== 8) {
    err.errors.push('invalid_kamstrup_config_value');
    return 'invalid_value';
  }

  var flow_sensor_pos = {
    3: 'inlet',
    4: 'outlet',
  }[val_str[0]];

  if (!flow_sensor_pos) {
    err.errors.push('invalid_flow_sensor_pos');
  }

  var measuring_units = {
    2: 'GJ',
    3: 'kWh',
    4: 'MWh',
    5: 'Gcal',
  }[val_str[2]];

  if (!measuring_units) {
    err.errors.push('invalid_measuring_unit');
  }
  var flow_sensor_coding = val_str.slice(2,5) + ' ' + val_str.slice(5,8);
  result.kamstrup_flow_sensor_position = flow_sensor_pos;
  result.kamstrup_measuring_unit = measuring_units;
  result.kamstrup_flow_sensor_coding = flow_sensor_coding;
}

function meter_display(data, err){
  var data_cut = data.toString().slice(0,2) + 'x';
  var display_data = {
    '21x': 'heat_meter',
    '31x': 'heat_cooling_meter',
    '41x': 'heat_neter',
    '51x': 'cooling_meter',
    '61x': 'heat_cooling_meter',
    '71x': 'heat_volume_meter',
    '81x': 'cold_volume_meter',
    '91x': 'energy_meter'
  }[data_cut];
  if (!display_data) {
    err.errors.push('invalid_meter_display_value');
  }
  return display_data;
}

function meter_tariff(data, err){
  var data_str = data.toString();
  var tariff_data = {
    0: 'no_active_tariff',
    11: 'power_tariff',
    12: 'flow_tariff',
    13: 't1_t2_tariff',
    14: 'inlet_tariff',
    15: 'outlet_tariff',
    19: 'time_controlled_tariff',
    20: 'heat_cooling_volume_tariff',
    21: 'pq_tariff'
  }[data_str];
  if (!tariff_data){
    err.errors.push('invalid_meter_tariff_value');
  }
  return tariff_data;
}

function pulse_input(data, err, pulse_letter){
  var data_str = data.toString();
  var pulse_data = {
    1:	'100 m3/h',
    2:	'50 m3/h',
    3:	'25 m3/h',
    4:	'10 m3/h',
    5:	'5 m3/h',
    6:	'2.5 m3/h',
    7:	'1 m3/h',
    24:	'10 m3/h',
    25:	'5 m3/h',
    26:	'2.5 m3/h',
    27:	'1 m3/h',
    40:	'1000 m3/h',
    50:	'2500 kW',
    51:	'150 kW',
    52:	'120 kW',
    53:	'75 kW',
    54:	'30 kW',
    55:	'25 kW',
    56:	'20 kW',
    57:	'15 kW',
    58:	'7,5 kW',
    59:	'750 kW',
    60:	'1250 kW',
    61:	'75 kW',
    62:	'15 kW',
    70:	'25000 kW',
    71:	'100 m3/h',
    72:	'50 m3/h',
    73:	'25 m3/h',
    74:	'10 m3/h',
    75:	'5 m3/h',
    76:	'2.5 m3/h',
    77:	'1 m3/h',
    84:	'10 m3/h',
    85:	'5 m3/h',
    86:	'2.5 m3/h',
    87:	'1 m3/h',
    90:	'1000 m3/h'
    }[data_str];
    if (!pulse_data){
      err.errors.push('invalid_pulse_input_'.pulse_letter);
    }
    return pulse_data;
}

function meter_leakage_limit(data, err){
  var data_str = data.toString();
  var leakage_limits = {
    0: 'off',
    1: '1%_qp_+_20%_q',
    2: '1%_qp_+_10%_q',
    3: '05%_qp_+_20%_q',
    4: '05%_qp_+_10%_q'
  }[data_str];
  if (!leakage_limits){
    err.errors.push('invalid_meter_leakage_limits_v1_v2');
  }
  return leakage_limits;
}

function leakage_limit_cold(data, err){
  var data_str = data.toString();
  var leakage_limit = {
    0: 'off',
    1: '30min_no_pulse',
    2: '1h_no_pulse',
    3: '2h_no_pulse'
  }[data_str];
  if (!leakage_limit){
    err.errors.push('invalid_meter_leakage_limit_cold_ina_inb');
  }
  return leakage_limit;
}

function kamstrup_config1(conf, err){
  if(conf.length < 8){
    err.errors.push('Invalid_kamstrup_config_1_length')
  }else{
    return conf.slice(0,1) + ' ' + conf.slice(1,2) + ' ' + conf.slice(2,5) + ' ' + conf.slice(5,8)
  }
}

function bootParser(dataView, result, err){
  result.packet_type = 'boot_packet';
  result.device_serial = intToHexStr(dataView.getUint32(), 8);
  var maj = dataView.getUint8();
  var min = dataView.getUint8();
  var patch = dataView.getUint8();
  result.device_firmware_version = maj + '.' + min + '.' + patch;
  result.kamstrup_meter_id = dataView.getUint32() + 0x100000000 * dataView.getUint8();

  result.kamstrup_config_1 = kamstrup_config1(pad(dataView.getUint32(), 8), err);
  var raw_kamstrup_type = dataView.getUint16();
  var raw_kamstrup_tariff = dataView.getUint8();
  var raw_kamstrup_pulse_input_a = dataView.getUint8();
  var raw_kamstrup_pulse_input_b = dataView.getUint8();
  var raw_kamstrup_leakage_limits_v1_v2 = dataView.getUint8();
  var raw_kamstrup_leakage_limit_cold_ina_inb = dataView.getUint8();
  result.kamstrup_config_2 = raw_kamstrup_type + ' ' + pad(raw_kamstrup_tariff, 2) + ' ' + pad(raw_kamstrup_pulse_input_a, 2) + ' ' + raw_kamstrup_pulse_input_b + ' ' + pad(raw_kamstrup_leakage_limits_v1_v2, 2) + ' ' + pad(raw_kamstrup_leakage_limit_cold_ina_inb, 2);
  result.kamstrup_type = meter_display(raw_kamstrup_type, err);
  result.kamstrup_tariff = meter_tariff(raw_kamstrup_tariff, err);
  result.kamstrup_pulse_input_a = pulse_input(raw_kamstrup_pulse_input_a, err, 'a');
  result.kamstrup_pulse_input_b = pulse_input(raw_kamstrup_pulse_input_b, err, 'b');
  result.kamstrup_leakage_limits_v1_v2 = meter_leakage_limit(raw_kamstrup_leakage_limits_v1_v2);
  result.kamstrup_leakage_limit_cold_ina_inb = leakage_limit_cold(raw_kamstrup_leakage_limit_cold_ina_inb);

  intToHexStr(dataView.getUint32(), 8);

  var class_bits = dataView.getUint8Bits() 
  result.device_lorawan_class = class_bits.getBits(1) ? 'class_C' : 'class_A';

  result.device_time_utc = formatEpoch(dataView.getUint32())
}

function fixed_measurement_interval(interval, err){
  switch(interval){
    case 0x00:
      return fixed_measuring_interval = 'not_used';
    case 0x01:
      return fixed_measuring_interval = "10_min";
    case 0x02:
       return fixed_measuring_interval = "20_min";
    case 0x03:
      return fixed_measuring_interval = "30_min";
    case 0x04:
      return fixed_measuring_interval = "1_h";
    case 0x05:
      return fixed_measuring_interval = "24_h";
    default:
      err.errors.push('invalid_interval');
      return "invalid_interval";
    }
}

function value_conv(value){
  return Math.round((value + Number.EPSILON)*100)/100
}
export function extractRegister(dataView, err){
  var id = dataView.getUint8();
  switch (id) {
    case 1:
      var val = dataView.getUint32();
      return {name: 'date', val: formatDate(val, err), unit: ''};
    case 2:
      var val = dataView.getFloat();
      return {name: 'heat_energy_e1', val: value_conv(val), unit: 'kWh'};
    case 3:
      var val = dataView.getFloat();
      return {name: 'heat_energy_e2', val: value_conv(val), unit: 'kWh'};
    case 4:
      var val = dataView.getFloat();
      return {name: 'cooling_energy_e3', val: value_conv(val), unit: 'kWh'};
    case 5:
      var val = dataView.getFloat();
      return {name: 'intlet_energy_e4', val: value_conv(val), unit: 'kWh'};
    case 6:
      var val = dataView.getFloat();
      return {name: 'outlet_energy_e5', val: value_conv(val), unit: 'kWh'};
    case 7:
      var val = dataView.getFloat();
      return {name: 'tap_water_energy_e6', val: value_conv(val), unit: 'kWh'};
    case 8:
    var val = dataView.getFloat();
    return {name: 'tap_water_energy_e7', val: value_conv(val), unit: 'kWh'};
    case 9:
      var val = dataView.getUint32();
      return {name: 'energy_e8', val: value_conv(val), unit: ''};
    case 10:
      var val = dataView.getUint32();
      return {name: 'energy_e9', val: value_conv(val), unit: ''};
    case 11:
      var val = dataView.getUint32();
      return {name: 'tariff_ta2', val: value_conv(val), unit: ''};
    case 12:
      var val = dataView.getUint32();
      return {name: 'tariff_ta3', val: value_conv(val), unit: ''};
    case 13:
      var val = dataView.getFloat();
      return {name: 'volume_v1', val: value_conv(val), unit: 'm3'};
    case 14:
      var val = dataView.getFloat();
      return {name: 'volume_v2', val: value_conv(val), unit: 'm3'};
    case 15:
      var val = dataView.getUint32();
      return {name: 'pulse_input_a1', val: value_conv(val), unit: ''};
    case 16:
      var val = dataView.getUint32();
      return {name: 'pulse_input_b2', val: value_conv(val), unit: ''};
    case 17:
      var val = dataView.getFloat();
      return {name: 'mass_m1', val: value_conv(val), unit: 't'};
    case 18:
      var val = dataView.getFloat();
      return {name: 'mass_m2', val: value_conv(val), unit: 't'};
    case 19:
      var val = dataView.getUint32();
      return {name: 'operating_hours', val: value_conv(val), unit: ''};
    case 20:
      var val = dataView.getUint32();
      return {name: 'info_event_counter', val: value_conv(val), unit: ''};
    case 21:
      var val = dataView.getUint32();
      return {name: 'time', val: formatTime(val, err), unit: ''};
    case 22:
        var val = dataView.getUint32();
        return {name: 'info_code', val: value_conv(val), unit: ''};
    case 23:
      var val = dataView.getFloat();
      return {name: 't1_actual', val: value_conv(val), unit: 'C'};
    case 24:
      var val = dataView.getFloat();
      return {name: 't2_actual', val: value_conv(val), unit: 'C'};
    case 25:
      var val = dataView.getFloat();
      return {name: 't3_actual', val: value_conv(val), unit: 'C'};
    case 26:
      var val = dataView.getFloat();
      return {name: 't3_actual', val: value_conv(val), unit: 'C'};
    case 27:
      var val = dataView.getFloat();
      return {name: 't1_t2_diff_temp', val: value_conv(val), unit: 'C'};
    case 28:
      var val = dataView.getFloat();
      return {name: 'p1_actual', val: value_conv(val), unit: 'bar'};
    case 29:
      var val = dataView.getFloat();
      return {name: 'p2_actual', val: value_conv(val), unit: 'bar'};
    case 30:
      var val = dataView.getFloat();
      return {name: 'flow_v1_actual', val: value_conv(val), unit: 'L_per_h'};
    case 31:
      var val = dataView.getFloat();
      return {name: 'flow_v2_actual', val: value_conv(val), unit: 'L_per_h'};
    case 32:
      var val = dataView.getFloat();
      return {name: 'power_e1_actual', val: value_conv(val), unit: 'kW'};
    case 33:
      var val = dataView.getUint32();
      return {name: 'flow_v1_max_year_date', val: formatDate(val, err), unit: ''};
    case 34:
      var val = dataView.getFloat();
      return {name: 'flow_v1_max_year', val: value_conv(val), unit: 'L_per_h'};
    case 35:
      var val = dataView.getUint32();
      return {name: 'flow_v1_min_year_date', val: formatDate(val, err), unit: ''};
    case 36:
      var val = dataView.getFloat();
      return {name: 'flow_v1_min_year', val: value_conv(val), unit: 'L_per_h'};
    case 37:
      var val = dataView.getUint32();
      return {name: 'power_max_year_date', val: formatDate(val, err), unit: ''};
    case 38:
      var val = dataView.getFloat();
      return {name: 'power_max_year', val: value_conv(val), unit: 'kW'};
    case 39:
      var val = dataView.getUint32();
      return {name: 'power_min_year_date', val: formatDate(val, err), unit: ''};
    case 40:
      var val = dataView.getFloat();
      return {name: 'power_min_year', val: value_conv(val), unit: 'kW'};
    case 41:
      var val = dataView.getUint32();
      return {name: 'flow_v1_max_month_date', val: formatDate(val, err), unit: ''};
    case 42:
      var val = dataView.getFloat64();
      return {name: 'flow_v1_max_month', val: value_conv(val), unit: 'L_per_h'};
    case 43:
      var val = dataView.getUint32();
      return {name: 'flow_v1_min_month_date', val: formatDate(val, err), unit: ''};
    case 44:
      var val = dataView.getFloat64();
      return {name: 'flow_v1_min_month', val: value_conv(val), unit: 'L_per_h'};
    case 45:
      var val = dataView.getUint32();
      return {name: 'power_max_month_date', val: formatDate(val, err), unit: ''};
    case 46:
      var val = dataView.getFloat();
      return {name: 'power_max_month', val: value_conv(val), unit: 'kW'};
    case 47:
      var val = dataView.getUint32();
      return {name: 'power_min_month_date', val: formatDate(val, err), unit: ''};
    case 48:
      var val = dataView.getFloat();
      return {name: 'power_min_month', val: value_conv(val), unit: 'kW'};
    case 49:
      var val = dataView.getFloat();
      return {name: 't1_average_year', val: value_conv(val), unit: 'C'};
    case 50:
      var val = dataView.getFloat();
      return {name: 't2_average_year', val: value_conv(val), unit: 'C'};
    case 51:
      var val = dataView.getFloat();
      return {name: 't1_average_month', val: value_conv(val), unit: 'C'};
    case 52:
      var val = dataView.getFloat();
      return {name: 't2_average_month', val: value_conv(val), unit: 'C'};
    case 53:
      var val = dataView.getUint32();
      return {name: 'tariff_limit_tl2', val: value_conv(val), unit: ''};
    case 54:
      var val = dataView.getUint32();
      return {name: 'tariff_limit_tl3', val: value_conv(val), unit: ''};
    case 55:
      var val = dataView.getUint32();
      return {name: 'target-date', val: formatDate(val, err), unit: ''};
    case 56:
      var val = dataView.getUint32();
      return {name: 'program_no', val: value_conv(val), unit: ''};
    case 57:
      var val = dataView.getUint32();
      return {name: 'config_no_1', val: value_conv(val), unit: ''};
    case 58:
      var val = dataView.getUint32();
      return {name: 'config_no_2', val: value_conv(val), unit: ''};
    case 59:
      var val = dataView.getUint32();
      return {name: 'serial_no', val: value_conv(val), unit: ''};
    case 60:
      var val = dataView.getUint32();
      return {name: 'customer_no_2', val: value_conv(val), unit: ''};
    case 61:
      var val = dataView.getUint32();
      return {name: 'customer_no_1', val: value_conv(val), unit: ''};
    case 62:
      var val = dataView.getUint32();
      return {name: 'meter_no_input_a1', val: value_conv(val), unit: ''};
    case 63:
      var val = dataView.getUint32();
      return {name: 'meter_no_input_b1', val: value_conv(val), unit: ''};
    case 64:
        var val = dataView.getUint32();
        return {name: 'meter_type_incl_sw_editing', val: value_conv(val), unit: ''};
    case 65:
      var val = dataView.getUint32();
      return {name: 'sw_check_sum', val: value_conv(val), unit: ''};
    case 66:
      var val = dataView.getUint32();
      return {name: 'energy_high_res_test', val: value_conv(val), unit: ''};
    case 67:
      var val = dataView.getUint32();
      return {name: 'top_module_id', val: value_conv(val), unit: ''};
    case 68:
      var val = dataView.getUint32();
      return {name: 'base_moduele_1_id', val: value_conv(val), unit: ''};
    case 69:
      var val = dataView.getUint32();
      return {name: 'error_hour_counter', val: value_conv(val), unit: ''};
    case 70:
      var val = dataView.getUint32();
      return {name: 'pulse_value_a1_a2', val: value_conv(val), unit: ''};
    case 71:
      var val = dataView.getUint32();
      return {name: 'pulse_value_b1_b2', val: value_conv(val), unit: ''};
    case 72:
      var val = dataView.getFloat();
      return {name: 'e1_e2', val: value_conv(val), unit: 'kWh'};
    case 73:
      var val = dataView.getUint32();
      return {name: 'q_sum_1', val: value_conv(val), unit: ''};
    case 74:
      var val = dataView.getUint32();
      return {name: 'q_sum_2', val: value_conv(val), unit: ''};
    case 75:
      var val = dataView.getUint32();
      return {name: 'pre_counter_1', val: value_conv(val), unit: ''};
    case 76:
      var val = dataView.getUint32();
      return {name: 'pre_counter_2', val: value_conv(val), unit: ''};
    case 77:
        var val = dataView.getFloat();
        return {name: 'e_cold', val: value_conv(val), unit: 'kWh'};
    case 78:
      var val = dataView.getUint32();
      return {name: 'm3tf', val: value_conv(val), unit: ''};
    case 79:
      var val = dataView.getUint32();
      return {name: 'm3tr', val: value_conv(val), unit: ''};
    case 80:
        var val = dataView.getUint32();
        return {name: 'calendar', val: value_conv(val), unit: ''};
    case 81:
      var val = dataView.getFloat();
      return {name: 'p_power_act', val: value_conv(val), unit: 'kW'};
    case 82:
      var val = dataView.getFloat();
      return {name: 'p_power_year', val: value_conv(val), unit: ''};
    case 83:
      var val = dataView.getFloat();
      return {name: 'date_and_time', val: value_conv(val), unit: ''};
    case 84:
      var val = dataView.getFloat();
      return {name: 'energy_e10', val: value_conv(val), unit: 'kWh'};
    case 85:
      var val = dataView.getFloat();
      return {name: 'energy_e11', val: value_conv(val), unit: 'kWh'};
    case 86:
      var val = dataView.getUint32();
      return {name: 'differential_energy_de', val: value_conv(val), unit: ''};
    case 87:
      var val = dataView.getUint32();
      return {name: 'control_energy_ce', val: value_conv(val), unit: ''};
    case 88:
      var val = dataView.getUint32();
      return {name: 'differential_volume_dv', val: value_conv(val), unit: ''};
    case 89:
      var val = dataView.getUint32();
      return {name: 'control_volume_dv', val: value_conv(val), unit: ''};
    case 90:
      var val = dataView.getFloat();
      return {name: 'heat_energy_a1', val: value_conv(val), unit: 'kWh'};
    case 91:
      var val = dataView.getFloat();
      return {name: 'heat_energy_a2', val: value_conv(val), unit: 'kWh'};
    case 92:
      var val = dataView.getUint32();
      return {name: 'tariff_ta4', val: value_conv(val), unit: ''};
    case 93:
      var val = dataView.getUint32();
      return {name: 'tariff_limit_tl4', val: value_conv(val), unit: ''};
    case 94:
      var val = dataView.getUint32();
      return {name: 'pulse_value_v1', val: value_conv(val), unit: ''};
    case 95:
      var val = dataView.getUint32();
      return {name: 'pulse_value_v2', val: value_conv(val), unit: ''};
    case 96:
      var val = dataView.getUint32();
      return {name: 'qp_v1', val: value_conv(val), unit: ''};
    case 97:
      var val = dataView.getUint32();
      return {name: 'qp_v2', val: value_conv(val), unit: ''};
    case 98:
      var val = dataView.getUint32();
      return {name: 'pulse_input_a2', val: value_conv(val), unit: ''};
    case 99:
      var val = dataView.getUint32();
      return {name: 'pulse_input_b2', val: value_conv(val), unit: ''};
    case 100:
      var val = dataView.getUint32();
      return {name: 'meter_no_input_a2', val: value_conv(val), unit: ''};
    case 101:
      var val = dataView.getUint32();
      return {name: 'meter_no_input_b2', val: value_conv(val), unit: ''};
    case 102:
      var val = dataView.getUint32();
      return {name: 'info_bits', val: value_conv(val), unit: ''};
    case 103:
      var val = dataView.getFloat();
      return {name: 'flow_v1_max_year', val: value_conv(val), unit: 'L_per_h'};
    case 104:
      var val = dataView.getFloat();
      return {name: 'flow_v1_min_year', val: value_conv(val), unit: 'L_per_h'};
    case 105:
      var val = dataView.getFloat();
      return {name: 'power_max_year', val: value_conv(val), unit: 'kW'};
    case 106:
        var val = dataView.getFloat();
        return {name: 'power_min_year', val: value_conv(val), unit: 'kW'};
    case 107:
      var val = dataView.getFloat();
      return {name: 'flow_v1_max_month', val: value_conv(val), unit: 'L_per_h'};
    case 108:
      var val = dataView.getFloat();
      return {name: 'flow_v1_min_month', val: value_conv(val), unit: 'L_per_h'};
    case 109:
      var val = dataView.getFloat();
      return {name: 'power_max_month', val: value_conv(val), unit: 'kW'};
    case 110:
      var val = dataView.getFloat();
      return {name: 'power_min_month', val: value_conv(val), unit: 'kW'};
    case 111:
      var val = dataView.getFloat();
      return {name: 'flow_v1_max_day', val: value_conv(val), unit: 'L_per_h'};
    case 112:
      var val = dataView.getFloat();
      return {name: 'flow_v1_min_day', val: value_conv(val), unit: 'L_per_h'};
    case 113:
      var val = dataView.getUint32();
      return {name: 'cop', val: value_conv(val), unit: ''};
    case 114:
      var val = dataView.getUint32();
      return {name: 'cop_average_period', val: value_conv(val), unit: ''};
    case 115:
      var val = dataView.getUint32();
      return {name: 'cop_year', val: value_conv(val), unit: ''};
    case 116:
      var val = dataView.getUint32();
      return {name: 'cop_month', val: value_conv(val), unit: ''};
    case 117:
      var val = dataView.getFloat();
      return {name: 't1_time_average_day', val: value_conv(val), unit: 'C'};
    case 118:
      var val = dataView.getFloat();
      return {name: 't2_time_average_day', val: value_conv(val), unit: 'C'};
    case 119:
      var val = dataView.getFloat();
      return {name: 't3_time_average_day', val: value_conv(val), unit: 'C'};
    case 120:
        var val = dataView.getFloat();
        return {name: 't1_time_average_hour', val: value_conv(val), unit: 'C'};
    case 121:
      var val = dataView.getFloat();
      return {name: 't2_time_average_hour', val: value_conv(val), unit: 'C'};
    case 122:
      var val = dataView.getFloat();
      return {name: 't3_time_average_hour', val: value_conv(val), unit: 'C'};
    case 123:
      var val = dataView.getFloat();
      return {name: 'p1_average_day', val: value_conv(val), unit: 'kW'};
    case 124:
      var val = dataView.getFloat();
      return {name: 'p2_average_day', val: value_conv(val), unit: 'kW'};
    case 125:
      var val = dataView.getFloat();
      return {name: 'p1_average_hour', val: value_conv(val), unit: 'kW'};
    case 126:
      var val = dataView.getFloat();
      return {name: 'p2_average_hour', val: value_conv(val), unit: 'kW'};
    case 127:
      var val = dataView.getFloat();
      return {name: 't1_actual', val: value_conv(val), unit: 'C'};
    case 128:
      var val = dataView.getFloat();
      return {name: 't2_actual', val: value_conv(val), unit: 'C'};
    case 129:
      var val = dataView.getUint32();
      return {name: 't1_t2_diff_temp', val: value_conv(val), unit: ''};
    case 130:
      var val = dataView.getUint32();
      return {name: 'power_input_b1', val: value_conv(val), unit: ''};
    case 131:
      var val = dataView.getUint32();
      return {name: 'controlled_output_c1_c2', val: value_conv(val), unit: ''};
    case 132:
      var val = dataView.getUint32();
      return {name: 'controlled_output_d1_d2', val: value_conv(val), unit: ''};
    case 133:
      var val = dataView.getUint32();
      return {name: 'theta_hc', val: value_conv(val), unit: ''};
    case 134:
      var val = dataView.getUint32();
      return {name: 'temperature_offset', val: value_conv(val), unit: ''};
    case 135:
      var val = dataView.getFloat();
      return {name: 't2_preset', val: value_conv(val), unit: 'C'};
    case 136:
      var val = dataView.getFloat();
      return {name: 't5_limit', val: value_conv(val), unit: 'C'};
    case 137:
      var val = dataView.getUint32();
      return {name: 'qp_average time', val: value_conv(val), unit: ''};
    case 138:
      var val = dataView.getUint32();
      return {name: 'target_date_1_year', val: value_conv(val), unit: ''};
    case 139:
      var val = dataView.getUint32();
      return {name: 'target_date_2_year', val: value_conv(val), unit: ''};
    case 140:
      var val = dataView.getUint32();
      return {name: 'target_date_1_month', val: value_conv(val), unit: ''};
    case 141:
      var val = dataView.getUint32();
      return {name: 'target_date_2_month', val: value_conv(val), unit: ''};
    case 142:
      var val = dataView.getUint32();
      return {name: 'config_no_3', val: value_conv(val), unit: ''};
    case 143:
      var val = dataView.getUint32();
      return {name: 'config_no_4', val: value_conv(val), unit: ''};
    case 144:
      var val = dataView.getUint32();
      return {name: 'type_no', val: value_conv(val), unit: ''};
    case 145:
      var val = dataView.getUint32();
      return {name: 'din_meter_id', val: value_conv(val), unit: ''};
    case 146:
      var val = dataView.getUint32();
      return {name: 'sw_revision', val: value_conv(val), unit: ''};
    case 147:
      var val = dataView.getUint32();
      return {name: 'base_module_2_id', val: value_conv(val), unit: ''};
    case 148:
      var val = dataView.getUint32();
      return {name: 'external_module_id', val: value_conv(val), unit: ''};
    case 149:
      var val = dataView.getUint32();
      return {name: 'bus_pri_adr_module_1', val: value_conv(val), unit: ''};
    case 150:
      var val = dataView.getUint32();
      return {name: 'm_bus_sec_adr_module_1', val: value_conv(val), unit: ''};
    case 151:
      var val = dataView.getUint32();
      return {name: 'bus_pri_adr_module ', val: value_conv(val), unit: ''};
    case 152:
      var val = dataView.getUint32();
      return {name: 'm_bus_sec_adr_module_2', val: value_conv(val), unit: ''};
    case 153:
      var val = dataView.getUint32();
      return {name: 'bus_pri_adr_ext_module', val: value_conv(val), unit: ''};
    case 154:
      var val = dataView.getUint32();
      return {name: 'm_bus_sec_adr_ext_module', val: value_conv(val), unit: ''};
    case 155:
      var val = dataView.getUint32();
      return {name: 'm_bus_pri_adr_internal', val: value_conv(val), unit: ''};
    case 156:
      var val = dataView.getUint32();
      return {name: 'm_bus_sec_adr_internal', val: value_conv(val), unit: ''};
    case 157:
      var val = dataView.getUint32();
      return {name: 'config_counter', val: value_conv(val), unit: ''};
    case 158:
      var val = dataView.getUint32();
      return {name: 'time_stamp_1_(yy.mm)', val: formatYymm(val, err), unit: ''};
    case 159:
      var val = dataView.getUint32();
      return {name: 'time_stamp_1_(dd.hh)', val: formatDdhh(val, err), unit: ''};
    case 160:
      var val = dataView.getUint32();
      return {name: 'type_approval_rev_heat', val: value_conv(val), unit: ''};
    case 161:
      var val = dataView.getUint32();
      return {name: 'type_approval_rev_cooling', val: value_conv(val), unit: ''};
    case 162:
      var val = dataView.getUint32();
      return {name: 'type_approval_rev_national', val: value_conv(val), unit: ''};
    case 163:
      var val = dataView.getFloat();
      return {name: 'e1_high_res_auto_int', val: value_conv(val), unit: 'kWh'};
    case 164:
      var val = dataView.getFloat();
      return {name: 'e3_high_res_auto_int', val: value_conv(val), unit: 'kWh'};
    case 165:
      var val = dataView.getFloat();
      return {name: 'v1_high_res_auto_int', val: value_conv(val), unit: 'm3'};
    case 166:
      var val = dataView.getFloat();
      return {name: 't1_avg_auto_int', val: value_conv(val), unit: 'C'};
    case 167:
      var val = dataView.getFloat();
      return {name: 't2_avg_auto_int', val: value_conv(val), unit: 'C'};
    case 168:
      var val = dataView.getUint32();
      return {name: 'a1_auto_int', val: value_conv(val), unit: ''};
    case 169:
      var val = dataView.getUint32();
      return {name: 'a2_auto_int', val: value_conv(val), unit: ''};
    case 170:
      var val = dataView.getFloat();
      return {name: 'e1_hige_res', val: value_conv(val), unit: 'kWh'};
    case 171:
      var val = dataView.getFloat();
      return {name: 'e3_high_res', val: value_conv(val), unit: 'kWh'};
    case 172:
        var val = dataView.getFloat();
        return {name: 'v1_high_res', val: value_conv(val), unit: 'm3'};
    case 173:
      var val = dataView.getFloat();
      return {name: 'v1_reverse', val: value_conv(val), unit: 'm3'};
    case 174:
      var val = dataView.getUint32();
      return {name: 'volume_high_res_test', val: value_conv(val), unit: ''};
    case 175:
      var val = dataView.getUint32();
      return {name: 'optical_eye_lock', val: value_conv(val), unit: ''};
    default:
      err.errors.push('invalid_register ' + id);
      return null;
  }
}

function extractRegisters(dataView, result, err){
  while (dataView.availableLen()){
    var res = extractRegister(dataView, err);
    var key = res.name;
    if (res.unit.length) {
      key = res.name + '__' + res.unit;
    }result["kamstrup_" + key] = res.val;
  }
}

function extractRegisterList(dataView, result, err){
  const out = [];
  while (dataView.availableLen()){
    var id = dataView.getUint8();
    var fakeBuffer = [id, 0, 0, 0, 0];
    var fakeError = {errors: [], warnings: []};
    var fakeDataView = new BinaryExtract(fakeBuffer);
    var res = extractRegister(fakeDataView, fakeError);
    if (res != null){
      out.push(res.name);
    }
    else {
      err.errors.push('invalid_register_' + res.name);
      break;
    }
  }result.kamstrup_registers = out;
}

function statusParser(dataView, result, err){
  result.packet_type = 'status_packet';
  var meteringTimeRaw = dataView.getUint8();
  result.metering_time = meteringTimeFormat(meteringTimeRaw, err);
  var utc = dataView.getUint32();
  var date = new Date(utc * 1000);
  result.utc_timestamp = date.toISOString().replace(/.\d+Z$/g, 'Z');
  result.sensor_battery = dataView.getUint8();
  result.sensor_rssi__dBm = dataView.getInt8();
  extractRegisters(dataView, result, err);
}

function usageParser(dataView, result, err){
  var header = dataView.getInt8();
  if(header === 0x00){
    result.packet_type = 'usage_packet';
    var measuring_time = dataView.getUint8();
    result.measuring_time = meteringTimeFormat(measuring_time, err);
    extractRegisters(dataView, result ,err);
    return;
  } else if (header === 0x02){
    result.packet_type = 'pulse_usage_packet';
    var measuring_time = dataView.getUint8();
    result.measuring_time = meteringTimeFormat(measuring_time, err);
    result.kamstrup_pulse_1_count = dataView.getUint32();
    result.kamstrup_pulse_2_count = dataView.getUint32();
    return;
  }
  else{
    err.errors.push('invalid_packet_header');
    return;
  }
}

function configuration_packet(dataView, result, err){
  var header = dataView.getUint8();
  switch (header){
    case 0x00:
      result.packet_type = 'interval_config';
      result.usage_interval__s = dataView.getUint32();
      result.status_interval__s = dataView.getUint32();
      var bits = dataView.getUint8Bits();
      bits.getBits(1);
      result.kamstrup_pulse_inputs_enable = bits.getBits(1);
      result.lorawan_class = bits.getBits(1) === true ? 'class_C' : 'class_A';
      result.fixed_measurement_enabled = bits.getBits(1);
      var interval = bits.getBits(3);
      result.fixed_measuring_interval = fixed_measurement_interval(interval, err);
      break;
    case 0x01:
      result.packet_type = 'usage_register_config';
      extractRegisterList(dataView, result, err);
      break;
    case 0x02:
      result.packet_type = 'status_register_config';
      extractRegisterList(dataView, result, err);
      break;
    case 0x03:
      var utc = dataView.getUint32();
      var date = new Date(utc * 1000);
      result.packet_type = 'device_time_config';
      result.device_clock = date.toISOString().replace(/.\d+Z$/g, 'Z');
      break;
    case 0x04:
      result.packet_type = 'device_time_offset_config';
      result.device_time_offset__s = dataView.getInt16();
      break;
    default:
      err.errors.push('invalid_packet_type');
      break;
  }
}

function update_mode_packet(dataView, result ,err){
  var header = dataView.getUint8();
  if (header !== 0xFF){
    err.errors.push('invalid_command');
  } else{
    result.packet_type = 'activate_dfu_command';
  }
}

function command_message(dataView, result, err){
  var header = dataView.getUint8();
  switch (header){
    case 0x00:
      result.packet_type = 'request_register_values';
      extractRegisterList(dataView, result, err);
      break;
    case 0x02:
      result.packet_type = 'request_digital_inputs';
      break;
    case 0x03:
      result.packet_type = 'request_historic_data';
      var val = dataView.getUint8();
      if (val === 0xFF) {
        err.errors.push("invalid_time");
      }
      result.measurement_time = meteringTimeFormat(val);
      break;
    default:
      err.errors.push('invalid_command');
      break;
  }
}

function boot_debug_packet(dataView, result, err){
  var header = dataView.getUint8();
  switch (header) {
    case 0x00:
      bootParser(dataView, result, err);
      break;
    case 0x01:
      result.packet_type = 'shutdown_packet';
      break;
    case 0x31:
      result.packet_type = 'shutdown_packet';
      break;
    default:
      err.errors.push('invalid_packet_type');
  }
}

function decodeByFport(fport, bytes, result, err) {
  if (bytes.length === 0) {
    err.errors.push('empty_payload');
    return;
  } var dataView = new BinaryExtract(bytes);
  switch (fport) {
    case 24:
      statusParser(dataView, result, err);
      break;
    case 25:
      usageParser(dataView, result, err);
      break;
    case 50:
      configuration_packet(dataView, result, err);
      break;
    case 51:
      update_mode_packet(dataView, result, err);
      break;
    case 60:
      command_message(dataView, result, err);
      break;
    case 99:
      boot_debug_packet(dataView, result, err);
      break;
    default:
      err.errors.push('invalid_fport');
      break;
  }
  if (dataView.availableLen() > 0) {
    err.errors.push('packet_too_long');
  }
}

export function decodeRaw(fport, bytes){
  var res = {};
  var err = { errors: [], warnings: [] };
  try {
    decodeByFport(fport, bytes, res, err);
  } catch (error) {
    err.errors.push("decoder_error " + error.message);
  } 
  return { data: res, errors: err.errors, warnings: err.warnings };
}