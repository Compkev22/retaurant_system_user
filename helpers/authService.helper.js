'use strict';

import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

export const authServiceClient = axios.create({
    baseURL: AUTH_SERVICE_URL,
    timeout: 10000,
});

/**
 * El Auth-Service (C#) espera [FromForm] -> multipart/form-data
 */
export const buildAuthForm = (fields = {}) => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            form.append(key, value);
        }
    });
    return form;
};

/**
 * Normaliza la respuesta del Auth-Service (PascalCase/camelCase)
 */
export const pickField = (obj = {}, ...keys) => {
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
};