import * as fs from 'fs';

if (process.argv.length < 4) {
  throw Error('Missing device title and/or firmware as arguments');
}

var device_name = process.argv[2];
var device_firmware = process.argv[3];
console.log('Generating for: ' + device_name + ' ' + device_firmware);

if (device_name == 'CM30xx') {
  if (device_firmware == '2.3.x') {
    var script_filename = 'generated/cm30xx_2_3_x_decoder.js';
  } else {
    throw Error('ERROR, unrecognized firmware version: ' + device_firmware);
  }
  var device_firmware_str = '1.3.x / 2.3.x';
  var default_payload = '04C10084433F254E00752B036BD1164A337C44983938';
  var supported_devices = 'Supported devices: CM3011, CM3013, CM3021, CM3022, CM3030, CM3040, CM3061, CM3061, CM3080, CM3120, CM3130 with 1.3.x and 2.3.x firmwares.';
  var fport_options = `
        <option value="25">25 - Usage / Status</option>
        <option value="49">49 - Config Requests</option>
        <option value="50">50 - Configurations</option>
        <option value="51">51 - DFU Command</option>
        <option value="60">60 - Commands</option>
        <option value="61">61 - Event Notification</option>
        <option value="62">62 - Diagnostic</option>
        <option value="99">99 - System Messages</option>
        <option value="20">20 - OMS over LoRaWAN</option>`
} else if (device_name == 'UM30xx') {
  if (device_firmware == '4.0.x') {
    var script_filename = 'generated/um30xx_4_0_x_decoder.js';
  } else {
    throw Error('ERROR, unrecognized firmware version: ' + device_firmware);
  }
  var device_firmware_str = device_firmware;
  var default_payload = '82826BD1164A337C432326B29AD03C0138271501170600002090241262700374301C00';
  var supported_devices = 'Supported devices: UM3070, UM3081, UM3090, UM3100, UM3110, UM3140 with ' + device_firmware + ' firmware.';
  var fport_options = `
        <option value="24">24 - Status</option>
        <option value="25">25 - Usage</option>
        <option value="49">49 - Config Requests</option>
        <option value="50">50 - Configurations</option>
        <option value="51">51 - DFU Command</option>
        <option value="60">60 - Commands</option>
        <option value="61">61 - Event Notification</option>
        <option value="62">62 - Diagnostic</option>
        <option value="99">99 - System Messages</option>`;
} else if (device_name == 'UL20xx') {
  var device_firmware_str = device_firmware;
  if (device_firmware == '1.0.x') {
    var supported_devices = 'Supported devices: UL2002, UL2003, UL2014, UL2020, UL2021, UL2023, UL2030, UL2033 with 1.0.x firmwares.';
    var script_filename = 'generated/ul20xx_1_0_x_decoder.js';
    var default_payload = 'DFD41D5E004B041502AE05050AFF32030306FF00';
    var fport_options = `
    <option value="24">24 - Status</option>
    <option value="25">25 - Usage</option>
    <option value="49">49 - Config Requests</option>
    <option value="50">50 - Configurations</option>
    <option value="51">51 - DFU Command</option>
    <option value="60">60 - Commands</option>
    <option value="61">61 - Event Notification</option>
    <option value="99">99 - System Messages</option>`;
  } else if (device_firmware == '1.1.x') {
    var supported_devices = 'Supported devices: UL2002, UL2003, UL2014, UL2020, UL2021, UL2023, UL2024, UL2030, UL2033, UL2034, UL2053 with 1.1.x firmwares.';
    var script_filename = 'generated/ul20xx_1_1_x_decoder.js';
    var default_payload = '01F37F205E8244320916200701D20294550401FE50190012501900';
    var fport_options = `
    <option value="23">23 - Status</option>
    <option value="26">26 - Usage</option>
    <option value="49">49 - Config Requests</option>
    <option value="50">50 - Configurations</option>
    <option value="51">51 - DFU Command</option>
    <option value="60">60 - Commands</option>
    <option value="61">61 - Event Notification</option>
    <option value="99">99 - System Messages</option>`;
  } else {
    throw Error('ERROR, unrecognized firmware version: ' + device_firmware);
  }
} else if (device_name == 'IM30xx') {
  if (device_firmware == '0.9.x' || device_firmware == '0.10.x') {
    var script_filename = 'generated/im30xx_0_9_x_decoder.js';
  } else {
    throw Error('ERROR, unrecognized firmware version: ' + device_firmware);
  }

  var device_firmware_str = "0.9.x / 0.10.x";
  var default_payload = 'FF36E20F5FFF9D010C1003003B0C1D6500';
  var supported_devices = 'Supported devices: IM3060 with 0.9.x and IM3100 with 0.10.x firmwares.';
  var fport_options = `
        <option value="24">24 - Status</option>
        <option value="25">25 - Usage</option>
        <option value="50">50 - Configuration</option>
        <option value="51">51 - DFU COMMAND</option>
        <option value="60">60 - Commands</option>
        <option value="99">99 - System Messages</option>`;
}
else {
  throw Error('Unknown device name defined');
}

