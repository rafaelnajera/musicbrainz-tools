import {Mbid} from "../ToolBox/Mbid";
import {UrlFor} from "../UrlGenerator/UrlFor";
import {Wait} from "../ToolBox/Wait";


export class ArtistRecordingsToolPage {

    constructor(contentSelector, mbid) {
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

    async loadData() {
        this.artistData.html('Loading artist data...')
        this.recordingsListDiv.html('')
        let resp = await fetch(UrlFor.apiArtistData(this.artistMbid))
        let data = await resp.json()
        console.log(`Got data for artist`)
        console.log(data)
        this.data = data
        this.artistData.html(this.getArtistDataHtml())
        this.recordingsDataStatus.html('Getting recordings data...')
        await Wait.oneTick()
        let recResp = await fetch(UrlFor.apiArtistRecordings(this.artistMbid))
        let recordingsData = await recResp.json()
        console.log(`Got recordings data`)
        console.log(recordingsData)

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
            return rec
        })
        this.recordingsListDiv.html(this.getRecordingsListHtml())
        this.data['recordings'] = this.data['recordings'].map( async (rec, index) => {
            if (!rec['detailsLoaded']) {
                let infoP = $(`${this.contentSelector} p.recording-details-not-loaded-${index}`)
                infoP.html(`Loading more details...`)
                let  recDetailsResp = await fetch(UrlFor.apiRecordingData(rec['id']))
                rec['details'] = await recDetailsResp.json()
                infoP.html('')
                return rec
            }
        })
    }



    getArtistDataHtml() {
        return `<h3>${this.data['name']}</h3>
            <p>Type: ${this.data['type']}</p>
`
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

    getRecordingsListHtml() {
        let recs = this.data['recordings']

        let divs = []
        recs.forEach( (rec, index) => {
            divs.push(`<div class="recording-number recording-number-${index}">${index+1}</div>`)
            let pars = [];
            pars.push( { classes: ['recording-title'], html: `${rec.title}` })
            pars.push( { classes: ['recording-mbid'], html: `MBID: ${rec.id}`})
            if (rec['artist-credit'] !== undefined) {
                let artistCreditParHtml = 'Artists: ' + rec['artist-credit'].map( (ac) => {
                    return `<a href="${UrlFor.siteToolArtistRecordings(ac['artist']['id'])}">${ac['name']}</a>`
                }).join(', ')
                pars.push({ classes: [ 'recording-artist'], html: artistCreditParHtml})
            }
            if (!rec['detailsLoaded']) {
                pars.push({ classes: ['recording-details-not-loaded'], html: 'More details coming up...'})
            }
            let div = `<div class="recording-info recording-info-${index}">`
            pars.forEach( (par) => {
                let parClasses = []
                parClasses.push(...par['classes'])
                par['classes'].forEach( (c) => { parClasses.push(`${c}-${index}`)})
                div += `<p class="${parClasses.join(' ')}">${par['html']}</p>`
            })

            div += '</div>'
            divs.push(div)
        })
        return divs.join('')
    }

}

window.ArtistRecordingsToolPage = ArtistRecordingsToolPage