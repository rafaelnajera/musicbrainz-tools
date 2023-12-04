


export class HomePage {

    constructor(contentSelector) {

        this.contentSelector = contentSelector

        $(this.contentSelector).html(this.getHtml())
    }

    getHtml() {
        return `
            <div class="mb-tool recs-tool">
            <ol>
            <li><a href="/tool/artist/recordings">Artist Recordings</a></li>
            <li>Release Series (coming soon)</li>
            </ol>
        </div>

</div>
        
        `
    }

}

window.HomePage = HomePage