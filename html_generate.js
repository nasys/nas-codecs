import * as fs from 'fs';

if (process.argv.length < 4) {
    console.log("please add file name and device title as arguments")
}
var filename = process.argv[2]
var device_name = process.argv[3]

var codec_script = fs.readFileSync(filename).toString()
var html = `
<!DOCTYPE html>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<html>
<body>
<h2>Codec for NAS ` +
device_name +
`</h2>

  <select id="link_dir">
    <option value="uplink">Uplink (from device)</option>
    <option value="downlink">Downlink (to device)</option>
  </select>
  <label>fPort:</label>
  <input type="text" id="fport"><br><br>
  <label>Payload in hex:</label>
  <input type="text" id="payload_hex" size="50"><br><br>

<table style="width:100%;">
    <tr>
       <td style="width:50%;vertical-align: top;">
        <h4>Formatted result</h4>
        <p id="left_area"></p>
       </td>
       <td style="width:50%;vertical-align: top;">
        <h4>Raw result</h4>
        <p id="right_area"></div>
       </td>
    </tr>
 </table>


<script>
` + 
codec_script + 
`
function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function runOnPageLoad() {
	var input = document.getElementById('fport');

	if(input.value.length == 0)
        input.value = "25";	
}

window.onload = runOnPageLoad;

function decodeDownlinkFormatted(fport, bytes) {
    var dec = decodeRawDownlink(fport, bytes);
    var res = toFormatted(dec);
    return res;
}

function decodeUplinkFormatted(fport, bytes) {
    var dec = decodeRawUplink(fport, bytes);
    var res = toFormatted(dec);
    return res;
}

const dataInputHandler = function(e) {
    var raw_hex = document.getElementById('payload_hex').value;
    var direction = document.getElementById('link_dir').value;
    var fport = parseInt(document.getElementById('fport').value);
    console.log(fport);
    var buffer = hexToBytes(raw_hex.replace(/\s/g,''));
    if(direction == 'uplink') {
        var res = decodeUplinkFormatted(fport, buffer);
    }
    else {
        var res = decodeDownlinkFormatted(fport, buffer);
    }

    var str_out = JSON.stringify(res, null, 2);

	str_out = '<pre>'+str_out.replace(/\\n/g, '<br />') + '</pre>';
	console.log(str_out);

    if(direction == 'uplink') {
        var dec_raw = decodeRawUplink(fport, buffer);
    }
    else {
        var dec_raw = decodeRawDownlink(fport, buffer);
    }
    var str_raw = JSON.stringify(dec_raw, null, 2);
	str_raw = '<pre>'+str_raw.replace(/\\n/g, '<br />') + '</pre>';

    document.getElementById("left_area").innerHTML = str_out;
    document.getElementById("right_area").innerHTML = str_raw;
}

document.getElementById('payload_hex').addEventListener('input', dataInputHandler);  
document.getElementById('fport').addEventListener('input', dataInputHandler);  
document.getElementById('link_dir').addEventListener('input', dataInputHandler);  


</script>

</body>
</html>
`;

const html_filename = filename.replace(".js", ".html");
fs.writeFileSync(html_filename, html);