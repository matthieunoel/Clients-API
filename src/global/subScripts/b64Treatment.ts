import { IPrint } from '../../root/root.controller'

export class NodeInterceptor {
    static b64UTF8PostTreatmentPicture(formData: IPrint): string {
        if (formData.last.toUpperCase() === 'RUIVO') {
            return '/spec/SP1-74360.jpg'
        } else if (formData.last.toUpperCase() === 'NOEL') {
            return '/spec/SP2-74360.jpeg'
        } else if (formData.last.toUpperCase() === 'TRILLAUD') {
            return '/spec/SP3-74360.jpg'
        } else if (formData.last.toUpperCase() === 'MAHE') {
            return '/spec/SP4-74361.png'
        }
        else {
            return ''
        }
    }
}