import { tmbus, ln, sum, b2hs } from "../third_party/tmbus/tmbus.js";
import { pad, intToHexStr } from './misc';

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _ba2hs(a, s) {
  var r = [],
    i = 0;
  while (i < ln(a)) r.push(b2hs(a[i++]));
  return r.join(s || "");
}

// Function that assembles fake bytes around variable block to from valid mbus frame.
function invoke_tmbus(block_arr) {
  var len = ln(block_arr) + 21;
  var data_arr = [0x68, len - 6, len - 6, 0x68, 0x08, 0x02, 0x72, 0x78, 0x56, 0x34, 0x12, 0x24, 0x40, 0x01, 0x07, 0x55, 0x00, 0x00, 0x00].concat(Array.from(block_arr));
  var crc = sum(data_arr, 4, len - 2);
  data_arr.push(crc, 0x16);
  var res = tmbus(_ba2hs(data_arr));
  return {
    data: res.data,
    errors: res.errors
  };
}
function convert_units(unit) {
  unit = unit.replace(/\s+/g, '');
  // e.g. "american gallon/min", "american gallon/h"
  // key with unit looks like "meter_accumulated_volume__m3"
  // let unit = key.split('__')[1] || '';
  unit = unit.replace(' ', '_');
  unit = unit.replace('/', '_per_');
  unit = unit.replace('³', '3');
  unit = unit.replace('°', 'deg');
  return unit;
}
function convert_time_to_iso(x) {
  var iso_time = x.y + '-' + pad(x.m, 2) + '-' + pad(x.d, 2);
  if (x.hr) {
    iso_time += 'T' + pad(x.hr, 2) + ':' + pad(x.mi, 2);
  }
  return iso_time;
}
// , "VIF contains uncorrected unit instead of corrected unit", 
// "Accumulation only if positive contributions",
// "Accumulation of abs value only if negative contributions"
function convert_datarecords(data) {
  var result = {};
  var _iterator = _createForOfIteratorHelper(data),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var obj = _step.value;
      var storage_num = obj.storage;
      var storage_str = "";
      if (storage_num > 0) {
        storage_str = 'storage' + storage_num + "_";
      }

      // first regex replaces white spaces, the second one removes brackets
      var type_str = obj.type.replace(/\s+/g, '_').replace(/_\(.*?\)/g, '');
      var name_extra = '';
      if (obj.typeE) {
        for (var i = 0; i < obj.typeE.length; i++) {
          if (obj.typeE[i] && obj.typeE[i].trim() !== "") {
            var _value = obj.typeE[i];
            // Define mapping of values to replace
            var valueMap = {
              "VIF contains uncorrected unit": "_VIF",
              "Accumulation only if positive contributions": "_accumulated_pos",
              "Accumulation of abs value only if negative contributions": "_Accumulated_neg"
            };
            // Replace values
            for (var key in valueMap) {
              _value = _value.replace(key, valueMap[key]);
            }
            console.log("Value ".concat(i + 1, ": ").concat(_value));
            name_extra = _value;
          }
        }
      }
      var func_lookup = {
        "Instantaneous": "",
        "Maximum": "_max",
        "Minimum": "_min",
        "During error state": "_during_error"
      };
      var func_str = "";
      if (obj.func) {
        func_str = func_lookup[obj.func];
      }
      var tariff_str = '';
      if (obj.tariff) {
        tariff_str = 'tariff' + obj.tariff + '_';
      }
      var subunit_str = '';
      if (obj.device) {
        subunit_str = 'subunit' + obj.device + '_';
      }
      var value = obj.value;
      if (obj.type.includes("Time Point")) {
        value = convert_time_to_iso(value);
      }
      var unit_str = "";
      if (obj.unit) {
        unit_str = '__' + convert_units(obj.unit);
        if (obj.unit == "binary") {
          var len = obj.dif[0] & 0x0F;
          value = "0x" + intToHexStr(obj.value, len * 2);
        }
      }
      var name_parts = [storage_str, subunit_str, tariff_str, type_str, name_extra, func_str];
      var cleaned_parts = name_parts.filter(function (part) {
        return part !== undefined;
      });
      var name = cleaned_parts.join('').toLowerCase();
      name = name.replace("__", "_");
      name += unit_str;
      result[name] = value;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return result;
}
export function decode_mbus(byte_array) {
  var decoded_tmbus = invoke_tmbus(byte_array);
  return convert_datarecords(decoded_tmbus.data);
}
export function byte_arr_2_hex(byte_arr) {
  var s = "";
  var r = [],
    i = 0;
  while (i < ln(byte_arr)) r.push(b2hs(byte_arr[i++]));
  return r.join(s || "");
}