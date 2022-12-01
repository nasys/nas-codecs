// Functions for post-proccessing the cm30xx and um30xx decoder result

function extractUnitFromKey(key) {
  // key with unit looks like "meter_accumulated_volume__m3"
  var spl = key.split('__');
  var unit = spl.length > 1 ? spl[1] : '';
  if (unit === 'C') { unit = unit.replace('C', '°C'); }
  unit = unit.replaceAll('_', '/');
  unit = unit.replace('3', '³');
  unit = unit.replace('deg', '°');
  return unit;
}

export function formatElementJson(keyPrintable, value, formattedValue, unit) {
  var element = { name: keyPrintable, value };
  if (unit.length > 0) {
    element.unit = unit;
  }
  if (formattedValue) {
    element.formatted = formattedValue;
  }
  return element;
}

export function formatElementStrValueUnit(keyPrintable, value, formattedValue, unit) {
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
  return res.replaceAll('_', ' ');
}

// eslint-disable-next-line no-unused-vars
export function formatElementStrValue(keyPrintable, value, formattedValue, unit) {
  return value.toString();
}

export function convertToFormatted(decoded, elementFormatter, outIsList) {
  var converted = outIsList ? [] : {};
  var hidden = outIsList ? [] : {};
  for (var key in decoded) {
    if (key.split('_formatted').length > 1) {
      // key containing '_formatted' must have its pair, so skip _formatted
      // e.g. with 'actuality_duration_formatted' also must exist e.g. 'actuality_duration__minutes'
      continue;
    }
    var paramName = key.split('__')[0];
    var value = decoded[key];

    var formattedValue = null;
    if (paramName + '_formatted' in decoded) {
      formattedValue = decoded[paramName + '_formatted'];
    }

    var unit = extractUnitFromKey(key);

    var keyPrintable = paramName;
    var isHiddenParam = keyPrintable[0] == '_';
    if (isHiddenParam) {
      // remove first empty char
      keyPrintable = keyPrintable.slice(1);
    }

    var element = elementFormatter(keyPrintable, value, formattedValue, unit);

    if (isHiddenParam) {
      if (outIsList) { hidden.push(element); } else { hidden[paramName] = element; }
    } else if (outIsList) { converted.push(element); } else { converted[paramName] = element; }
  }
  return { hidden, data: converted };
}
