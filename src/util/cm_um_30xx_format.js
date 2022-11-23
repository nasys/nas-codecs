// Functions for post-proccessing the cm30xx and um30xx decoder result

function _extract_unit_from_key(key) {
    // key with unit looks like "meter_accumulated_volume__m3"
    var spl = key.split("__");
    var unit = spl.length > 1 ? spl[1] : "";
    if (unit == "C")
        unit = unit.replace("C", "°C");
    unit = unit.replaceAll("_", "/");
    unit = unit.replace("3", "³")
    unit = unit.replace("deg", "°")
    return unit
}

export function formatElementJson(key_printable, value, formatted_value, unit) {
    var element = {name:key_printable, value: value};
    if(unit.length > 0) {
        element.unit = unit;
    }
    if (formatted_value) {
        element.formatted = formatted_value;
    }
    return element
}

export function formatElementStrValueUnit(key_printable, value, formatted_value, unit) {
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

export function formatElementStrValue(key_printable, value, formatted_value, unit) {
    return value.toString();
}


export function convertToFormatted(decoded, elementFormatter, out_is_list) {
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
