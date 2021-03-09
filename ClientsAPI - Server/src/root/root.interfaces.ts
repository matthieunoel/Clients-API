export interface IRootResult {
    name: any,
    version: any
}

export interface IError {
    code: number,
    message: string
}

export interface ILogin {
    login: string,
    password: string,
    authLevel: number
}

export interface ITokenResult {
    status: string,
    performanceMs: number,
    token?: string,
    errors?: IError[]
}

export interface ITokenTestResponse {
    permissions: number,
    expiration: string | Date,
    validity?: boolean
}

export interface ITokenValidityResponse {
    status: string,
    performanceMs: number,
    responseRealSize: number,
    response?: [
        {
            validity: boolean,
            deathDate: string | Date
        }
    ]
    errors?: IError[]
}

export interface IClient {
    id?: number,
    guid: string,
    first: string,
    last: string,
    street: string,
    city: string,
    zip: number
}

export interface IClientResult {
    status: string,
    performanceMs: number,
    responseRealSize: number,
    response?: IClient[]
    errors?: IError[]
}