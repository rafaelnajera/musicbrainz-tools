import {Mbid} from "../ToolBox/Mbid";
import {UrlFor} from "../UrlGenerator/UrlFor";
import {Wait} from "../ToolBox/Wait";
import {MbUrlFor} from "../UrlGenerator/MbUrlFor";
import {MemCache} from "../MemCache/MemCache";
import {Recording} from "../MbData/Recording";


export class ArtistRecordingsToolPage {

    constructor(contentSelector, mbid) {

        this.artistCache = new MemCache()
        this.workCache = new MemCache()
        this.recordingCache = new MemCache()
        this.contentSelector = contentSelector
        $(this.contentSelector).html(this.getHtml())
        this.loadBtn = $(`${this.contentSelector} button.btn-load-data`)
        this.artistInput = $(`${this.contentSelector} input.artist-input`)
        this.artistInputWarnings =  $(`${this.contentSelector} p.artist-input-warnings`)

        this.artistData = $(`${this.contentSelector} div.artist-data`)
        this.recordingsListDiv =  $(`${this.contentSelector} div.recordings-list`)
        this.recordingsDataStatus =  $(`${this.contentSelector} p.recordings-data-status`)
        this.recordingsDetailStatus =  $(`${this.contentSelector} p.recordings-detail-status`)
        let loadData = false

        if (Mbid.isMbid(mbid)) {
            this.artistInput.val(mbid)
            this.artistMbid = mbid
            loadData = true
        } else {
            this.artistInput.val(mbid)
            this.checkArtistMbid()
        }
        this.artistInput.on('input', () => {
            this.checkArtistMbid()
        })
        this.loadBtn.on('click', () => {
            this.artistMbid = this.artistInput.val()
            this.loadData().then( () => {
                console.log(`Finished loading data`)
            })
        })
        if (loadData) {
            this.loadData().then( () => {
                console.log(`Finished loading data`)
            })
        }
    }

    async getArtistData(mbid, useCache  = true) {
        if (useCache && this.artistCache.get(mbid) !== undefined) {
            return this.artistCache.get(mbid)
        }
        let resp = await fetch(UrlFor.apiArtistData(this.artistMbid))
        let data = await resp.json()
        console.log(`Got artist data for MBID ${mbid}`)
        console.log(data)
        this.artistCache.set(data.id, JSON.parse(JSON.stringify(data)))
        return data
    }

    async getRecordingData(mbid, useCache = true) {
        if (useCache && this.recordingCache.get(mbid) !== undefined) {
            return this.recordingCache.get(mbid)
        }
        let recDetailsResp = await fetch(UrlFor.apiRecordingData(mbid))
        console.log(`Got recording data for MBID ${mbid}`)
        let data = await recDetailsResp.json()
        this.recordingCache.set(data.id, JSON.parse(JSON.stringify(data)))
        return data
    }

    async getWorkData(mbid, useCache = true) {
        if (useCache && this.workCache.get(mbid) !== undefined) {
            return this.workCache.get(mbid)
        }
        let recDetailsResp = await fetch(UrlFor.apiWorkData(mbid))
        let data = await recDetailsResp.json()
        console.log(`Got work data for MBID ${mbid}`)
        this.workCache.set(data.id, JSON.parse(JSON.stringify(data)))
        return data
    }

    getComposer(workData) {
        if (workData['relations'] === undefined || workData['relations'] === null) {
            return []
        }
        for (let i = 0; i < workData['relations'].length; i++) {
            let rel = workData['relations'][i]
            if (rel['target-type'] === 'artist' && rel['type'] === 'composer') {
                return rel['artist']
            }
        }
        return []
    }