var generated_at = new Date().toISOString();
var codec_script = fs.readFileSync(script_filename).toString();
var html = `
<!DOCTYPE html>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<html>
<head>
<style>
    body {background-color: white; padding:0px; margin:0px; font-family: Helvetica; font-weight: lighter;}
    h2   {background-color: #004f9e; color: white; font-weight:normal; padding: 10px; margin-block-start:0em;}
    pre  {font-family: monospace; font-size: 9.5pt;}
    span.dim {color: #bbbbbb;}
    .footer{position: fixed; text-align: left; bottom: 0px; width: 100%; color: #bbbbbb; background-color: white; padding-left: 10px; font-size: 9pt;}
</style>
</head>
<body>
<h2>NAS ` + device_name + ' Payload Decoder for ' + device_firmware_str + `</h2>
<div style="padding-left: 10px;">
  <label>` + supported_devices + `</label><br><br>
  <label for="fport">fPort: </label>
  <select id="fport">
  ` + fport_options + `
  </select><br><br>
  <label for="checkbox">Encoding Base64 / Hex: </label>
  <input type="checkbox" id="payload_is_base64"><br><br>
  <label for="payload_raw">Payload: </label>
  <input type="text" id="payload_raw" size="100"><br><br>
<p id="demo"></p>
</div>
<div class="footer">Generated at ` + generated_at + `</div>
<script>

/// CODEC JAVASCRIPT STARTS FROM HERE

` + codec_script + `

// END THE COPY SELECTION HERE

function filterForHex(raw) {
    return raw.replace(/[^a-fA-F0-9]/g,'');
}

function filterForBase64(raw) {
    return raw.replace(/[^a-zA-z0-9+\/=]/g,'');
}

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function base64ToBytes(base64) {
    try {
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    } catch(err) {
        return [];
    }
}

function runOnPageLoad() {
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString);
    var hex = urlParams.get('hex');
    var fport = urlParams.get('fport');
    if (hex && fport){
      var raw = hex;
      var fport = parseInt(fport);
      document.getElementById('fport').value = fport;
      var filtered = filterForHex(raw)
      var buffer = hexToBytes(filtered)
      var res = decodeRaw(fport, buffer);
      document.getElementById('payload_raw').value = filtered;
      setOutput(res);
    } else {
      document.getElementById('payload_raw').value = "` + default_payload + `";
      dataInputHandler();
    }
}

window.onload = runOnPageLoad;    
 
function is_base64() {
    return document.getElementById('payload_is_base64').checked;
}

const base64InputHandler = function(e) {
    document.getElementById('payload_raw').placeholder= (is_base64() ? "Paste base64" : "Paste hex");
    document.getElementById('payload_raw').value = "";
}

function jsonToHtmlFormatter(json_txt) {
	var html_out = '<pre>'+json_txt.replace(/\\n/g, '<br />') + '</pre>';
    return html_out.replace(/(["{[\\]},:])/g, '<span class="dim">$1</span>');
}

function replaceUrlParams(fport, hex) {
  var url = new URL(window.location);
  var searchParams = url.searchParams;

  if (fport !== '') {
      searchParams.set('fport', fport);
  } else {
      searchParams.delete('fport');
  }

  if (hex !== '') {
      searchParams.set('hex', hex);
  } else {
      searchParams.delete('hex');
  }
  var newUrl = url.protocol + '//' + url.host + url.pathname + '?' + searchParams.toString();
  window.history.replaceState({}, '', newUrl);
}

function setOutput(res) {
  var str_json = JSON.stringify(res, null, 2);
	str_html = jsonToHtmlFormatter(str_json);
	console.log(str_html);
    document.getElementById("demo").innerHTML = str_html;
}

const dataInputHandler = function(e) {
    var raw = document.getElementById('payload_raw').value;
    var fport = parseInt(document.getElementById('fport').value);
    var buffer;
    if (is_base64()) {
      var filtered = filterForBase64(raw);
      document.getElementById('payload_raw').value = filtered;
  
      var buffer = Array.from(base64ToBytes(filtered));
  
    }
    else {
      var filtered = filterForHex(raw);
      if (filtered.length % 2 !== 0) {
        var res = { error: "invalid_hex_input" };
        setOutput(res);
        return;
      }
      document.getElementById('payload_raw').value = filtered;
  
      var buffer = hexToBytes(filtered);
    }
    var res = decodeRaw(fport, buffer);
    setOutput(res);
    var hex_buf = buffer.reduce((a, b) => a + b.toString(16).padStart(2, '0'), '')
    replaceUrlParams(fport, hex_buf);
}

document.getElementById('payload_raw').addEventListener('input', dataInputHandler);  
document.getElementById('fport').addEventListener('input', dataInputHandler);  
document.getElementById('payload_is_base64').addEventListener('input', dataInputHandler);
document.getElementById('payload_is_base64').addEventListener('input', base64InputHandler);  

</script>

</body>
</html>
`;

const html_filename = script_filename.replace('.js', '.html');
fs.writeFileSync(html_filename, html);
