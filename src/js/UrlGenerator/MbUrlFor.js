

const mb_base = 'https://musicbrainz.org'
export class MbUrlFor {

    static release(mbid) {
        return `${mb_base}/release/${mbid}`
    }

    static recording(mbid) {
        return `${mb_base}/recording/${mbid}`
    }

    static place(mbid) {
        return `${mb_base}/place/${mbid}`
    }

    static work(mbid) {
        return `${mb_base}/work/${mbid}`
    }


}