    async loadData() {
        this.artistData.html('Loading artist data...')
        this.recordingsListDiv.html('')
        this.data = await this.getArtistData(this.artistMbid)
        this.artistData.html(this.getArtistDataHtml())
        this.recordingsDataStatus.html('Getting recordings data...')
        await Wait.oneTick()
        let recResp = await fetch(UrlFor.apiArtistRecordings(this.artistMbid))
        let recordingsData = await recResp.json()

        this.data['recording-count'] = recordingsData['recording-count']
        this.data['recordings'] = recordingsData['recordings']
        let recordingListingsLoaded = this.data['recordings'].length
        let totalRecordingsCount = this.data['recording-count']
        while(recordingListingsLoaded < totalRecordingsCount) {
            this.recordingsDataStatus.html(`${totalRecordingsCount} recordings found, ${recordingListingsLoaded} loaded...`)
            recResp = await fetch(UrlFor.apiArtistRecordings(this.artistMbid, recordingListingsLoaded))
            recordingsData = await recResp.json()
            this.data['recordings'].push(...recordingsData['recordings'])
            recordingListingsLoaded = this.data['recordings'].length
        }
        this.recordingsDataStatus.html(`${totalRecordingsCount} recordings`)
        this.data['recordings'] = this.data['recordings'].map ( (rec) => {
            rec['detailsLoaded'] = false
            rec['inferredDate'] = '????'
            return rec
        })
        this.recordingsListDiv.html(this.getRecordingsListHtml())
        this.detailsLoaded = 0
        let recordingDetailStatus = $(`${this.contentSelector} p.recordings-detail-status`)
        recordingDetailStatus.html(`Loading recordings details: ${this.detailsLoaded} of ${totalRecordingsCount}`)
        for (let index = 0; index < this.data['recordings'].length; index++) {
            let rec = this.data['recordings'][index]
            if (!rec['detailsLoaded']) {
                let infoP = $(`${this.contentSelector} p.recording-details-not-loaded-${index}`)
                infoP.html(`Loading more details...`)
                rec['details'] = await this.getRecordingData(rec['id'])
                rec['inferredDate'] = Recording.inferDate(rec['details'])
                $(`${this.contentSelector} p.recording-inferred-date-${index}`).html(`Recording date: ${rec['inferredDate']}`)
                infoP.html('')
                $(`${this.contentSelector} div.recording-details-${index}`).html(await this.getRecordingDetailsHtml(rec, index))
                this.data['recordings'][index] = rec
                this.detailsLoaded++
                recordingDetailStatus.html(`Loading recordings details: ${this.detailsLoaded} of ${totalRecordingsCount}`)
            }
        }
        recordingDetailStatus.html('')
    }



    getArtistDataHtml() {

        let parts = []
        parts.push(`<h3>${this.data['name']}</h3>`)
        parts.push(`<p>Type: ${this.data['type']}</p>`)
        let birthDate = ''
        if (this.data['life-span'] !== undefined) {
            birthDate = this.getDateStringForRelation(this.data['life-span'], false)
        }
        if (birthDate !== '') {
            parts.push(`<p>Born: ${birthDate}</p>`)
        }
        return parts.join('')
    }


    checkArtistMbid() {
        let mbid = this.artistInput.val()
        if (Mbid.isMbid(mbid)) {
            this.loadBtn.attr('disabled', false)
            this.artistInputWarnings.html('')
        } else {
            this.loadBtn.attr('disabled', true)
            this.artistInputWarnings.html("Invalid MBID")
        }
    }

    getHtml() {
        return `
            <h1>Artist Recordings Tool</h1>
            <div class="artist-input-div">
                <p>MBID: <input class="artist-input" type="text"/> <button class="btn btn-primary btn-load-data">Load</button></p>
                <p class="artist-input-warnings"></p>
            </div>
           <div class="artist-data"></div>
           <div class="recordings-status">
                <p class="recordings-data-status"></p>
                <p class="recordings-detail-status"></p>
</div>
           <div class="recordings-list"></div>
        `
    }

    getLengthString(len) {
        let secs = Math.round(len / 1000)
        let min = 0
        if (secs > 60) {
            min = Math.floor(secs / 60)
            secs = secs % 60
        }
        if (secs < 10) {
            secs = `0${secs}`
        }
        return `${min}:${secs}`
    }

