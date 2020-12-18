const fsPromise = require('fs').promises

export class Logger {

    // private file: string = './log/facial-server.log'

    public log(message: string) {
        console.log(message)
        this.saveLog('Log ', message)
    }

    public warn(message: string) {
        console.warn(message)
        this.saveLog('Warn', message)
    }

    public error(message: string) {
        console.error(message)
        this.saveLog('Err ', message)
    }

    public reqLog(message: string) {
        console.log(message)
        this.saveLog('Req ', message)
    }

    // public async checkLogFiles() {

    //     const month = this.extendNumber(parseInt(('0' + (new Date(Date.now()).getMonth() + 1)).slice(-2), 10), 2)
    //     const year = this.extendNumber(new Date(Date.now()).getFullYear(), 4)
    //     const date = `${year}-${month}`
    //     console.log('date', date)

    //     const lastMonth = this.extendNumber(parseInt(('0' + (new Date((Date.now() - 2629800000)).getMonth() + 1)).slice(-2), 10), 2)
    //     const lastYear = this.extendNumber(new Date(Date.now() - 2629800000).getFullYear(), 4)
    //     const lastDate = `${lastYear}-${lastMonth}`
    //     console.log('lastDate', lastDate)

    //     const superLastMonth = this.extendNumber(parseInt(('0' + (new Date((Date.now() - 2629800000 * 2)).getMonth() + 1)).slice(-2), 10), 2)
    //     const superLastYear = this.extendNumber(new Date(Date.now() - 2629800000 * 2).getFullYear(), 4)
    //     const superLastDate = `${superLastYear}-${superLastMonth}`
    //     console.log('superLastDate', superLastDate)

    //     try {
    //         await fsPromise.stat(`./log/facial-server-${superLastDate}`)
    //         // Si on arrive là, ce qui signifie que le fichier le log
    //     } catch (error) {

    //     }

    //     // console.log('Ok,', Date.now() - (await fsPromise.stat('./log/facial-server.log')).birthtimeMs - 60000)
    //     // if (Date.now() - (await fsPromise.stat('./log/facial-server.log')).birthtimeMs >= 60000) {

    //     //     console.log('STARTING PROCESS')

    //     //     // await fsPromise.writeFile('./log/lock.tmp')
    //     // await fsPromise.copyFile('./log/facial-server.log', './log/old-facial-server.log')
    //     // await fsPromise.unlink('./log/facial-server.log')
    //     //     // await fsPromise.unlink('./log/lock.tmp')

    //     //     console.log('ENDING PROCESS')

    //     // }
    //     // else {
    //     //     console.log('--- There is no need to update')
    //     // }
    //     setTimeout(() => { this.checkLogFiles() }, 60000)
    // }

    private async saveLog(level: string, message: string) {

        try {

            const month = this.extendNumber(parseInt(('0' + (new Date(Date.now()).getMonth() + 1)).slice(-2), 10), 2)
            const year = this.extendNumber(new Date(Date.now()).getFullYear(), 4)
            const file: string = `./log/${year}-${month}.log`

            let text = `${level} [${this.getDate()}] ${message}\r\n`
            await fsPromise.appendFile(file, text)

        } catch (error) {
            console.warn('An error has been avoided in the logging system.', error)
        }

    }

    // ...

    // private static async saveLog(level: string, message: string) {

    //     try {

    //         let stay: boolean = true
    //         do {
    //             console.log('pass ...', message.slice(0, 7))
    //             if (!(await this.checkLogFiles())) {
    //                 console.log('OkOk ...', message.slice(0, 7))
    //                 let text = `${level} [${this.getDate()}] ${message}\r\n`
    //                 await fsPromise.appendFile(this.file, text)
    //                 stay = false
    //             }
    //             else {
    //                 console.log('wait ...', message.slice(0, 7))
    //             }
    //         } while (stay)

    //     } catch (error) {

    //         console.warn('An error has been avoided in the logging system.', error)

    //     }

    // }

    // private static async checkLogFiles(): Promise<boolean> {

    //     try {

    //         // console.log((await fsPromise.stat('./log/facial-server.log')).birthtimeMs)
    //         console.log(`${Date.now() - parseInt((await fsPromise.stat('./log/facial-server.log')).birthtimeMs, 10)} >= 6000 :`, Date.now() - (await fsPromise.stat('./log/facial-server.log')).birthtimeMs >= 60000)

    //         if (Date.now() - (await fsPromise.stat('./log/facial-server.log')).birthtimeMs >= 60000) {
    //             // if (false) {
    //             // console.log('TOP')

    //             try {
    //                 await fsPromise.stat('./log/sshIAmUgly.tmp')
    //                 console.log('PROCESS AVOIDED')
    //                 // setTimeout(() => { return true }, 1000)
    //                 return true
    //             } catch (error) {
    //                 console.log('STARTING PROCESS')
    //                 await fsPromise.writeFile('./log/sshIAmUgly.tmp', '')
    //                 await fsPromise.copyFile('./log/facial-server.log', './log/old-facial-server.log')
    //                 await fsPromise.unlink('./log/facial-server.log')

    //                 await fsPromise.unlink('./log/sshIAmUgly.tmp')
    //                 console.log('ENDING PROCESS')
    //                 // setTimeout(async () => { await fsPromise.unlink('./log/sshIAmUgly.tmp'); console.log('ENDING PROCESS') }, 1000)
    //                 return true
    //             }

    //         }
    //         else {
    //             console.log('PASSE COP1')
    //             return false
    //         }

    //     } catch (error) {

    //         if (error.syscall !== 'stat') {
    //             console.log('???')
    //             throw error
    //         }
    //         return false

    //     }

    // }

    private extendNumber(value: number, extraZero: number) {
        const valueStr: string = value.toString()
        if (valueStr.length < extraZero) {
            let zeroStr: string = ''
            for (let index = 0; index < extraZero - valueStr.length; index++) {
                zeroStr += '0'
            }
            return zeroStr + valueStr
        }
        else {
            return valueStr
        }
    }

    private getDate() {

        let dateOb = new Date()
        let day = this.extendNumber(parseInt(('0' + dateOb.getDate()).slice(-2), 10), 2)
        let month = this.extendNumber(parseInt(('0' + (dateOb.getMonth() + 1)).slice(-2), 10), 2)
        let year = this.extendNumber(dateOb.getFullYear(), 4)
        let hours = this.extendNumber(dateOb.getHours(), 2)
        let minutes = this.extendNumber(dateOb.getMinutes(), 2)
        let seconds = this.extendNumber(dateOb.getSeconds(), 2)

        return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds
    }



}