

export class UrlFor {

    static siteHome() {
        return '/'
    }

    /**
     *
     * @param {string} mbid
     * @returns {string}
     */
    static siteToolArtistRecordings(mbid = '') {
        return `/tool/artist/recordings${mbid!== '' ? '/' + mbid : ''}`
    }

    /**
     *
     * @param {string}mbid
     * @returns {string}
     */
    static apiArtistData(mbid) {
        return `/api/artist/${mbid}/data`
    }

    /**
     *
     * @param {string} mbid
     * @returns {string}
     */
    static apiRecordingData(mbid) {
        return `/api/recording/${mbid}/data`
    }

    /**
     *
     * @param {string}mbid
     * @param {number}offset
     * @returns {string}
     */
    static apiArtistRecordings(mbid, offset = 0) {
        return `/api/artist/${mbid}/recordings${offset !== 0 ? '/' + offset : ''}`
    }


}