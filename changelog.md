# Version 0.11.0 07.06.2024  
  - UL20xx decoder dali_unadressed_driver_found -> dali_unaddressed_driver_found
  - UL20xx 1.1.x interface_type_config_packet added
  - UL20xx 1.1.x encoder dim_notify_config_request fixed

# Version 0.10.0 12.04.2024
  - UL20xx 1.1.x decoder decodes dimming_level__percent 0xFF to 'n/a' instead of 'ignore'
  - CM30xx preliminary OMS decoding
  - warning messages streamlined

# Version 0.9.0 13.02.2024
  - Added UL20xx 1.1.x Encoder
  - Decoders now support URL inputs (fport and hex)
  - UL20xx decoder light_sensor clamp_profile renamed to light_sensor_clamps_profile
  - UL20xx deocder clamp_dig renamed to light_sensor_clamps_dig
  
  - UL20xx clamp_profile/dig -> renamed to light_sensor_clamps_profile/dig

# Version 0.8.1 05.02.2024
  - UL20xx_1_0_x & UL20xx_1_1_x changed driver_operating_time__s to driver_operation_time__h, now units are in a hour
  - UL20xx_1_0_x & UL20xx_1_1_x changed lamp_on_time__s to lamp_on_time__h, now units are in hour
  - UL20xx_1_1_x & UL20xx_1_1_x light_sensor & d4i_light_sensor 0xFFFF now display unavailable

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
