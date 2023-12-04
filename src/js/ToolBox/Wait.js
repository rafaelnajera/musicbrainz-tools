

export class Wait {

    static oneTick() {
        return new Promise( (resolve) => {
            setTimeout( () => {
                resolve()
            }, 10)

        })
    }
}