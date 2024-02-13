var config_packet_list = {
    'deprecated_ldr_input_config_packet':{"data": {
        "packet_type": "deprecated_ldr_input_config_packet",
        "ldr_off_threshold_high": 80,
        "ldr_on_threshold_low": 40,
        "trigger_alert_enabled": false
      }},
    'deprecated_dig_input_config_packet': {"data": {
        "packet_type": "deprecated_dig_input_config_packet",
        "light_on_duration__s": 30,
        "signal_edge_rising": false,
        "trigger_alert_enabled": false,
        "address": "dali_broadcast",
        "dimming_level__percent": 100
      }},
    'status_config_packet':{"data": {
        "packet_type": "status_config_packet",
        "status_interval__s": 600
      }},
    'time_config_packet':{"data": {
        "packet_type": "time_config_packet",
        "device_unix_epoch": "2020-01-16T15:23:31.000Z"
      }},
    'usage_config_packet':{"data": {
        "packet_type": "usage_config_packet",
        "usage_interval__s": 900
      }},
    'boot_delay_config_packet':{
      "data": {
        "packet_type": "boot_delay_config_packet",
        "boot_delay_range__s": 120
      }},
    'onboard_led_config_packet': {
      "data": {
        "packet_type": "onboard_led_config_packet",
        "status_led_enabled": false
      }},
    'metering_alert_config_packet': {"data": {
      "packet_type": "metering_alert_config_packet",
      "min_power__W": 5,
      "max_power__W": "alert_off",
      "min_voltage__V": 190,
      "max_voltage__V": "alert_off",
      "min_power_factor": "alert_off"
    }},
    'calendar_config_packet': {"data": {
      "packet_type": "calendar_config_packet",
      "calendar_prefers_meta_pos": false,
      "calendar_clamps_profiles": false,
      "calendar_clamps_dig": false,
      "latitude__deg": 48.77,
      "longitude__deg": 13.84,
      "sunrise_steps": [
        {
          "zenith_angle__deg": "90.83",
          "dimming_level__percent": 0
        }
      ],
      "sunset_steps": [
        {
          "zenith_angle__deg": "89.67",
          "dimming_level__percent": 25
        }
      ]
    }},
    'profile_config_packet': {"data": {
      "packet_type": "profile_config_packet",
      "profile_id": 0,
      "address": "dali_broadcast",
      "days_active": [
        "mon",
        "tue",
        "wed",
        "thu",
        "fri"
      ],
      "dimming_steps": [
        {
          "step_time": "01:00",
          "dimming_level__percent": 20
        },
        {
          "step_time": "05:30",
          "dimming_level__percent": "inactive"
        }
      ]
    }},
    'fade_config_packet': {"data": {
      "packet_type": "fade_config_packet",
      "fade_duration__s": 16
    }},
    'holiday_config_packet':{"data": {
      "packet_type": "holiday_config_packet",
      "holidays": [
        "05/01"
      ]
    }},
    'dali_monitor_config_packet': {"data": {
      "packet_type": "dali_monitor_config_packet",
      "send_dali_alert": false,
      "correct_dali_dimming_level": false,
      "periodic_bus_scan_enabled": false,
      "monitoring_interval__s": 0,
      "monitoring_interval": "disabled"
    }},
    'fallback_dim_config_packet': {"data": {
      "packet_type": "fallback_dim_config_packet",
      "fallback_dimming_level__percent": 80
    }},
    'location_config_packet': {"data": {
      "packet_type": "location_config_packet",
      "latitude__deg": 59.437022,
      "longitude__deg": 24.753536,
      "address": "Ööbiku Str. 2-16"
    }},
    'lumalink_config_packet': {"data": {
      "packet_type": "lumalink_config_packet",
      "access_mode": "always"
    }},
    'dig_input_config_packet':{"data": {
      "packet_type": "dig_input_config_packet",
      "dig_index": 1,
      "dig_mode_button": true,
      "polarity_high_or_rising": true,
      "alert_on_activation": false,
      "alert_on_inactivation": false,
      "address": "dali_broadcast",
      "active_dimming_level__percent": 100,
      "inactive_dimming_level__percent": "inactive",
      "on_delay__s": 0,
      "off_delay__s": 120
    }},
    'light_sensor_config_packet': {"data": {
      "packet_type": "light_sensor_config_packet",
      "alert_on_every_step": false,
      "light_sensor_clamps_profile": true,
      "light_sensor_clamps_dig": true,
      "interpolate_steps": true,
      "measurement_duration__s": 60,
      "address": "dali_broadcast",
      "dim_steps": [
        {
          "light_level__lx": "24.50",
          "dimming_level__percent": 60
        },
        {
          "light_level__lx": "123.4",
          "dimming_level__percent": "inactive"
        }
      ]
    }},
    'dim_notify_config_packet': {"data": {
      "packet_type": "dim_notify_config_packet",
      "random_delay__s": 90,
      "packet_limit__s": 300
    }},
    'multicast_config_packet': {"data": {
      "packet_type": "multicast_config_packet",
      "multicast_device": 0,
      "devaddr": "11223344",
      "nwkskey": "82840C7056429B143D21974557F93A53",
      "appskey": "82840C70C08494B931FE2FA6F8835C6A"
    }},
    'chained_config_packet': {"data": {
      "packet_type": "chained_config_packet",
      "payloads": [
        {
          "packet_type": "deprecated_ldr_input_config_packet",
          "ldr_off_threshold_high": 80,
          "ldr_on_threshold_low": 40,
          "trigger_alert_enabled": false
        },
        {
          "packet_type": "boot_delay_config_packet",
          "boot_delay_range__s": 600
        }
      ]
    }},
    'clear_config_packet': {"data": {
      "packet_type": "clear_config_packet",
      "reset_target": "holiday_config"
    }},
    'simple configuration requests': {"data": {
      "packet_type": "calendar_config_request"
    }},
    'activate_dfu_command': {"data": {
        "packet_type": "activate_dfu_command"
      }},
    'manual_dimming': {"data": {
      "packet_type": "manual_dimming",
      "destination": [
        {
          "address": "dali_broadcast",
          "dimming_level__percent": 100
        }
      ]
    }},
    'manual_timed_dimming': {"data": {
      "packet_type": "manual_timed_dimming",
      "destination": [
        {
          "address": "dali_broadcast",
          "dimming_level__percent": 100,
          "duration__minutes": 5
        }
      ]
    }},
    'status_usage_request': {"data": {
      "packet_type": "status_usage_request",
      "usage_requested": true,
      "status_requested": false
    }},
    'open_drain_output_control': {"data": {
      "packet_type": "open_drain_output_control",
      "open_drain_output_on": true
    }},
    'custom_dali_request': {"data": {
      "packet_type": "custom_dali_request",
      "query_data_raw": "48A1",
      "address": "dali_single_36",
      "dali_query": 161
    }},
    'custom_dali_command': {"data": {
      "packet_type": "custom_dali_command",
      "dali_command": "A300FF2DFF2D"
    }},
    'driver_memory_read': {"data": {
      "packet_type": "driver_memory_read",
      "address": "dali_single_2",
      "memory_bank": 0,
      "memory_address": 3,
      "read_size__bytes": 6
    }},
    'address_dali_driver': {"data": {
      "packet_type": "address_dali_driver",
      "address": "dali_single_9"
    }},
    'dali_identify': {"data": {
      "packet_type": "dali_identify"
    }}
    };