// Functions for post-proccessing the ul20xx decoder result

export function formatElementStrValueUnit(value, unit) {
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

// eslint-disable-next-line no-unused-vars
export function formatElementStrValue(value, unit) {
  return value.toString();
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
    element.forEach(function (item) {
      output2.push(convertObjRecursive(item, elementFormatter));
    });
    return output2;
  }
  return element;
}

export function convertObjToFormatted(decoded, elementFormatter) {
  var converted = {};
  // eslint-disable-next-line no-restricted-syntax
  for (var key in decoded) {
    if (decoded[key] !== undefined && decoded[key]) {
      converted[key] = convertObjRecursive(decoded[key], elementFormatter);
    }
  }
  return converted;
}
