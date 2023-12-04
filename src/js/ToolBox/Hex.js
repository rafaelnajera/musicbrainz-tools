

export class Hex {


    static isHex(h) {
       return /^[0-9A-F].*$/i.test(h)
    }

}