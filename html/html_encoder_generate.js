import * as fs from 'fs';

if (process.argv.length < 4) {
  throw Error('Missing device title and/or firmware as arguments');
}

var device_name = process.argv[2];
var device_firmware = process.argv[3];
console.log('Generating for: ' + device_name + ' ' + device_firmware);
if (device_name == 'UL20xx') {
  var device_firmware_str = device_firmware;
if (device_firmware == '1.1.x') {
    var supported_devices = 'Supported devices: UL2002, UL2014, UL2020, UL2021, UL2023, UL2030, UL2031, UL2033, UL2053 with 1.1.x firmwares.';
    var script_filename = 'generated/ul20xx_1_1_x_encoder.js';
    var packet_lookup = 'html/extra_html_files/ul20xx_encoder_packet_lookup.js'
    var decoder_file = 'generated/ul20xx_1_1_x_decoder.js';
  } else {
    throw Error('ERROR, unrecognized firmware version: ' + device_firmware);
  }
}
var generated_at = new Date().toISOString();
var codec_script = fs.readFileSync(script_filename).toString();
var decoder_script = fs.readFileSync(decoder_file).toString();
var packet_table = fs.readFileSync(packet_lookup).toString();
var html = `
<!DOCTYPE html>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<html>
<head>
<style>
    body {background-color: white; font-family: Helvetica; font-weight: lighter; margin: 0px;}
    h2   {background-color: #004f9e; color: white; font-weight:normal; padding: 10px; margin-block-start:0em;}
    label2 {padding: 10px; margin-block-start:0em;}
    pre  {font-family: monospace; font-size: 9.5pt;}
    span.dim {color: #bbbbbb;}
    .footer{position: fixed; text-align: left; bottom: 0px; width: 100%; color: #bbbbbb; background-color: white; padding-left: 10px; font-size: 9pt;}
</style>
</head>
<body>
<h2>NAS ` + device_name + ' Payload Encoder for ' + device_firmware_str + `</h2><br>
<label2>` + supported_devices + `</label2><br><br>
<div class="container" style="display: flex; width: 100%;">
<div style="width: 50%; float: left; padding-left: 10px;">
    <label for="config_packet_list">Packet_payloads: </label>
    <select id="configKeysDropdown"></select>
    <label for="payload_raw">Payload: </label><br>
    <textarea id="payload_raw" cols=100 rows=20></textarea><br><br>
    <br><br>
    <div id="hexandfport">
      <label for="fport">Fport: </label>
      <div id="fPort" style="display: inline-block;"></div>
      <label for="hexValue" style="margin-left: 20px">Hex: </label>
      <div id="hexValue" style="display: inline-block;"></div>
      <br><br>
    </div>
    <label for="warnings">Warnings: </label>
    <div id="warning"></div><br>
    <label for="errors">Errors: </label>
    <div id="error"></div>
  </div>
  <div style="width: 50%; float: right; padding-left: 10px;">
    <br>
    <pre><code id="payload_strick"></code></pre>
  </div>
</div>
<div class="footer">Generated at ` + generated_at + `</div>
<script>
/// CODEC JAVASCRIPT STARTS FROM HERE

` + codec_script + packet_table + decoder_script + `

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

function load_packet_lookup() {
  var queryString = window.location.search;
  var urlParams = new URLSearchParams(queryString);
  var packet = urlParams.get('packet_type');

  var selectElement = document.getElementById('configKeysDropdown');

  selectElement.innerHTML = '';
  for (var key in config_packet_list) {
    var option = document.createElement('option');
    option.text = key;
    selectElement.add(option);
  }

  if (packet && config_packet_list.hasOwnProperty(packet)) {
    selectElement.value = packet; // Select the option corresponding to the packet type
    updateFunction(packet); // Trigger the update function with the selected packet type
  } else {
    if (selectElement.options.length > 0) {
      updateFunction(selectElement.options[0].value); // Trigger the update function with the default option
    }
  }

  selectElement.addEventListener('change', function () {
    updateFunction(this.value); // Trigger the update function when an option is selected
  });
}


function updateFunction(selectedKey) {
  var jsonString = JSON.stringify(config_packet_list[selectedKey], null, 2);
  document.getElementById('payload_raw').value = jsonString;
  dataInputHandler();
  replaceURLParams(selectedKey);
}


function runOnPageLoad() {
  var queryString = window.location.search;
  var urlParams = new URLSearchParams(queryString);
  var packet = urlParams.get('packet_type');
  if (packet) {
    load_packet_lookup(packet);
  } else {
    load_packet_lookup();
  }
}

window.onload = runOnPageLoad;



window.onload = runOnPageLoad;

function bytesToHexStr(byteArr) {
  var res = '';
  for (var i = 0; i < byteArr.length; i += 1) {
    res += ('00' + byteArr[i].toString(16)).slice(-2).toUpperCase();
  }
  return res;
}

function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
  bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

function strickOutput(res) {
  var warningDiv = document.getElementById('warning');
  var errorDiv = document.getElementById("error");
  if (warningDiv.innerText.trim() || errorDiv.innerText.trim()) {
    document.getElementById('payload_strick').innerText = '';
  } else {
    var fport = document.getElementById('fPort').innerText;
    var hex = document.getElementById('hexValue').innerText;
    var buffer = hexToBytes(hex);
    var decoded = decodeRaw(parseInt(fport), buffer);
    console.log(decoded);
    var str_json = JSON.stringify(decoded, null, 2).trim();
    console.log(str_json);
    document.getElementById('payload_strick').innerText = str_json;
  }
}

function replaceURLParams(packet_type) {
  var url = new URL(window.location);
  var searchParams = url.searchParams;

  if (packet_type !== '') {
    searchParams.set('packet_type', packet_type);
  } else {
    searchParams.delete('packet_type');
  }

  var newUrl = url.protocol + '//' + url.host + url.pathname + '?' + searchParams.toString();
  window.history.replaceState({}, '', newUrl);
}

function setOutput(res) {
  var hex = bytesToHexStr(res['bytes']);
  document.getElementById("hexValue").innerText = hex;
  document.getElementById("fPort").innerText = res['fPort'];
  var warnings = res['warnings'];
  var warning_items = '';
  for (var i = 0; i< warnings.length; i++){
    warning_items += warnings[i] + '<br>';
  }
  document.getElementById('warning').innerHTML = warning_items;
  var errors = res['errors'];
  var error_items = '';
  for (var i = 0; i < errors.length; i++){
    error_items += errors[i] + '<br>';
  }
  document.getElementById("error").innerHTML = error_items;
  strickOutput()
}

var dataInputHandler = function(e) {
  var raw = document.getElementById('payload_raw').value;
  try {
      var jsonData = JSON.parse(raw);
      var res = rawEncode(jsonData);
      setOutput(res);
  } catch (error) {
      document.getElementById("error").innerHTML = error.message;
      strickOutput()
  }
}


document.getElementById('payload_raw').addEventListener('input', dataInputHandler);

</script>

</body>
</html>
`;

const html_filename = script_filename.replace('.js', '.html');
fs.writeFileSync(html_filename, html);
