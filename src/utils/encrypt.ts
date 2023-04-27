import { state } from "../state";
import { IRilogRequestItem } from "../types";

/**
 * Encryt request data for save request array
 * @param data
 */
const encrypt = (data: IRilogRequestItem[]): string => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), state.salt || '').toString();
};

export { encrypt };
