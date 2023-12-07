

export class Relation {

    static getDateString(relation) {
        let str = ''
        let begin = ''
        let end = ''
        if (relation['begin'] !== undefined && relation['begin'] !== null) {
           begin = relation['begin']
        }
        if (relation['end'] !== undefined && relation['end'] !== null) {
           end = relation['end']
        }
        if (begin === '' && end === '') {
            return ''
        }
        if (begin === end) {
            return begin
        }
        return `${begin} - ${end}`
    }
}