    getRecordingsListHtml() {
        let recs = this.data['recordings']

        let divs = []
        recs.forEach( (rec, index) => {
            let div = `<div class="recording-div recording-div-${index}">`
            div += `<div class="recording-number recording-number-${index}">${index+1}</div>`
            let pars = [];
            pars.push( { classes: ['recording-title'], html: `${rec['video'] ? '[VIDEO] ' : ''}${rec['title']}` })
            pars.push( { classes: ['recording-duration'], html: `Length: ${this.getLengthString(rec['length'])}`})
            pars.push( { classes: ['recording-mbid'], html: `MBID: <a href="${MbUrlFor.recording(rec.id)}" class="mb-link" target="_blank">${rec.id}</a>`})
            pars.push( { classes: ['recording-inferred-date'], html: `Recording Date: ${rec['inferredDate']} `})
            if (rec['artist-credit'] !== undefined) {
                let artistCreditParHtml = 'Artists: ' + rec['artist-credit'].map( (ac) => {
                    return `<a href="${UrlFor.siteToolArtistRecordings(ac['artist']['id'])}">${ac['name']}</a>`
                }).join(', ')
                pars.push({ classes: [ 'recording-artist'], html: artistCreditParHtml})
            }
            if (!rec['detailsLoaded']) {
                pars.push({ classes: ['recording-details-not-loaded'], html: '--- No details yet ---'})
            }
            div += `<div class="recording-info recording-info-${index}">`
            pars.forEach( (par) => {
                let parClasses = []
                parClasses.push(...par['classes'])
                par['classes'].forEach( (c) => { parClasses.push(`${c}-${index}`)})
                div += `<p class="${parClasses.join(' ')}">${par['html']}</p>`
            })
            div += `<div class="recording-details recording-details-${index}"></div>`
            div += '</div>'
            div += '</div>'
            divs.push(div)
        })
        return divs.join('')
    }

    getDateStringForRelation(relation, useFromTo  = true) {
        let str = ''
        if (relation['begin'] !== undefined && relation['begin'] !== null) {
            str += `${useFromTo ? 'from ' : ''}${relation['begin']}`
        }
        if (relation['end'] !== undefined && relation['end'] !== null) {
            str += `${useFromTo ? ' to ' : ' - '}${relation['end']}`
        }
        return str
    }


    async getRecordingDetailsHtml(rec, index) {
        let html =  `<div class="relations relations-${index}">`
        if (rec['details']['relations'] === undefined || rec['details']['relations'].length === 0) {
            html += `<p class="data-warning-bad">No relations set</p>`
        }  else {
            html += `Relations: <ul class="relations-list">`
            for (let relIndex = 0; relIndex < rec['details']['relations'].length; relIndex++) {
                let rel = rec['details']['relations'][relIndex]
                switch(rel['target-type']) {
                    case 'artist':
                        html += `<li>${rel['type']}: <a href="${UrlFor.siteToolArtistRecordings(rel['artist']['id'])}">${rel['artist']['name']}</a>`
                        if (rel['attributes'] !== undefined && rel['attributes'].length !== 0) {
                            html += ' [' + rel['attributes'].join(', ') + ']'
                        }
                        html += ' ' + this.getDateStringForRelation(rel)
                        html += '</li>'
                        break

                    case 'place':
                        html += `<li>${rel['type']}: <a href="${MbUrlFor.place(rel['place']['id'])}" class="mb-link" target="_blank">${rel['place']['name']}</a> ${this.getDateStringForRelation(rel)}</li>`
                        break

                    case 'work':
                        let workData = await this.getWorkData(rel['work']['id'])
                        let composerData = this.getComposer(workData)
                        let composerNameHtml = 'Unknown Composer'
                        if (composerData.id !== undefined) {
                            composerNameHtml = `<a href="${UrlFor.siteToolArtistRecordings(composerData.id)}">${composerData.name}</a>`

                        }
                        html += `<li>work ${rel['type']}: ${composerNameHtml}, <a href="${MbUrlFor.work(rel['work']['id'])}" class="mb-link" target="_blank">${rel['work']['title']}</a>  ${this.getDateStringForRelation(rel)}</li>`
                        break


                    default:
                        html += `<li>${rel['target-type']} ${rel['type']}`
                }
            }
            html += '</ul>'
        }
        if (rec['details']['releases'] === undefined || rec['details']['releases'].length === 0) {
            html += `<p class="data-warning-bad">Not used in any release</p>`
        } else {
            html += `Releases: <ul class="release-list">`
            rec['details']['releases'].forEach( (release) => {
                html += `<li><a href="${MbUrlFor.release(release['id'])}" class="mb-link" target="_blank">${release['title']}</a> (${release['date']})</li>`
            })
            html += '</ul>'
        }
        html += '</div>'
        return html
    }

}

window.ArtistRecordingsToolPage = ArtistRecordingsToolPage