import { decode_mbus } from '../src/util/tmbus_wrapper'

describe('tmbus', () => {
    test('volume1', () =>{
        var hex = '0C1483045933';
        expect(decode_mbus(hex)).toEqual({volume__m3: 335904.83})
    });
    test('volume2', () =>{
        var hex = '0C943B57095933';
        expect(decode_mbus(hex)).toEqual({volume_accumulated_pos__m3: 335909.57})
    });
    test('volume3', () => {
        var hex = '0C943C74040000';
        expect(decode_mbus(hex)).toEqual({volume_accumulated_neg__m3: 4.74});
    });

    test('volume_flow', () => {
        var hex = '0B3B087300';
        expect(decode_mbus(hex)).toEqual({volume_flow__m3_per_h: 7.308});
    });

    test('flow_temp', () => {
        var hex = '0A5A1301';
        expect(decode_mbus(hex)).toEqual({flow_temperature__degC: 11.3});
    });

    test('error_flag', () => {
        var hex = '04FD1700002000';
        expect(decode_mbus(hex)).toEqual({error_flags__binary: '0x00200000'});
    });

    test('time1', () => {
        var hex = '046D3937E12A';
        expect(decode_mbus(hex)).toEqual({time_point: '2023-10-01T23:57'});
    });

    test('time2', () => {
        var hex = '426CDF2C';
        expect(decode_mbus(hex)).toEqual({storage1_time_point: '2022-12-31'});
    });

    test('time3', () => {
        var hex = '82016CDF2C';
        expect(decode_mbus(hex)).toEqual({storage2_time_point: '2022-12-31'});
    });

    test('storage_volume', () => {
        var hex = '4C1490180222';
        expect(decode_mbus(hex)).toEqual({storage1_volume__m3: 220218.9});
    });
    test('cumulation_counter', () => {
        var hex = '04FD6140E20100';
        expect(decode_mbus(hex)).toEqual({cumulation_counter: 123456});
    });
    test('energy_subunit', () => {
        var hex = '84400240E20100';
        expect(decode_mbus(hex)).toEqual({subunit1_energy__Wh: 12345.6});
    });
    test('subunit_storage_tariff', () => {
        var hex = '84720240E20100';
        expect(decode_mbus(hex)).toEqual({storage4_subunit1_tariff3_energy__Wh: 12345.6});
    });
});
