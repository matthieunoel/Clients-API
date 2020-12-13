const uuidv1 = require('uuid/v1')
const fs = require('fs')
const fsPromise = require('fs').promises
const Database = require('better-sqlite3')

import { performance } from 'perf_hooks'
import { couldStartTrivia } from 'typescript'
import { Config } from '../app'
import { IClient, IClientResult, IError, ILogin, ITokenResult, ITokenTestResponse, ITolenValidityResponse } from './root.interfaces'
import { Logger } from './root.logSystem'

export class RootService {

    private logger: Logger = new Logger()

    public async checkFolders() {

        try {
            fs.mkdirSync('./db/')
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error
            }
        }

        try {
            fs.mkdirSync('./tmp/')
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error
            }
        }

        try {
            fs.mkdirSync('./log/')
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error
            }
        }

    }

    public async InitDB() {

        const perfStart = performance.now()
        const uuid: string = uuidv1()

        try {

            this.logger.log(`InitDB[${uuid.slice(0, 6)}.] - ` + `Database initialisation.` + ` - (${performance.now() - perfStart}ms)`)

            const db = new Database('./db/SQLite.db'/*, { verbose: this.logger.log }*/)
            let request: string = ''

            // Setting Token table
            request = 'CREATE TABLE IF NOT EXISTS token(id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT, permissions NUMERIC, expiration TEXT);'
            db.prepare(request).run()

            // Setting Client table and data
            request = 'CREATE TABLE IF NOT EXISTS client(id INTEGER PRIMARY KEY AUTOINCREMENT, guid TEXT, first TEXT, last TEXT, street TEXT, city TEXT, zip NUMERIC);'
            db.prepare(request).run()

            this.logger.log(`InitDB[${uuid.slice(0, 6)}.] - ` + `Table creation if don't exists executed successfully.` + ` - (${performance.now() - perfStart}ms)`)

            request = 'SELECT COUNT(*) as "nbLignes" FROM client'
            let res = db.prepare(request).all()

            if (res[0].nbLignes === 0) {

                this.logger.log(`InitDB[${uuid.slice(0, 6)}.] - ` + `Starting adding data from "./src/static/clients.csv"` + ` - (${performance.now() - perfStart}ms)`)

                const data: any = (await fsPromise.readFile('./src/static/clients.csv')).toString().replace('guid;first;last;street;city;zip\r\n', '').split('\r\n')

                // tslint:disable-next-line: prefer-for-of
                for (let index = 0; index < data.length; index++) {
                    const line = data[index].split(';')
                    if (line.length >= 1) {
                        request = `INSERT INTO client (guid, first, last, street, city, zip) VALUES ('${line[0]}', '${line[1]}', '${line[2]}', '${line[3]}', '${line[4]}', ${line[5]})`
                        db.prepare(request).run()
                    }
                }

                this.logger.log(`InitDB[${uuid.slice(0, 6)}.] - ` + `Data insertion : ` + ` - (${performance.now() - perfStart}ms)`)
            }

            db.close()

            this.logger.log(`InitDB[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${performance.now() - perfStart}ms)`)

        } catch (error) {
            this.logger.error(`InitDB[${uuid.slice(0, 6)}] - ` + error.toString() + ` - (${performance.now() - perfStart}ms)`)
            throw error
        }
    }

    public async getToken(login: string, password: string): Promise<ITokenResult> {

        const perfStart = performance.now()
        const uuid: string = uuidv1()

        return new Promise<ITokenResult>((resolve, reject) => {

            try {

                let loggedIn = false
                let authLevel = -1

                Config.loginList.forEach((item: ILogin, index) => {
                    if (item.login === login && item.password === password) {
                        loggedIn = true
                        authLevel = item.authLevel
                    }
                })

                if (loggedIn) {

                    const db = new Database('./db/SQLite.db'/*, { verbose: this.logger.log }*/)
                    const token = uuidv1()
                    let request: string = `INSERT INTO token (token, permissions, expiration) VALUES ('${token}', ${authLevel}, datetime('now', 'localtime', '+${Config.tokenDuration} minutes'))`
                    db.prepare(request).run()

                    const perfEnd = performance.now() - perfStart
                    this.logger.log(`getToken[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)
                    return resolve({
                        status: 'OK',
                        performanceMs: perfEnd,
                        token
                    })
                }
                else {
                    const perfEnd = performance.now() - perfStart
                    let errMsg = `The login or password is incorrect`
                    this.logger.error(`getToken[${uuid.slice(0, 6)}.] - ` + errMsg + ` - (${performance.now() - perfStart}ms)`)
                    return reject({
                        'status': 'KO',
                        'performanceMs': perfEnd,
                        'responseSize': 0,
                        'errors': [{
                            code: 11,
                            message: errMsg
                        }]
                    })
                }

            } catch (error) {
                const perfEnd = performance.now() - perfStart
                this.logger.error(`getToken[${uuid.slice(0, 6)}.] - ` + error.name + ' ' + error.message + ` - (${perfEnd}ms)`)
                return reject({
                    'status': 'KO',
                    'performanceMs': perfEnd,
                    'responseSize': 0,
                    'errors': [{
                        code: 10,
                        message: error.name + ' ' + error.message
                    }]
                })
            }


        })
    }

    public async getClients(token: string, id: number, guid: string, first: string, last: string, street: string, city: string, zip: number): Promise<IClientResult> {

        const perfStart = performance.now()
        const uuid: string = uuidv1()

        return new Promise<IClientResult>(async (resolve, reject) => {

            try {

                const db = new Database('./db/SQLite.db'/*, { verbose: this.logger.log }*/)
                let request: string = ''
                let conditions: string = ''
                let errors: IError[] = []

                if (Config.authentication) {
                    if (!(await this.testToken(token, 10, true))) {
                        const perfEnd = performance.now() - perfStart
                        let errMsg = `The token is invalid or don't have the right permissions.`
                        if (token === undefined) {
                            errMsg = `The token is missing.`
                        }
                        this.logger.error(`getClients[${uuid.slice(0, 6)}.] - ` + errMsg + ` - (${performance.now() - perfStart}ms)`)
                        return reject({
                            'status': 'KO',
                            'performanceMs': perfEnd,
                            'responseSize': 0,
                            'errors': [{
                                code: 12,
                                message: errMsg
                            }]
                        })
                    }
                }

                if (isNaN(id) && id !== undefined) {
                    errors.push({
                        code: 21,
                        message: `La valeur passée via id n'est pas un nombre.`
                    })
                }
                if (isNaN(zip) && zip !== undefined) {
                    errors.push({
                        code: 27,
                        message: `La valeur passée via zip n'est pas un nombre.`
                    })
                }

                if (errors.length > 0) {
                    const perfEnd = performance.now() - perfStart
                    let errorMsg = ''
                    errors.forEach((item, index) => {
                        if (errorMsg === '') {
                            errorMsg = errors[index].message
                        }
                        else {
                            errorMsg += ', ' + errors[index].message
                        }
                    })
                    this.logger.error(`getClients[${uuid.slice(0, 6)}.] - ` + errorMsg + ` - (${performance.now() - perfStart}ms)`)
                    return reject({
                        'status': 'KO',
                        'performanceMs': perfEnd,
                        'responseSize': 0,
                        errors
                    })
                }

                request = 'SELECT * FROM client'

                if (id !== undefined) {
                    if (conditions === '') {
                        conditions = ` WHERE id=${id}`
                    }
                    else {
                        conditions += ` AND id=${id}`
                    }
                }
                if (guid !== undefined) {
                    if (conditions === '') {
                        conditions = ` WHERE guid='${this.formatStrForSQL(guid)}'`
                    }
                    else {
                        conditions += ` AND guid='${this.formatStrForSQL(guid)}'`
                    }
                }
                if (first !== undefined) {
                    if (conditions === '') {
                        conditions = ` WHERE first like '%${this.formatStrForSQL(first)}%'`
                    }
                    else {
                        conditions += ` AND first like '%${this.formatStrForSQL(first)}%'`
                    }
                }
                if (last !== undefined) {
                    if (conditions === '') {
                        conditions = ` WHERE last like '%${this.formatStrForSQL(last)}%'`
                    }
                    else {
                        conditions += ` AND last like '%${this.formatStrForSQL(last)}%'`
                    }
                }
                if (street !== undefined) {
                    if (conditions === '') {
                        conditions = ` WHERE street like '%${this.formatStrForSQL(street)}%'`
                    }
                    else {
                        conditions += ` AND street like '%${this.formatStrForSQL(street)}%'`
                    }
                }
                if (city !== undefined) {
                    if (conditions === '') {
                        conditions = ` WHERE city like '%${this.formatStrForSQL(city)}%'`
                    }
                    else {
                        conditions += ` AND city like '%${this.formatStrForSQL(city)}%'`
                    }
                }
                if (zip !== undefined) {
                    if (conditions === '') {
                        conditions = ` WHERE zip = ${zip}`
                    }
                    else {
                        conditions += ` AND zip = ${zip}`
                    }
                }

                request += conditions + ';'

                this.logger.log(`getClients[${uuid.slice(0, 6)}.] - ` + `Executing request : ${request}` + ` - (${performance.now() - perfStart}ms)`)

                let res: IClient[] = db.prepare(request).all()

                const perfEnd = performance.now() - perfStart
                this.logger.log(`getClients[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)
                return resolve({
                    'status': 'OK',
                    'performanceMs': perfEnd,
                    'responseSize': res.length,
                    'response': res
                })

            }
            catch (error) {
                // throw error
                const perfEnd = performance.now() - perfStart
                this.logger.error(`getClients[${uuid.slice(0, 6)}.] - ` + error.name + ' ' + error.message + ` - (${perfEnd}ms)`)
                return reject({
                    'status': 'KO',
                    'performanceMs': perfEnd,
                    'responseSize': 0,
                    'errors': [{
                        code: 20,
                        message: error.name + ' ' + error.message
                    }]
                })
            }


        })


    }

    async getLogs(token: string, paramUuid: string, all: boolean, dateStart: string, dateEnd: string) {

        const perfStart = performance.now()
        const uuid: string = uuidv1()

        return new Promise<string>(async (resolve, reject) => {
            try {

                if (Config.authentication) {
                    if (!(await this.testToken(token, 0, true))) {
                        const perfEnd = performance.now() - perfStart
                        let errMsg = `The token is invalid or don't have the right permissions.`
                        if (token === undefined) {
                            errMsg = `The token is missing.`
                        }
                        this.logger.error(`getLogs[${uuid.slice(0, 6)}.] - ` + errMsg + ` - (${performance.now() - perfStart}ms)`)
                        return reject({
                            'status': 'KO',
                            'performanceMs': perfEnd,
                            'responseSize': 0,
                            'errors': [{
                                code: 12,
                                message: errMsg
                            }]
                        })
                    }
                }

                let res: string = ''
                const month = await this.extendNumber(parseInt(('0' + (new Date(Date.now()).getMonth() + 1)).slice(-2), 10), 2)
                const year = await this.extendNumber(new Date(Date.now()).getFullYear(), 4)
                const actualLogPath: string = `./log/${year}-${month}.log`

                let logsList: string[] = []

                if (all) {

                    const files = await fsPromise.readdir('./log/')

                    for (let index = 0; index < files.length; index++) {
                        const file = files[index]
                        logsList.push(...(await fsPromise.readFile(`./log/${file}`)).toString().split('\r\n'))
                    }

                    this.logger.log(`getLogs[${uuid.slice(0, 6)}.] - ` + `Parameter "all" used succesfully` + ` - (${performance.now() - perfStart}ms)`)

                }
                else {

                    logsList.push(...(await fsPromise.readFile(actualLogPath)).toString().split('\r\n'))

                }

                if (paramUuid != undefined) {

                    const tmpList: string[] = logsList
                    logsList = []

                    for (let index = 0; index < tmpList.length; index++) {
                        const log = tmpList[index]
                        if (log.toString().includes(`[${paramUuid.slice(0, 6)}.]`)) {
                            logsList.push(log)
                        }
                    }

                    this.logger.log(`getLogs[${uuid.slice(0, 6)}.] - ` + `Parameters "guestId" or "uuid" used succesfully` + ` - (${performance.now() - perfStart}ms)`)

                }

                if (dateStart != undefined) {

                    const dateReference: Date = new Date(dateStart)

                    const tmpList: string[] = logsList
                    logsList = []

                    for (let index = 0; index < tmpList.length; index++) {
                        const log = tmpList[index]
                        const comparedDate: Date = new Date(tmpList[index].slice(6, 25).replace(' ', 'T'))
                        if (comparedDate >= dateReference) {
                            logsList.push(log)
                        }
                    }

                    this.logger.log(`getLogs[${uuid.slice(0, 6)}.] - ` + `Parameter "dateStart" used succesfully` + ` - (${performance.now() - perfStart}ms)`)

                }

                if (dateEnd != undefined) {

                    const dateReference: Date = new Date(dateEnd)

                    const tmpList: string[] = logsList
                    logsList = []

                    for (let index = 0; index < tmpList.length; index++) {
                        const log = tmpList[index]
                        const comparedDate: Date = new Date(tmpList[index].slice(6, 25).replace(' ', 'T'))
                        if (comparedDate <= dateReference) {
                            logsList.push(log)
                        }
                    }

                    this.logger.log(`getLogs[${uuid.slice(0, 6)}.] - ` + `Parameter "dateEnd" used succesfully` + ` - (${performance.now() - perfStart}ms)`)

                }

                if (logsList.length > 0) {

                    for (let index = 0; index < logsList.length; index++) {
                        const log = logsList[index]
                        if (log !== '') {
                            res += `${await this.extendNumber(index + 1, (logsList.length + 1).toString().split('').length)} - ${log}\r\n`
                        }
                    }

                } else {
                    res = 'There are no logs'
                }

                const perfEnd: number = performance.now() - perfStart
                this.logger.log(`getLogs[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)

                return resolve(res)

            } catch (error) {

                this.logger.error(`getLogs[${uuid.slice(0, 6)}.] - ` + error.toString() + ` - (${performance.now() - perfStart}ms)`)
                return reject(`Erreur dans la lecture des logs : ${error.name} ${error.message}`)

            }
        })

    }

    public getTokenValidity(token: string) {
        const perfStart = performance.now()
        const uuid: string = uuidv1()

        return new Promise<ITolenValidityResponse>(async (resolve, reject) => {

            try {

                if (Config.authentication) {
                    const res: ITokenTestResponse = (await this.testToken(token, 10, false)) as ITokenTestResponse
                    if (!res.validity) {
                        const perfEnd = performance.now() - perfStart
                        if (token === undefined) {
                            let errMsg = `The token is missing.`
                            this.logger.error(`getClients[${uuid.slice(0, 6)}.] - ` + errMsg + ` - (${performance.now() - perfStart}ms)`)
                            return reject({
                                'status': 'KO',
                                'performanceMs': perfEnd,
                                'responseSize': 0,
                                'errors': [{
                                    code: 12,
                                    message: errMsg
                                }]
                            })
                        }
                        else {
                            return resolve({
                                'status': 'OK',
                                'performanceMs': perfEnd,
                                'responseSize': 1,
                                'response': [{
                                    'validity': false,
                                    'deathDate': new Date(res.expiration)
                                }]
                            })
                        }
                    }
                    else {
                        const perfEnd = performance.now() - perfStart
                        this.logger.log(`getTokenValidity[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)
                        return resolve({
                            'status': 'OK',
                            'performanceMs': perfEnd,
                            'responseSize': 1,
                            'response': [{
                                'validity': true,
                                'deathDate': new Date(res.expiration)
                            }]
                        })
                    }
                }
                else {
                    const perfEnd = performance.now() - perfStart
                    this.logger.log(`getTokenValidity[${uuid.slice(0, 6)}.] - ` + `Process completed successfully.` + ` - (${perfEnd}ms)`)
                    return resolve({
                        'status': 'OK',
                        'performanceMs': perfEnd,
                        'responseSize': 1,
                        'response': [{
                            'validity': true,
                            'deathDate': '-'
                        }]
                    })
                }
            }
            catch (error) {
                // throw error
                const perfEnd = performance.now() - perfStart
                this.logger.error(`getClients[${uuid.slice(0, 6)}.] - ` + error.name + ' ' + error.message + ` - (${perfEnd}ms)`)
                return reject({
                    'status': 'KO',
                    'performanceMs': perfEnd,
                    'responseSize': 0,
                    'errors': [{
                        code: 20,
                        message: error.name + ' ' + error.message
                    }]
                })
            }


        })
    }

    private async extendNumber(value: number, extraZero: any) {
        const valueStr: string = value.toString()
        if (valueStr.length < extraZero) {
            let zeroStr: string = ''
            for (let index = 0; index < extraZero - valueStr.length; index++) {
                zeroStr += '0'
            }
            return zeroStr + valueStr
        }
        else {
            // this.logger.warn(`It would be time to purge the base, this warning appears only if the id value is higher than a number with ${extraZero} numerals`)
            return valueStr
        }
    }

    private async testToken(token: string, permissionAsked: number, onlyBooleanReturn: boolean): Promise<boolean | ITokenTestResponse> {

        return new Promise<boolean | ITokenTestResponse>((resolve, reject) => {

            if (token === undefined) {
                return resolve(false)
            }
            else {

                let validity: boolean

                token = this.formatStrForSQL(token)

                const db = new Database('./db/SQLite.db'/*, { verbose: this.logger.log }*/)
                const request: string = `SELECT permissions, expiration FROM token WHERE token = '${token}';`
                const res: ITokenTestResponse[] = db.prepare(request).all()

                if (res.length === 0) {
                    validity = false
                }
                else if ((Config.tokenDuration > 0) && (permissionAsked < res[0].permissions || new Date(res[0].expiration) < new Date())) {
                    validity = false
                }
                else {
                    validity = true
                }

                if (onlyBooleanReturn) {
                    return resolve(validity)
                }
                else {
                    if (validity) {
                        res[0].validity = validity
                    }
                    else {
                        res.push({
                            expiration: '-',
                            permissions: -1
                        })
                        res[0].validity = validity
                    }

                    return resolve(res[0])
                }

            }


        })
    }

    // To prevent some SQL Injections
    private formatStrForSQL(input: string): string {
        return decodeURIComponent(input).replace(/'/g, '\'\'')
    }


}
