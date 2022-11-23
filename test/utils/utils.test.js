import {BitExtract, BinaryExtract} from '../../src/util/extract.js';

describe("BitExtract tests", () => {
    test("grab entire byte from 0xAC", () => {
        var bitView = new BitExtract(0xAC);
        expect(bitView.getBits(8)).toEqual(0xAC);
    });        

    test("grab bits one by one from 0xAC", () => {
        var bitView = new BitExtract(0xAC);
        expect(bitView.getBits(1)).toEqual(false);
        expect(bitView.getBits(1)).toEqual(false);
        expect(bitView.getBits(1)).toEqual(true);
        expect(bitView.getBits(1)).toEqual(true);
        expect(bitView.getBits(1)).toEqual(false);
        expect(bitView.getBits(1)).toEqual(true);
        expect(bitView.getBits(1)).toEqual(false);
        expect(bitView.getBits(1)).toEqual(true);
    });

    test("grab bits by junks from 0xAC", () => {
        var bitView = new BitExtract(0xAC);
        expect(bitView.getBits(3)).toEqual(0x4);
        expect(bitView.getBits(3)).toEqual(0x5);
        expect(bitView.getBits(2)).toEqual(0x2);
    });
});
