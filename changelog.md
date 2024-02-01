# Version 0.8 01.02.2024 (Breaking changes)
  - Removal of '_' in front of the parameter names on following devices: {CM30xx_2_3_x, UM30xx_4_0_X}. __NB! Breaking change__
  - Added UL20xx_1_1_x javascript encoder.
  - Added UL20xx_1_1_x uplink and downlink with combined decoder & encoder in TTN format.
  - Changed invalid_header to invalid_packet_type on next devices: {im30xx_0_9_x, cm30xx_2_3_x, ul20xx_1_0_x, ul20xx_1_1_x, um30xx_4_0_x}.
  - Output always contains errors and warnings lists even if empty.

# Version 0.7 15.01.2024 (Breaking change)
  - Removal of formatter options in the html live decoder. Everything is now formatted as { "key__unit": value }.
  - UL20xx 1.0.x and 1.1.x decoder style unified to { "key__unit": value } format. __NB! Breaking change__.

# Version 0.6 10.01.2024
  - IM30xx_0_9_x decoder added
  - UM30xx M-Bus frame decoding

# Version 0.5 28.11.2023
  - UM30xx mbus_data_records_unparsed renamed to mbus_data_records_raw
  - CM30xx meter_nominal_flow__{unit} renamed to meter_nominal_flow__{unit}_per_h
  - CM30xx alert_broken_pipe_threshold__{unit} renamed to alert_broken_pipe_threshold__{unit}_per_h

# Version 0.4 03.11.2023
  - UL20xx 1.1.x status_packet's rtc_com_error renamed to ext_rtc_warning

# Version 0.3 11.10.2023
  - UL20xx 1.1.x status_config_packet's staus_interval fixed to status_interval
  - UL20xx 1.1.x Unaddressed DALI driver warning added to boot_packet
  - UL20xx 1.1.x new status_packet implemented
  - UL20xx 1.1.x new light_sensor_config_packet and new dig_input_config_packet implemeted (backwards compatible)
  - UM30xx serial extension implemented
  - UL20xx lumalink_config_packet added

# Version 0.2 04.01.2023
  - UL20xx Status byte ignored if 0xFF
  - UL20xx decoder warnings more consistent.

# Version 0.1 23.11.2022
  - UL20xx decoder with different output formatting options
  - CM30xx decoder with different output formatting options
  - UM30xx decoder with different output formatting options
