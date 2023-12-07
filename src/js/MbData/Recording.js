import {Relation} from "./Relation";


export class Recording {

    static inferDate(recData) {
        let dates = this.getDates(recData)
        if (dates.length === 0) {
            return '????'
        }
        if (dates.length === 1) {
            return dates[0]
        }
        return dates.join(', ')
    }

    static getDates(recData) {
        if (recData === undefined || recData === null ||recData['relations'] === undefined) {
            return []
        }

        let collectedDates = []
        recData['relations'].forEach( (rel) => {
            let date = Relation.getDateString(rel)
            if (date !== '') {
                if (collectedDates.indexOf(date) === -1) {
                    collectedDates.push(date)
                }
            }
        })
        return collectedDates
    }
}