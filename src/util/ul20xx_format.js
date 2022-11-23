// Functions for post-proccessing the ul20xx decoder result

export function formatElementStrValueUnit(value, unit) {
    var res = value.toString();
    if(unit.length > 0) {
        var float_val = +(res);
        if (!isNaN(float_val)) {
            // only add unit if it is value
            res = res + " " + unit;
        }
    }
    return res
}

export function formatElementStrValue(value, unit) {
    return value.toString();
}

function convertObjRecursive(element, elementFormatter) {
    if (element.constructor == Object) {
        // is dictionary

        if ("value" in element) {
            var val = element["value"];
            var unit = "unit" in element ? element["unit"] : "";
            return elementFormatter(val, unit)
        }
        else {
            let output = {};
            for (const [key, value] of Object.entries(element)) {
                output[key] = convertObjRecursive(value, elementFormatter);
            }
            return output;
        }
    }
    if(element instanceof Array) {
        // is array
        let output = [];
        element.forEach(function(item) {
            output.push(convertObjRecursive(item, elementFormatter));
        });
        return output;
    }
}

export function convertObjToFormatted(decoded, elementFormatter) {
    var converted = {};
    for(const key in decoded) {
        converted[key] = convertObjRecursive(decoded[key], elementFormatter);
    }
    return converted;
}
