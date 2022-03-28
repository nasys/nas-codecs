function isObj(a) {
    return typeof(a) === "object" && a !== null;
}

function isArray(a) {
    return Array.isArray(a) === true;
}

function replaceAll(string, search, replace) {
    return string.toString().split(search).join(replace);
}

function formatRecursive(obj) {
    if (isArray(obj)) {
        var res = [];
        for (let o of obj) {
            res.push(formatRecursive(o));
        }
        return res;
    }
    if (isObj(obj)) {
        if ("value" in obj) {
            var val = obj["value"];
            var date = new Date(val);
            if (date != "Invalid Date" && date.toISOString() == val) {
                val = val.replace("T", " ").replace(".000Z", " UTC");
            }
            if ("unit" in obj)
                return "" + val + " " + obj["unit"];
            return replaceAll(obj["value"], "_", " ");
        }
        else {
            var res2 = {};
            for (var k in obj) {
                res2[k] = formatRecursive(obj[k]);
            }
            return res2;
        }
    }
    return obj;
}

export function toFormatted(decoded) {
    var res = formatRecursive(decoded.data);
    var output = {"data": res};
    if(decoded.warnings.length)
        output.warnings = decoded.warings;
    if(decoded.errors.length)
        output.errors = decoded.errors;    
    return output;
}