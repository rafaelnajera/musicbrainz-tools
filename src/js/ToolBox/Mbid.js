import {Hex} from "./Hex";


export  class Mbid {

    /**
     * Checks if a string is a valid mbid
     * @param {string} s
     * @return {boolean}
     *
     */
    static isMbid(s) {
        let parts = s.split('-')
        for (let i = 0; i < parts.length; i++) {
            if (!Hex.isHex(parts[i])){
                console.log(`Part '${parts[i]}' not a hex number`)
                return false
            }
        }
        let fullHex = parts.join('')
        if (fullHex.length !== 32) {
            console.log(`Hex length is ${fullHex.length}, must be 32`)
            return false
        }

        return true
    }
}